// Spaced repetition for anki cards: easy = 3 days, medium = 1 day, hard = 1 minute
// Study  = every card of the group and of its inner groups (each answer schedules the card)
// Revision = only the cards that are due now + cards the user never saw (new cards), in random order
// Both of them never show the 2 cards of a reverse pair one after the other (when it can be avoided)
const mongoose = require('mongoose');
const AnkiCard = require('./../models/ankiCardModel');
const AnkiGroup = require('./../models/ankiGroupModel');
const AnkiProgress = require('./../models/ankiProgressModel');

const INTERVALS = {
  easy: 3 * 24 * 60 * 60 * 1000,
  medium: 24 * 60 * 60 * 1000,
  hard: 60 * 1000
};
const CARD_FIELDS = 'type front back text image masks extra isReversed pairId approval';

const toId = id => new mongoose.Types.ObjectId(String(id));
// cards waiting for an admin are only shown to the owner / admins
const visibility = includeHidden => includeHidden ? {} : AnkiCard.VISIBLE;

exports.INTERVALS = INTERVALS;
exports.CARD_FIELDS = CARD_FIELDS;

exports.shuffle = function(list) {
  const result = [...list];
  for(let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const pairKey = card => card.pairId ? String(card.pairId) : null;
const fitsAt = (list, i, key) => (i === 0 || pairKey(list[i - 1]) !== key) && (i === list.length || pairKey(list[i]) !== key);

// keeps the order, but moves a card forward when it would come right after the other card of its pair
exports.separatePairs = function(list) {
  const pool = [...list];
  const result = [];
  while(pool.length) {
    const last = result.length ? pairKey(result[result.length - 1]) : null;
    let i = last ? pool.findIndex(c => pairKey(c) !== last) : 0;
    if(i < 0) i = 0;
    result.push(pool.splice(i, 1)[0]);
  }
  // only the end can still have a pair together
  for(let i = 1; i < result.length; i++) {
    const key = pairKey(result[i]);
    if(!key || key !== pairKey(result[i - 1])) continue;
    const [card] = result.splice(i, 1);
    // nearest place before it, so the order changes as little as possible
    let j = i - 1;
    while(j >= 0 && !fitsAt(result, j, key)) j--;
    result.splice(j >= 0 ? j : i, 0, card);
  }
  return result;
};

exports.recordReview = async function(userId, card, difficulty) {
  const now = Date.now();
  return AnkiProgress.findOneAndUpdate(
    { user: userId, card: card._id },
    {
      $set: { group: card.group, difficulty, dueAt: new Date(now + INTERVALS[difficulty]), lastReviewedAt: new Date(now) },
      $inc: { reviews: 1 }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const canSeeHidden = (user, group) => !!user && !!user._id && (user.role === 'admin' || (group.canBeManagedBy && group.canBeManagedBy(user)));

// { [groupId]: { started, studied, dueNow, newCards, nextDueAt } } for the given groups (progress of their inner groups included)
exports.getProgressMap = async function(user, groups) {
  const userId = user._id || user;
  const now = new Date();
  const ids = groups.map(g => toId(g._id));
  const tree = ids.length ? await AnkiGroup.find({ $or: [{ _id: { $in: ids } }, { ancestors: { $in: ids } }] }).select('ancestors') : [];
  const rows = tree.length ? await AnkiProgress.aggregate([
    { $match: { user: toId(userId), group: { $in: tree.map(g => g._id) } } },
    { $group: {
      _id: '$group',
      studied: { $sum: 1 },
      due: { $sum: { $cond: [{ $lte: ['$dueAt', now] }, 1, 0] } },
      nextDueAt: { $min: { $cond: [{ $gt: ['$dueAt', now] }, '$dueAt', null] } }
    } }
  ]) : [];

  const lineage = new Map(tree.map(g => [g._id.toString(), [g._id, ...g.ancestors].map(String)]));
  const byGroup = {};
  rows.forEach(r => (lineage.get(r._id.toString()) || []).forEach(id => {
    const total = byGroup[id] || (byGroup[id] = { studied: 0, due: 0, nextDueAt: null });
    total.studied += r.studied;
    total.due += r.due;
    if(r.nextDueAt && (!total.nextDueAt || r.nextDueAt < total.nextDueAt)) total.nextDueAt = r.nextDueAt;
  }));

  const map = {};
  groups.forEach(g => {
    const row = byGroup[g._id.toString()] || { studied: 0, due: 0, nextDueAt: null };
    const started = row.studied > 0;
    const cardsCount = (g.cardsCount || 0) - (canSeeHidden(user, g) ? 0 : (g.hiddenCardsCount || 0));
    const newCards = started ? Math.max(0, cardsCount - row.studied) : 0;
    map[g._id.toString()] = {
      started,
      studied: row.studied,
      newCards,
      dueNow: started ? row.due + newCards : 0,
      nextDueAt: row.nextDueAt
    };
  });
  return map;
};

exports.getProgress = async function(user, group) {
  return (await exports.getProgressMap(user, [group]))[group._id.toString()];
};

// study queue: inner groups in order, the cards of each group in the order chosen by the owner
exports.getStudyCards = async function(group, { includeHidden = false } = {}) {
  const tree = await AnkiGroup.getTree(group);
  const position = new Map(tree.map(({ group: g }, i) => [g._id.toString(), i]));
  const cards = await AnkiCard.find({ group: { $in: tree.map(t => t.group._id) }, ...visibility(includeHidden) })
    .select(`${CARD_FIELDS} group`).sort(AnkiCard.SORT);
  cards.sort((a, b) => position.get(a.group.toString()) - position.get(b.group.toString()));
  return exports.separatePairs(cards);
};

// revision queue: due cards + new cards, shuffled
exports.getRevisionCards = async function(userId, groupId, now = Date.now(), { includeHidden = false } = {}) {
  const ids = await AnkiGroup.subtreeIds(groupId);
  const [cards, progress] = await Promise.all([
    AnkiCard.find({ group: { $in: ids }, ...visibility(includeHidden) }).select(CARD_FIELDS),
    AnkiProgress.find({ user: userId, group: { $in: ids } }).select('card dueAt')
  ]);
  const dueAt = new Map(progress.map(p => [p.card.toString(), p.dueAt.getTime()]));
  const ready = cards.filter(c => !dueAt.has(c._id.toString()) || dueAt.get(c._id.toString()) <= now);

  return exports.separatePairs(exports.shuffle(ready));
};

// cards that became due in (from, to]
exports.getCardsDueBetween = async function(userId, groupId, from, to, { includeHidden = false } = {}) {
  const ids = await AnkiGroup.subtreeIds(groupId);
  const progress = await AnkiProgress.find({ user: userId, group: { $in: ids }, dueAt: { $gt: new Date(from), $lte: new Date(to) } })
    .select('card dueAt').sort('dueAt');
  if(!progress.length) return [];

  const cards = await AnkiCard.find({ _id: { $in: progress.map(p => p.card) }, ...visibility(includeHidden) }).select(CARD_FIELDS);
  const byId = new Map(cards.map(c => [c._id.toString(), c]));
  return progress.map(p => byId.get(p.card.toString())).filter(Boolean);
};

exports.getNextDueAt = async function(userId, groupId, after = Date.now()) {
  const ids = await AnkiGroup.subtreeIds(groupId);
  const next = await AnkiProgress.findOne({ user: userId, group: { $in: ids }, dueAt: { $gt: new Date(after) } }).select('dueAt').sort('dueAt');
  return next ? next.dueAt : null;
};

// cards moved to another group keep the progress of every user
exports.moveProgress = (filter, groupId) => AnkiProgress.updateMany(filter, { $set: { group: groupId } });

exports.deleteProgress = filter => AnkiProgress.deleteMany(filter);
