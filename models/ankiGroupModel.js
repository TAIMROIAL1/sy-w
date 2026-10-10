const mongoose = require('mongoose');

const ankiGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'الرجاء ادخال اسم المجموعة'],
    maxlength: [80, 'اسم المجموعة يجب ألا يتجاوز 80 حرفاً']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  // official (platform) groups only
  isOfficial: {
    type: Boolean,
    default: false
  },
  photo: {
    type: String
  },
  // path of the photo inside the Bunny zone (official groups uploaded by admins)
  photoPath: {
    type: String
  },
  subject: {
    type: String
  },
  level: {
    type: String
  },
  topics: [String],

  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  // private -> pending (waiting for admins) -> published | rejected
  status: {
    type: String,
    enum: ['private', 'pending', 'published', 'rejected'],
    default: 'private'
  },
  reviewNote: {
    type: String
  },
  submittedAt: Date,
  publishedAt: Date,

  cardsCount: {
    type: Number,
    default: 0
  },
  // users (other than the owner) who started studying this group
  users: {
    type: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    select: false
  },
  usersCount: {
    type: Number,
    default: 0
  },
  ratings: {
    type: [{
      _id: false,
      user: { type: mongoose.Schema.ObjectId, ref: 'User' },
      value: { type: Number, min: 1, max: 5 }
    }],
    select: false
  },
  ratingsAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  // nesting: a group holds either cards or inner groups, never both. ancestors = [root, ..., parent]
  // inner groups copy isOfficial / owner / status from the root
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'AnkiGroup',
    default: null
  },
  ancestors: {
    type: [mongoose.Schema.ObjectId],
    default: []
  },
  childrenCount: {
    type: Number,
    default: 0
  },
  // cards of the whole tree waiting for (or refused by) an admin, hidden from other users
  hiddenCardsCount: {
    type: Number,
    default: 0
  },
  // community ranking (rating + number of ratings + number of users), see scoreOf
  communityScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

ankiGroupSchema.index({ owner: 1, isOfficial: 1 });
ankiGroupSchema.index({ status: 1, isOfficial: 1 });
ankiGroupSchema.index({ status: 1, isOfficial: 1, communityScore: -1 });
ankiGroupSchema.index({ parent: 1, createdAt: 1 });
ankiGroupSchema.index({ ancestors: 1 });

const MAX_DEPTH = 5;
ankiGroupSchema.statics.MAX_DEPTH = MAX_DEPTH;

// 0..1 score. The rating is a bayesian average (pulled towards 3.5 until the group has enough ratings)
// so one 5-star rating doesn't beat 40 ratings of 4.7. Users count is logarithmic (1000+ users = full)
const PRIOR_RATING = 3.5;
const PRIOR_COUNT = 5;
ankiGroupSchema.statics.scoreOf = function({ ratingsAverage = 0, ratingsQuantity = 0, usersCount = 0 }) {
  const rating = (PRIOR_RATING * PRIOR_COUNT + ratingsAverage * ratingsQuantity) / (PRIOR_COUNT + ratingsQuantity);
  const users = Math.min(1, Math.log10(1 + usersCount) / 3);
  return Math.round((0.7 * rating / 5 + 0.3 * users) * 10000) / 10000;
};

ankiGroupSchema.pre('save', function() {
  this.communityScore = this.constructor.scoreOf(this);
});

ankiGroupSchema.methods.isOwnedBy = function(user) {
  return !this.isOfficial && !!user && !!this.owner && this.owner.toString() === user._id.toString();
};

// owner of a library group, or an admin for official groups
ankiGroupSchema.methods.canBeManagedBy = function(user) {
  return this.isOwnedBy(user) || (this.isOfficial && !!user && user.role === 'admin');
};

ankiGroupSchema.methods.canBeStudiedBy = function(user) {
  if(this.isOfficial) return this.status === 'published' || user.role === 'admin';
  if(this.isOwnedBy(user)) return true;
  if(this.status === 'published') return true;
  return this.status === 'pending' && user.role === 'admin';
};

ankiGroupSchema.virtual('rootId').get(function() {
  return this.ancestors && this.ancestors.length ? this.ancestors[0] : this._id;
});

// cards added to (or moved into) a published community group wait for an admin
ankiGroupSchema.methods.needsCardApproval = function() {
  return !this.isOfficial && this.status === 'published';
};

// the group + every group inside it (any depth)
ankiGroupSchema.statics.subtreeIds = async function(groupId) {
  const id = new mongoose.Types.ObjectId(String(groupId));
  const inner = await this.find({ ancestors: id }).distinct('_id');
  return [id, ...inner];
};

// groups in display order: parent first, then its inner groups (oldest first), depth first
ankiGroupSchema.statics.getTree = async function(root) {
  const inner = await this.find({ ancestors: root._id }).sort({ createdAt: 1, _id: 1 });
  const byParent = new Map();
  inner.forEach(g => {
    const key = g.parent.toString();
    if(!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(g);
  });
  const ordered = [];
  const walk = (group, depth) => {
    ordered.push({ group, depth });
    (byParent.get(group._id.toString()) || []).forEach(child => walk(child, depth + 1));
  };
  walk(root, 0);
  return ordered;
};

// cardsCount / hiddenCardsCount count the cards of the group and of every group inside it.
// Recounts the whole tree of the root (+ childrenCount) in 2 queries
ankiGroupSchema.statics.updateTreeCounts = async function(rootId) {
  const AnkiCard = mongoose.model('AnkiCard');
  const root = new mongoose.Types.ObjectId(String(rootId));
  const groups = await this.find({ $or: [{ _id: root }, { ancestors: root }] }).select('parent ancestors');
  if(!groups.length) return new Map();

  const rows = await AnkiCard.aggregate([
    { $match: { group: { $in: groups.map(g => g._id) } } },
    { $group: {
      _id: '$group',
      cards: { $sum: 1 },
      hidden: { $sum: { $cond: [{ $in: [{ $ifNull: ['$approval', 'approved'] }, AnkiCard.HIDDEN] }, 1, 0] } }
    } }
  ]);

  const counts = new Map(groups.map(g => [g._id.toString(), { cardsCount: 0, hiddenCardsCount: 0, childrenCount: 0 }]));
  const lineage = new Map(groups.map(g => [g._id.toString(), [g._id, ...g.ancestors].map(String)]));
  rows.forEach(r => (lineage.get(r._id.toString()) || []).forEach(id => {
    const c = counts.get(id);
    if(!c) return;
    c.cardsCount += r.cards;
    c.hiddenCardsCount += r.hidden;
  }));
  groups.forEach(g => { if(g.parent && counts.has(g.parent.toString())) counts.get(g.parent.toString()).childrenCount++; });

  await this.bulkWrite([...counts].map(([id, c]) => ({ updateOne: { filter: { _id: id }, update: { $set: c } } })));
  return counts;
};

ankiGroupSchema.statics.updateCardsCount = async function(groupId) {
  const group = await this.findById(groupId).select('ancestors');
  if(!group) return 0;
  const counts = await this.updateTreeCounts(group.ancestors.length ? group.ancestors[0] : group._id);
  return counts.get(group._id.toString()).cardsCount;
};

// inner groups follow the publish status of the root
ankiGroupSchema.statics.syncTreeStatus = async function(root) {
  await this.updateMany({ ancestors: root._id }, { status: root.status, publishedAt: root.publishedAt });
};

// count every user (other than the owner) once
ankiGroupSchema.statics.addUser = async function(groupId, userId) {
  const res = await this.updateOne({ _id: groupId, users: { $ne: userId } }, { $push: { users: userId }, $inc: { usersCount: 1 } });
  if(!(res.modifiedCount || res.nModified)) return;
  const group = await this.findById(groupId);
  if(group) await group.save();
};

const AnkiGroup = mongoose.model('AnkiGroup', ankiGroupSchema);

module.exports = AnkiGroup;
