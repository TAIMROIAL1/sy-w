const mongoose = require('mongoose');
const User = require('./userModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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

  if(this.category.startsWith('workshop')) {
    const workshopId = this.category.split(':')[1].trim();
    user.workshops.push(workshopId);
  }

  else {
    user.value += this.value;
  }
  
  await user.save({validateBeforeSave: false});
  
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