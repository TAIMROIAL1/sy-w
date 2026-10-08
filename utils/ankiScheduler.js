// Spaced repetition for anki cards: easy = 3 days, medium = 1 day, hard = 1 minute
// Study  = every card of the group (each answer schedules the card)
// Revision = only the cards that are due now + cards the user never saw (new cards)
const mongoose = require('mongoose');
const AnkiCard = require('./../models/ankiCardModel');
const AnkiProgress = require('./../models/ankiProgressModel');

const INTERVALS = {
  easy: 3 * 24 * 60 * 60 * 1000,
  medium: 24 * 60 * 60 * 1000,
  hard: 60 * 1000
};
const CARD_FIELDS = 'type front back text image masks extra isReversed';

const toId = id => new mongoose.Types.ObjectId(String(id));

exports.INTERVALS = INTERVALS;
exports.CARD_FIELDS = CARD_FIELDS;

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

// { [groupId]: { started, studied, dueNow, newCards, nextDueAt } } for the given groups
exports.getProgressMap = async function(userId, groups) {
  const now = new Date();
  const rows = groups.length ? await AnkiProgress.aggregate([
    { $match: { user: toId(userId), group: { $in: groups.map(g => toId(g._id)) } } },
    { $group: {
      _id: '$group',
      studied: { $sum: 1 },
      due: { $sum: { $cond: [{ $lte: ['$dueAt', now] }, 1, 0] } },
      nextDueAt: { $min: { $cond: [{ $gt: ['$dueAt', now] }, '$dueAt', null] } }
    } }
  ]) : [];

  const byGroup = Object.fromEntries(rows.map(r => [r._id.toString(), r]));
  const map = {};
  groups.forEach(g => {
    const row = byGroup[g._id.toString()] || { studied: 0, due: 0, nextDueAt: null };
    const started = row.studied > 0;
    const newCards = started ? Math.max(0, (g.cardsCount || 0) - row.studied) : 0;
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

exports.getProgress = async function(userId, group) {
  return (await exports.getProgressMap(userId, [group]))[group._id.toString()];
};

// revision queue: due cards (oldest due first) then new cards (in creation order)
exports.getRevisionCards = async function(userId, groupId, now = Date.now()) {
  const [cards, progress] = await Promise.all([
    AnkiCard.find({ group: groupId }).select(CARD_FIELDS).sort({ createdAt: 1, _id: 1 }),
    AnkiProgress.find({ user: userId, group: groupId }).select('card dueAt')
  ]);
  const dueAt = new Map(progress.map(p => [p.card.toString(), p.dueAt.getTime()]));

  const due = cards.filter(c => dueAt.has(c._id.toString()) && dueAt.get(c._id.toString()) <= now)
    .sort((a, b) => dueAt.get(a._id.toString()) - dueAt.get(b._id.toString()));
  const fresh = cards.filter(c => !dueAt.has(c._id.toString()));

  return [...due, ...fresh];
};

// cards that became due in (from, to]
exports.getCardsDueBetween = async function(userId, groupId, from, to) {
  const progress = await AnkiProgress.find({ user: userId, group: groupId, dueAt: { $gt: new Date(from), $lte: new Date(to) } })
    .select('card dueAt').sort('dueAt');
  if(!progress.length) return [];

  const cards = await AnkiCard.find({ _id: { $in: progress.map(p => p.card) } }).select(CARD_FIELDS);
  const byId = new Map(cards.map(c => [c._id.toString(), c]));
  return progress.map(p => byId.get(p.card.toString())).filter(Boolean);
};

exports.getNextDueAt = async function(userId, groupId, after = Date.now()) {
  const next = await AnkiProgress.findOne({ user: userId, group: groupId, dueAt: { $gt: new Date(after) } }).select('dueAt').sort('dueAt');
  return next ? next.dueAt : null;
};

exports.deleteProgress = filter => AnkiProgress.deleteMany(filter);
