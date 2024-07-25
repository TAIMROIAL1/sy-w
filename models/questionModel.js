const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String
  },
  answers: [{
    type: String
  }],
  correctAnswer: {
    type: Number
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }
})

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;