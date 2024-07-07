const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const sendMail = require('./../utils/email.js');
const crypto = require('crypto');

const signToken = user => jwt.sign({id: user._id}, process.env.JWT_SECRET_KEY, {expiresIn: process.env.JWT_EXPIRES_IN});

exports.signup = catchAsync(async function(req, res, next) {
  console.log(req.body);
  
    const { name, email, password, passwordConfirm } = req.body;
    
    const user = await User.create({name, email, password, passwordConfirm});
    
    const token = signToken(user);
    res.status(201).json({
      status: 'success',
      token
    })
})

exports.login = catchAsync(async function(req, res, next) {
  const {name, password} = req.body;

  if(!name) return next(new AppError('Please enter your name', 400));
  if(!password) return next(new AppError('Please enter your password', 400));
    console.log(name);
  const user = await User.findOne({name});
  if(!user) return next(new AppError('There is no user with this name', 404));

  if(!(await user.correctPassword(password, user.password))) return next(new AppError('Sorry, your password is incorrect, please try again'));

  const token = signToken(user);

  res.status(200).json({
    status: 'success',
    token
  })

})

exports.forgotPassword = catchAsync(async function(req, res, next) {
  const { email } = req.body;
  if(!email) return next(new AppError('Please enter your email', 400));

  const user = await User.findOne({email});
  if(!user) return next(new AppError('There is no account with this email', 404));

  const resetToken = await user.createResetToken();

  await sendMail(user.email, `To reset your password follow this link: http://127.0.0.1/api/v1/users/reset-password/${resetToken}`, 'Reseting the password');

  res.status(200).json({
    status: 'success'
  })
})

exports.resetPassword = catchAsync(async function(req, res, next) {
  const { resetToken } = req.params;
  if(!resetToken) return next(new AppError('You need a reset token', 400));

  const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const user = await User.findOne({passwordResetToken: hashedResetToken, passwordResetTokenExpiresIn: {$gt: Date.now()}});

  if(!user) return next(new AppError('Reset Token unvalid or outdated', 400));
  console.log('Hi');
  const { curPassword, password, passwordConfirm } = req.body;
  if(!(await user.correctPassword((curPassword + ''), user.password))) return next(new AppError('Sorry, your password is incorrect, please try again', 400));

  
  user.password = password;
  user.passwordConfirm = passwordConfirm;

  const err = user.validateSync('password');
  if(err) return next(new AppError(err.message, 400));

  const err2 = user.validateSync('passwordConfirm');
  if(err2) return next(new AppError(err2.message, 400));

  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresIn = undefined;

  await user.save({validateBeforeSave: false});


  res.status(200).json({
    status: 'success'
  })
})

exports.checkFingerPrint = function(req, res, next) {
  const userAgent = req.headers['user-agent'];
  console.log(userAgent);
  next();
}