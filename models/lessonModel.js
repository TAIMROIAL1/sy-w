const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter a title']
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
  videos: [{
    title: {
      type: String,
      required: [true, 'Please enter a title']
    },
    num: {
      type: Number,
      required: [true, 'Please enter a number']
    },
    videoUrl: {
      type: String,
      required: [true, 'Please enter a video url']
    }
  }]
})

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;