const mongoose = require('mongoose');
const User = require('./userModel');
const Course = require('./coursesModel');
const Subcourse = require('./subcourseModel')
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const {activateCourse} = require('./../controllers/courseController');

const codeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please enter the code'],
    unique: [true, 'The code must be unique']
  },
  value: {
    type: Number,
    required: [true, 'Please enter the value of the code']
  },
  activatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  activated: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    required: [true, 'Please enter the category of the code']
  }
})

codeSchema.methods.activateCode = async function(userId) {

  try {
    const user = await User.findById(userId);
  
  const activatioinCode = await this.constructor.findOneAndUpdate({_id: this._id}, {activated: true, activatedBy: userId});

  if(!activatioinCode) return false;

  if(this.category.trim().startsWith('workshop')) {
    const workshopId = this.category.split(':')[1].trim();
    user.workshops.push(workshopId);
     const result = await user.save({validateBeforeSave: false});

  }

  else if(this.category.trim().startsWith('courses')) {
    const coursesIds = this.category.split(':')[1].split(',');

    console.log("IDs : ", coursesIds);
    for(let i = 0; i < coursesIds.length; i++) {
      const cId = coursesIds[i];
      const courseId = cId.trim();
       const course = await Course.findById(courseId);

       console.log("Course : ", course);
  if(!course) throw new Error();

  const subcourses = await Subcourse.find({course: courseId});

  console.log("Subcourses : ", subcourses);
  subcourses.forEach(sc =>{ 
    if(!user.subcourses.includes(sc._id))
    user.subcourses.push(sc._id)
  });
  
  const result = await user.save({validateBeforeSave: false});
}
  }
  else {
    user.value += this.value;
     const result = await user.save({validateBeforeSave: false});

  }
  
  
  this.activated = true;
  this.activatedBy = userId;
  await this.save({validateBeforeSave: false});

  return true;
  } catch(err) {

    return false;
  }
  
}



const Code = mongoose.model('Code', codeSchema);

module.exports = Code;