const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter a title']
  },
  description: {
    type: String,
    required: [true, 'Please enter a description']
  },
  photoUrl: {
    type: String,
    required: [true, 'please enter a photo url']
  },
  price: {
    type: Number,
    required: [true, 'Please enter a price']
  },
  class: {
    type: mongoose.Schema.ObjectId,
    ref: 'Class'
  }
});

// courseSchema.pre(/^find/, function(next) {
//   this.populate('class');
//   next();
// })

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;