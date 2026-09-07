const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter a title']
  },
  subtitle: {
    type: String
  },
  num: {
    type: Number,
    required: [true, 'Please enter a number']
  },
  photoUrl: {
    type: String
  },
  subcourse: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subcourse'
  },
  workshop: {
    type: mongoose.Schema.ObjectId,
    ref: 'Workshop'
  },
  videos: [{
    fileType: {
      type: String,
    },
    filePath: {
      type: String
    },

    questions: [{
      type: mongoose.Schema.ObjectId,
      ref: "Question"
    }],

    title: {
      type: String,
      required: [true, 'Please enter a title']
    },
    subtitle: {
      type: String,
    },
    info: {
      type: String,
    },
    videoUrl: {
      type: String
    },
    duration: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
})

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;