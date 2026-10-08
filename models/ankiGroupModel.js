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
  // community ranking (rating + number of ratings + number of users), see scoreOf
  communityScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

ankiGroupSchema.index({ owner: 1, isOfficial: 1 });
ankiGroupSchema.index({ status: 1, isOfficial: 1 });
ankiGroupSchema.index({ status: 1, isOfficial: 1, communityScore: -1 });

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

ankiGroupSchema.statics.updateCardsCount = async function(groupId) {
  const cardsCount = await mongoose.model('AnkiCard').countDocuments({ group: groupId });
  await this.findByIdAndUpdate(groupId, { cardsCount });
  return cardsCount;
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
