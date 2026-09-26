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
  subcourse: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subcourse'
  },
  videos: [{
    fileType: {
      type: String,
    },
    filePath: {
      type: String
    },
    num: {
      type: Number
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

lessonSchema.pre('save', function(next) {
  this.videos.forEach((vid, i )=> vid.num = i);
  next();
})

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;