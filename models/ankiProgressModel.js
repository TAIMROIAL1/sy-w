const mongoose = require('mongoose');

// one document per (user, card): when the card is due again for that user
const ankiProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'AnkiGroup',
    required: true
  },
  card: {
    type: mongoose.Schema.ObjectId,
    ref: 'AnkiCard',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard']
  },
  dueAt: {
    type: Date,
    required: true
  },
  reviews: {
    type: Number,
    default: 0
  },
  lastReviewedAt: Date
}, { timestamps: true });

ankiProgressSchema.index({ user: 1, card: 1 }, { unique: true });
ankiProgressSchema.index({ user: 1, group: 1, dueAt: 1 });
ankiProgressSchema.index({ card: 1 });
ankiProgressSchema.index({ group: 1 });

const AnkiProgress = mongoose.model('AnkiProgress', ankiProgressSchema);

module.exports = AnkiProgress;
