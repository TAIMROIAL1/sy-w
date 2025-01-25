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
  }
})

codeSchema.methods.activateCode = async function(userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId);
  
  const activatioinCode = this.constructor.findOneAndUpdate({_id: this._id}, {activated: true, activatedBy: userId}, {new: true,session});
  if(!activatioinCode) {
    await session.abortTransaction();
    session.endSession();
    return false;
  }

  user.value += this.value;
  await user.save({validateBeforeSave: false});
  
  this.activated = true;
  this.activatedBy = userId;
  await this.save({validateBeforeSave: false});

  await session.commitTransaction();
  session.endSession();

  return true;
  } catch(err) {
    await session.abortTransaction();
    session.endSession();

    return false;
  }
  
}



const Code = mongoose.model('Code', codeSchema);

module.exports = Code;