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
  }
}, { timestamps: true });

const AnkiCard = mongoose.model('AnkiCard', ankiCardSchema);

module.exports = AnkiCard;
