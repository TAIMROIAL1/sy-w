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

const WORKSHOP_SUBCOURSES = ['69ed6fb1ad45e39f4a699ff0', '69ed6fc7ad45e39f4a699ff1', '69ed6fecad45e39f4a699ff2', '69ed7003ad45e39f4a699ff3', '69ed7023ad45e39f4a699ff4'];

codeSchema.methods.activateCode = async function(userId) {
  // claim the code first: only one request can flip activated false -> true
  const claimed = await this.constructor.findOneAndUpdate({ _id: this._id, activated: false }, { activated: true, activatedBy: userId });
  if(!claimed) return false;

  try {
    const category = this.category.trim();
    let update;

    if(category.startsWith('workshop')) {
      update = { $addToSet: { subcourses: { $each: WORKSHOP_SUBCOURSES } } };
    }
    else if(category.startsWith('courses')) {
      const ids = [];
      for(const courseId of category.split(':')[1].split(',').map(id => id.trim())) {
        if(!(await Course.findById(courseId))) throw new Error(`Course ${courseId} not found`);
        (await Subcourse.find({ course: courseId }).select('_id')).forEach(sc => ids.push(sc._id));
      }
      update = { $addToSet: { subcourses: { $each: ids } } };
    }
    else {
      update = { $inc: { value: this.value } };
    }

    await User.updateOne({ _id: userId }, update);
    return true;
  } catch(err) {
    await this.constructor.updateOne({ _id: this._id }, { activated: false, $unset: { activatedBy: 1 } });
    return false;
  }
}



const Code = mongoose.model('Code', codeSchema);

module.exports = Code;