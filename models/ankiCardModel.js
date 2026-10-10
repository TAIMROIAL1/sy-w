const mongoose = require('mongoose');

const ankiCardSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'AnkiGroup',
    required: true,
    index: true
  },
  // basic   : front / back
  // reverse : stored as 2 cards (front/back + back/front) sharing the same pairId
  // cloze   : text with hidden parts written as [$hidden part$]
  // image   : image + masks (rectangles in % of the image size)
  type: {
    type: String,
    enum: ['basic', 'reverse', 'cloze', 'image'],
    required: [true, 'الرجاء اختيار نوع البطاقة']
  },
  front: String,
  back: String,
  text: String,
  // image cards: CDN url of the picture + its path in the Bunny storage zone (used to delete it)
  image: String,
  imagePath: String,
  masks: [{
    _id: false,
    x: Number,
    y: Number,
    w: Number,
    h: Number
  }],
  // optional note shown with the answer
  extra: {
    type: String,
    default: ''
  },
  pairId: {
    type: mongoose.Schema.ObjectId,
    index: true
  },
  // true for the auto generated (back -> front) card of a reverse pair
  isReversed: {
    type: Boolean,
    default: false
  },
  // position in the group (both cards of a reverse pair share it)
  order: {
    type: Number,
    default: 0
  },
  // cards added to / moved into a published community group are hidden from other users until an admin approves them
  // edit of a card that others already see (published community group), waiting for an admin
  pendingEdit: {
    type: new mongoose.Schema({
      front: String,
      back: String,
      text: String,
      extra: String,
      image: String,
      imagePath: String,
      masks: [{ x: Number, y: Number, w: Number, h: Number }],
      rejected: { type: Boolean, default: false },
      submittedAt: Date
    }, { _id: false }),
    default: undefined
  },
  approval: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'approved'
  }
}, { timestamps: true });

ankiCardSchema.index({ group: 1, order: 1, createdAt: 1 });
ankiCardSchema.index({ approval: 1 });
ankiCardSchema.index({ 'pendingEdit.rejected': 1 }, { sparse: true });

const HIDDEN = ['pending', 'rejected'];
ankiCardSchema.statics.HIDDEN = HIDDEN;
// filter for the cards other users can see (old cards have no approval field)
ankiCardSchema.statics.VISIBLE = { approval: { $nin: HIDDEN } };
ankiCardSchema.statics.SORT = { order: 1, createdAt: 1, _id: 1 };

ankiCardSchema.statics.nextOrder = async function(groupId) {
  const last = await this.findOne({ group: groupId }).sort({ order: -1 }).select('order');
  return last ? (last.order || 0) + 1 : 0;
};

const AnkiCard = mongoose.model('AnkiCard', ankiCardSchema);

module.exports = AnkiCard;
