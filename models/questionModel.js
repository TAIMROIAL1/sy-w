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
  }
})

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;