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

  subcourseSchema.pre('find', function(next){
    this.populate('course');
    next();
  })
 

const Subcourse = mongoose.model('Subcourse', subcourseSchema);

module.exports = Subcourse;