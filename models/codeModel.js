const mongoose = require('mongoose');
const User = require('./userModel');

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
//TODO
codeSchema.methods.activateCode = async function(userId) {
  const user = await User.findById(userId);
  
  if(this.activated === true) return false;
  user.value += this.value;
  await user.save({validateBeforeSave: false});
  this.activated = true;
  this.activatedBy = userId;
  await this.save({validateBeforeSave: false});
  return true;
}

const Code = mongoose.model('Code', codeSchema);

module.exports = Code;