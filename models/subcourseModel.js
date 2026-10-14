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
  },
  startDate: {
    type: String,
  },
  // shown on the home page as "قريبا" and can't be bought yet
  comingSoon: {
    type: Boolean,
    default: false
  }
})

  subcourseSchema.pre('find', function(next){
    this.populate('course');
    next();
  })
 

const Subcourse = mongoose.model('Subcourse', subcourseSchema);

module.exports = Subcourse;