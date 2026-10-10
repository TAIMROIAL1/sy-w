const mongoose = require('mongoose');
const AnkiGroup = require('./../models/ankiGroupModel');
const AnkiCard = require('./../models/ankiCardModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const { MIN_CARDS_TO_PUBLISH } = require('./ankiController');
const scheduler = require('./../utils/ankiScheduler');

const TABS = { library: 'المكتبة', curriculum: 'المنهج', community: 'المجتمع' };

const groupNotFound = () => new AppError('هذه المجموعة غير موجودة', 404);

// cards of the group and of its inner groups
const countByType = async function(groupId, includeHidden = true) {
  const counts = { basic: 0, reverse: 0, cloze: 0, image: 0 };
  const result = await AnkiCard.aggregate([
    { $match: { group: { $in: await AnkiGroup.subtreeIds(groupId) }, ...(includeHidden ? {} : AnkiCard.VISIBLE) } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  result.forEach(r => counts[r._id] = r.count);
  return counts;
};

const findGroup = async groupId => mongoose.isValidObjectId(groupId) ? AnkiGroup.findById(groupId) : null;

const canSeeHidden = (user, group) => user.role === 'admin' || group.canBeManagedBy(user);

// other users don't see the cards waiting for an admin. Call after getProgressMap (it uses the real counts)
const hideCounts = function(user, groups) {
  groups.forEach(g => { if(!canSeeHidden(user, g)) g.cardsCount = Math.max(0, g.cardsCount - (g.hiddenCardsCount || 0)); });
};

// [{ _id, name }] from the root to the parent of the group
const getBreadcrumbs = async function(group) {
  if(!group.ancestors.length) return [];
  const parents = await AnkiGroup.find({ _id: { $in: group.ancestors } }).select('name');
  const byId = new Map(parents.map(p => [p._id.toString(), p]));
  return group.ancestors.map(id => byId.get(id.toString())).filter(Boolean);
};

// groups that can receive cards (no inner groups) in the same library / in the curriculum: [{ _id, path }]
const getMoveTargets = async function(filter, currentId) {
  const groups = await AnkiGroup.find(filter).select('name parent ancestors childrenCount createdAt').sort({ createdAt: 1, _id: 1 });
  const names = new Map(groups.map(g => [g._id.toString(), g.name]));
  return groups
    .filter(g => !g.childrenCount && g._id.toString() !== currentId.toString())
    .map(g => ({ _id: g._id, path: [...g.ancestors.map(id => names.get(id.toString()) || ''), g.name].join(' › ') }))
    .sort((a, b) => a.path.localeCompare(b.path, 'ar'));
};

// group page content: inner groups, or cards (+ where they can be moved)
const getGroupContent = async function(group, targetsFilter) {
  const [children, cards, breadcrumbs, moveTargets] = await Promise.all([
    AnkiGroup.find({ parent: group._id }).sort({ createdAt: 1, _id: 1 }),
    group.childrenCount ? [] : AnkiCard.find({ group: group._id, isReversed: false }).sort(AnkiCard.SORT),
    getBreadcrumbs(group),
    getMoveTargets(targetsFilter, group._id)
  ]);
  return { children, cards, breadcrumbs, moveTargets };
};

// public pages (curriculum / community): the inner groups of the root, each one can be studied alone
const getPublicTree = async function(user, root) {
  const tree = (await AnkiGroup.getTree(root)).slice(1);
  const groups = tree.map(t => t.group);
  const treeProgress = await scheduler.getProgressMap(user, groups);
  hideCounts(user, groups);
  return { tree, treeProgress };
};

// /anki, /anki/curriculum, /anki/community
exports.getAnkiHome = tab => catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const [library, curriculum, community] = await Promise.all([
    AnkiGroup.find({ owner: res.locals.user._id, isOfficial: false, parent: null }).sort('-updatedAt'),
    AnkiGroup.find(res.locals.user.role === 'admin' ? { isOfficial: true, parent: null } : { isOfficial: true, status: 'published', parent: null }).sort('createdAt'),
    AnkiGroup.find({ isOfficial: false, status: 'published', parent: null })
      .populate('owner', 'name')
      .sort('-communityScore -ratingsQuantity -usersCount')
  ]);

  const progressMap = await scheduler.getProgressMap(res.locals.user, [...library, ...curriculum, ...community]);
  hideCounts(res.locals.user, [...curriculum, ...community]);

  res.status(200).render('ankiHome', {
    pageTitle: TABS[tab],
    user: res.locals.user,
    tab,
    library,
    curriculum,
    community,
    progressMap,
    minCards: MIN_CARDS_TO_PUBLISH
  });
});

exports.getOfficialGroup = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const group = await findGroup(req.params.groupId);
  if(!group || !group.isOfficial || !group.canBeStudiedBy(res.locals.user)) return next(groupNotFound());
  if(group.parent) return res.redirect(`/anki/official/${group.rootId}`);

  const progress = await scheduler.getProgress(res.locals.user, group);
  const { tree, treeProgress } = await getPublicTree(res.locals.user, group);

  res.status(200).render('officialGroup', {
    pageTitle: group.name,
    user: res.locals.user,
    tab: 'curriculum',
    group,
    counts: await countByType(group._id),
    progress,
    tree,
    treeProgress
  });
});

exports.getCommunityGroup = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  if(!mongoose.isValidObjectId(req.params.groupId)) return next(groupNotFound());
  const group = await AnkiGroup.findById(req.params.groupId).select('+ratings').populate('owner', 'name');
  if(!group || group.isOfficial || group.status !== 'published') return next(groupNotFound());
  if(group.parent) return res.redirect(`/anki/community/${group.rootId}`);
  if(group.owner && group.owner._id.toString() === res.locals.user._id.toString()) return res.redirect(`/anki/library/${group._id}?tab=publish`);

  const breakdown = [5, 4, 3, 2, 1].map(value => ({ value, count: group.ratings.filter(r => r.value === value).length }));
  const mine = group.ratings.find(r => r.user.toString() === res.locals.user._id.toString());
  const rank = 1 + await AnkiGroup.countDocuments({ isOfficial: false, status: 'published', parent: null, communityScore: { $gt: group.communityScore } });
  const progress = await scheduler.getProgress(res.locals.user, group);
  const { tree, treeProgress } = await getPublicTree(res.locals.user, group);
  hideCounts(res.locals.user, [group]);

  res.status(200).render('communityGroup', {
    pageTitle: group.name,
    user: res.locals.user,
    tab: 'community',
    group,
    breakdown,
    myRating: mine ? mine.value : 0,
    rank,
    counts: await countByType(group._id, false),
    progress,
    tree,
    treeProgress
  });
});

exports.getLibraryGroup = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const group = await findGroup(req.params.groupId);
  if(!group || !group.isOwnedBy(res.locals.user)) return next(groupNotFound());

  const content = await getGroupContent(group, { owner: res.locals.user._id, isOfficial: false });
  const root = group.parent ? await AnkiGroup.findById(group.rootId) : group;

  res.status(200).render('libraryGroup', {
    ...content,
    root,
    pageTitle: group.name,
    user: res.locals.user,
    tab: 'library',
    activeTab: ['info', 'edit', 'publish'].includes(req.query.tab) ? req.query.tab : 'info',
    group,
    counts: await countByType(group._id),
    progress: await scheduler.getProgress(res.locals.user, group),
    minCards: MIN_CARDS_TO_PUBLISH
  });
});

// admins: new official group (no groupId) or edit one (tabs: info / cards)
exports.getOfficialEditor = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  let group;
  let content = { children: [], cards: [], breadcrumbs: [], moveTargets: [] };
  if(req.params.groupId) {
    group = await findGroup(req.params.groupId);
    if(!group || !group.isOfficial) return next(groupNotFound());
    content = await getGroupContent(group, { isOfficial: true });
  }

  res.status(200).render('officialEditor', {
    pageTitle: group ? `تعديل: ${group.name}` : 'مجموعة رسمية جديدة',
    user: res.locals.user,
    tab: 'curriculum',
    activeTab: group && (req.query.tab === 'edit' || group.parent) ? 'edit' : 'info',
    group,
    ...content
  });
});

// add (no cardId) or edit a card, in a library group or (admins) an official group
exports.getCardEditor = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const group = await findGroup(req.params.groupId);
  if(!group || !group.canBeManagedBy(res.locals.user)) return next(groupNotFound());
  const groupUrl = group.isOfficial ? `/anki/official/${group._id}/edit?tab=edit` : `/anki/library/${group._id}?tab=edit`;
  if(group.childrenCount && !req.params.cardId) return res.redirect(groupUrl);

  let card;
  if(req.params.cardId) {
    card = mongoose.isValidObjectId(req.params.cardId) && await AnkiCard.findById(req.params.cardId);
    if(!card || card.isReversed || card.group.toString() !== group._id.toString())
      return next(new AppError('هذه البطاقة غير موجودة', 404));
  }

  res.status(200).render('cardEditor', {
    pageTitle: card ? 'تعديل بطاقة' : 'إضافة بطاقة',
    user: res.locals.user,
    group,
    backUrl: groupUrl,
    card
  });
});

exports.getStudy = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const group = await findGroup(req.params.groupId);
  if(!group || !group.canBeStudiedBy(res.locals.user)) return next(groupNotFound());

  const backUrl = group.isOfficial ? (group.parent && res.locals.user.role === 'admin' ? `/anki/official/${group._id}/edit?tab=edit` : `/anki/official/${group.rootId}`) :
    group.isOwnedBy(res.locals.user) ? `/anki/library/${group._id}` :
    res.locals.user.role === 'admin' && group.status === 'pending' ? '/anki/admin/review' : `/anki/community/${group.rootId}`;

  // revision needs at least one study session first
  let mode = req.query.mode === 'revision' ? 'revision' : 'study';
  if(mode === 'revision' && !(await scheduler.getProgress(res.locals.user, group)).started)
    return res.redirect(`/anki/groups/${group._id}/study`);

  res.status(200).render('study', {
    pageTitle: `${mode === 'revision' ? 'مراجعة' : 'دراسة'}: ${group.name}`,
    user: res.locals.user,
    group,
    mode,
    backUrl
  });
});

exports.getAdminReview = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const [groups, pendingCards] = await Promise.all([
    AnkiGroup.find({ status: 'pending', isOfficial: false, parent: null })
      .populate('owner', 'name')
      .sort('submittedAt'),
    AnkiCard.find({ approval: 'pending', isReversed: false }).sort({ updatedAt: 1, _id: 1 }).limit(300)
  ]);

  // cards waiting in published groups, by group: [{ group, path, cards }]
  const cardGroups = await AnkiGroup.find({ _id: { $in: [...new Set(pendingCards.map(c => c.group.toString()))] } }).populate('owner', 'name');
  const names = new Map((await AnkiGroup.find({ _id: { $in: cardGroups.flatMap(g => g.ancestors) } }).select('name')).map(g => [g._id.toString(), g.name]));
  const pendingSections = cardGroups.map(group => ({
    group,
    path: [...group.ancestors.map(id => names.get(id.toString()) || ''), group.name].join(' › '),
    cards: pendingCards.filter(c => c.group.equals(group._id))
  }));

  res.status(200).render('adminReview', {
    pageTitle: 'مراجعة المجموعات',
    user: res.locals.user,
    groups,
    pendingSections,
    pendingCount: pendingCards.length
  });
});
