const mongoose = require('mongoose');

// network delay allowed after the deadline when saving answers
const GRACE = 5000;

const testAttemptSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.ObjectId, ref: 'GeneralTest', required: true },
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, required: true },
  // min(startedAt + duration, test.endAt)
  deadline: { type: Date, required: true },
  // order the questions are shown in (indexes of test.questions)
  order: [Number],
  // per question (by its index in test.questions): order of its choices
  choiceOrder: [[Number]],
  // by question index: chosen choice index, -1 = not answered
  answers: [Number],
  submittedAt: Date,
  score: Number,
  // dense rank: same score -> same rank
  rank: Number
});

testAttemptSchema.index({ test: 1, user: 1 }, { unique: true });
testAttemptSchema.index({ test: 1, rank: 1 });

testAttemptSchema.statics.GRACE = GRACE;

testAttemptSchema.methods.isFinished = function(now = Date.now()) {
  return !!this.submittedAt || now > this.deadline.getTime() + GRACE;
};

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
