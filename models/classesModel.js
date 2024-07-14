const mongoose = require('mongoose');

const ClassesSchema = new mongoose.Schema({
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
    required: [true, 'Please enter a photo url']
  },
});

const Class = mongoose.model('Class', ClassesSchema);

module.exports = Class;