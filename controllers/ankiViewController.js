const mongoose = require('mongoose');
const AnkiGroup = require('./../models/ankiGroupModel');
const AnkiCard = require('./../models/ankiCardModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const { MIN_CARDS_TO_PUBLISH } = require('./ankiController');
const scheduler = require('./../utils/ankiScheduler');

const TABS = { library: 'المكتبة', curriculum: 'المنهج', community: 'المجتمع' };

const groupNotFound = () => new AppError('هذه المجموعة غير موجودة', 404);

const countByType = async function(groupId) {
  const counts = { basic: 0, reverse: 0, cloze: 0, image: 0 };
  const result = await AnkiCard.aggregate([
    { $match: { group: new mongoose.Types.ObjectId(groupId) } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  result.forEach(r => counts[r._id] = r.count);
  return counts;
};

const findGroup = async groupId => mongoose.isValidObjectId(groupId) ? AnkiGroup.findById(groupId) : null;

// /anki, /anki/curriculum, /anki/community
exports.getAnkiHome = tab => catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const [library, curriculum, community] = await Promise.all([
    AnkiGroup.find({ owner: req.user._id, isOfficial: false }).sort('-updatedAt'),
    AnkiGroup.find(req.user.role === 'admin' ? { isOfficial: true } : { isOfficial: true, status: 'published' }).sort('createdAt'),
    AnkiGroup.find({ isOfficial: false, status: 'published' })
      .populate('owner', 'name')
      .sort('-communityScore -ratingsQuantity -usersCount')
  ]);

  res.status(200).render('ankiHome', {
    pageTitle: TABS[tab],
    user: req.user,
    tab,
    library,
    curriculum,
    community,
    progressMap: await scheduler.getProgressMap(req.user._id, [...library, ...curriculum, ...community]),
    minCards: MIN_CARDS_TO_PUBLISH
  });
});

exports.getOfficialGroup = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const group = await findGroup(req.params.groupId);
  if(!group || !group.isOfficial || !group.canBeStudiedBy(req.user)) return next(groupNotFound());

  res.status(200).render('officialGroup', {
    pageTitle: group.name,
    user: req.user,
    tab: 'curriculum',
    group,
    counts: await countByType(group._id),
    progress: await scheduler.getProgress(req.user._id, group)
  });
});

exports.getCommunityGroup = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  if(!mongoose.isValidObjectId(req.params.groupId)) return next(groupNotFound());
  const group = await AnkiGroup.findById(req.params.groupId).select('+ratings').populate('owner', 'name');
  if(!group || group.isOfficial || group.status !== 'published') return next(groupNotFound());
  if(group.owner && group.owner._id.toString() === req.user._id.toString()) return res.redirect(`/anki/library/${group._id}?tab=publish`);

  const breakdown = [5, 4, 3, 2, 1].map(value => ({ value, count: group.ratings.filter(r => r.value === value).length }));
  const mine = group.ratings.find(r => r.user.toString() === req.user._id.toString());
  const rank = 1 + await AnkiGroup.countDocuments({ isOfficial: false, status: 'published', communityScore: { $gt: group.communityScore } });

  res.status(200).render('communityGroup', {
    pageTitle: group.name,
    user: req.user,
    tab: 'community',
    group,
    breakdown,
    myRating: mine ? mine.value : 0,
    rank,
    counts: await countByType(group._id),
    progress: await scheduler.getProgress(req.user._id, group)
  });
});

exports.getLibraryGroup = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const group = await findGroup(req.params.groupId);
  if(!group || !group.isOwnedBy(req.user)) return next(groupNotFound());

  const cards = await AnkiCard.find({ group: group._id, isReversed: false }).sort({ createdAt: 1, _id: 1 });

  res.status(200).render('libraryGroup', {
    pageTitle: group.name,
    user: req.user,
    tab: 'library',
    activeTab: ['info', 'edit', 'publish'].includes(req.query.tab) ? req.query.tab : 'info',
    group,
    cards,
    counts: await countByType(group._id),
    progress: await scheduler.getProgress(req.user._id, group),
    minCards: MIN_CARDS_TO_PUBLISH
  });
});

// admins: new official group (no groupId) or edit one (tabs: info / cards)
exports.getOfficialEditor = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  let group;
  let cards = [];
  if(req.params.groupId) {
    group = await findGroup(req.params.groupId);
    if(!group || !group.isOfficial) return next(groupNotFound());
    cards = await AnkiCard.find({ group: group._id, isReversed: false }).sort({ createdAt: 1, _id: 1 });
  }

  res.status(200).render('officialEditor', {
    pageTitle: group ? `تعديل: ${group.name}` : 'مجموعة رسمية جديدة',
    user: req.user,
    tab: 'curriculum',
    activeTab: group && req.query.tab === 'edit' ? 'edit' : 'info',
    group,
    cards
  });
});

// add (no cardId) or edit a card, in a library group or (admins) an official group
exports.getCardEditor = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const group = await findGroup(req.params.groupId);
  if(!group || !group.canBeManagedBy(req.user)) return next(groupNotFound());

  let card;
  if(req.params.cardId) {
    card = mongoose.isValidObjectId(req.params.cardId) && await AnkiCard.findById(req.params.cardId);
    if(!card || card.isReversed || card.group.toString() !== group._id.toString())
      return next(new AppError('هذه البطاقة غير موجودة', 404));
  }

  res.status(200).render('cardEditor', {
    pageTitle: card ? 'تعديل بطاقة' : 'إضافة بطاقة',
    user: req.user,
    group,
    backUrl: group.isOfficial ? `/anki/official/${group._id}/edit?tab=edit` : `/anki/library/${group._id}?tab=edit`,
    card
  });
});

exports.getStudy = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const group = await findGroup(req.params.groupId);
  if(!group || !group.canBeStudiedBy(req.user)) return next(groupNotFound());

  const backUrl = group.isOfficial ? `/anki/official/${group._id}` :
    group.isOwnedBy(req.user) ? `/anki/library/${group._id}` :
    req.user.role === 'admin' && group.status === 'pending' ? '/anki/admin/review' : `/anki/community/${group._id}`;

  // revision needs at least one study session first
  let mode = req.query.mode === 'revision' ? 'revision' : 'study';
  if(mode === 'revision' && !(await scheduler.getProgress(req.user._id, group)).started)
    return res.redirect(`/anki/groups/${group._id}/study`);

  res.status(200).render('study', {
    pageTitle: `${mode === 'revision' ? 'مراجعة' : 'دراسة'}: ${group.name}`,
    user: req.user,
    group,
    mode,
    backUrl
  });
});

exports.getAdminReview = catchAsync(async function(req, res, next) {
  if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
  const groups = await AnkiGroup.find({ status: 'pending', isOfficial: false })
    .populate('owner', 'name')
    .sort('submittedAt');

  res.status(200).render('adminReview', {
    pageTitle: 'مراجعة المجموعات',
    user: req.user,
    groups
  });
});
