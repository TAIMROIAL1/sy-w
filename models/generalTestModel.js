const mongoose = require('mongoose');

// General tests: made by admins, open to every user once between startAt and endAt
const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  choices: {
    type: [{ type: String, trim: true, maxlength: 300 }],
    validate: { validator: v => v.length >= 2 && v.length <= 6, message: 'كل سؤال يحتاج من 2 إلى 6 خيارات' }
  },
  correct: { type: Number, required: true, min: 0 }
});

const generalTestSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'الرجاء كتابة عنوان الاختبار'], trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  // minutes; a user who starts late only gets the time left until endAt
  duration: { type: Number, required: true, min: 1, max: 600 },
  questions: [questionSchema],
  // question + choice order differs for every user
  shuffle: { type: Boolean, default: false },
  // users see the correct answers after endAt
  showAnswers: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  attemptsCount: { type: Number, default: 0 },
  // scores + ranks are calculated once, after endAt
  resultsReady: { type: Boolean, default: false }
}, { timestamps: true });

generalTestSchema.index({ startAt: 1, endAt: 1 });

generalTestSchema.methods.stateAt = function(now = Date.now()) {
  if(now < this.startAt.getTime()) return 'upcoming';
  if(now < this.endAt.getTime()) return 'live';
  return 'ended';
};

module.exports = mongoose.model('GeneralTest', generalTestSchema);
