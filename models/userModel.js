const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const checkString = function(val) {
  return isNaN(+val);
}

const userSchema =  mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, 'Please Enter your name'],
    minLength: [4, 'A name must be at least 4 character long'],
    maxLength: [16, 'A name can`t be longer than 16 characters'],
    validate: {
      validator: checkString,
      message: 'A name must contain characters'
    }
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please enter your email'],
    validate: {
      validator: function(val) {
        return validator.isEmail(val);
      },
      message: 'Unvalid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Please Enter your password'],
    minLength: [8, 'Your password should be at least 8 characters long'],
    validate: {
      validator: checkString,
      message: 'Your password should contain characters'
    }
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please Confirm your password'],
    validate: {
      validator: function(val) {
        return this.password === val;
      },
      message: 'Passwords don`t match'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Can`t change your role!'
    },
    default: 'user',
    select: false
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetTokenExpiresIn: {
    type: Date,
    select: false
  },
  value: {
    type: Number,
    default: 0
  },
  subcourses: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Subcourse'
  }]
})

userSchema.pre('save',async function(next) {
  if(!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  if(!this.isNew)
  this.passwordChangedAt = new Date(Date.now() - 1000);

next();
});

userSchema.methods.correctPassword = async function(enteredPassword, hashedPassword) {
  return await bcrypt.compare(enteredPassword, hashedPassword);
}

userSchema.methods.checkChangedPassword = function(JWTIsuuedIn) {
  if(this.passwordChangedAt) {
    const changeDate = parseInt(this.passwordChangedAt / 1000, 10);
    if(changeDate > JWTIsuuedIn) return true;
  }

  return false;
};

userSchema.methods.createResetToken = async function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetTokenExpiresIn = new Date(Date.now() + (10 * 60 * 1000));

  await this.save({validateBeforeSave: false});

  return resetToken;
}

const User = mongoose.model('User', userSchema);
module.exports = User;