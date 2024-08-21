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
    required: [true, 'الرجاء ادخال الاسم'],
    minLength: [4, 'الاسم قصير جدا'],
    maxLength: [10, 'الاسم طويل جدا'],
    validate: {
      validator: checkString,
      message: 'يجب ان يحتوي الاسم على حروف'
    }
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'الرجاء ادخال البريد الالكتروني'],
    validate: {
      validator: function(val) {
        return validator.isEmail(val);
      },
      message: 'هذا البريد غير صالح'
    }
  },
  password: {
    type: String,
    required: [true, 'الرجاء ادخال كلمة السر'],
    minLength: [8, 'يجب ان تكون كلمة السر اطول من ثمانية احرف'],
    maxLength: [30, 'كلمة السر طويلة جدا'],
    validate: {
      validator: checkString,
      message: 'يجب ان تحتوي كلمة السر على احرف'
    }
  },
  passwordConfirm: {
    type: String,
    required: [true, 'الرجاء تأكيد كلمة السر'],
    validate: {
      validator: function(val) {
        return this.password === val;
      },
      message: 'كلمات السر غير متطابقة'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'لا يمكنك تغيير دورك'
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
  }],
  screenWidth: {
    type: String
  },
  screenHeight: {
    type: String
  }
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