const mongoose = require('mongoose');

const subcourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter a title']
  },
  description: {
    type: String
  },
  photoUrl: {
    type: String
  },
  price: {
    type: Number
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course'
  }
})

const Subcourse = mongoose.model('Subcourse', subcourseSchema);

module.exports = Subcourse;