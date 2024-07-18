const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const sendMail = require('./../utils/email.js');
const crypto = require('crypto');
const { promisify } = require('util')

const signToken = user => jwt.sign({id: user._id}, process.env.JWT_SECRET_KEY, {expiresIn: process.env.JWT_EXPIRES_IN});

exports.checkJWT = catchAsync(async function(req, res, next) {
  //1) Check if a token exists: PT 
  let token;
  if(req.cookies.jwt){
    token = req.cookies.jwt;
  } else if((req.headers.authorization && req.headers.authorization.startsWith('Bearer'))) {
    token = req.headers.authorization.split(' ')[1];
    } else {
  if(!req.originalUrl.startsWith('/api')){ 
    return next();
  }return next(new AppError('You are not logged in! Please login to gain access', 401));
}
  // if(!token) return next(new AppError('You are not logged in! Please login to gain access', 401));
  //2) Validate the token PT
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
  } catch(err) {
    if(!req.originalUrl.startsWith('/api') ){
      return next();
    }
    return next(new AppError('You are not logged in! Please login to gain access', 401));
  }
  const { id } = decoded;

  if(!id && !req.originalUrl.startsWith('/api') ) {
    if(!req.originalUrl.startsWith('/api') ) return next();    
    return next(new AppError('You are not logged in! Please login to gain access', 401))
  }

  
  //3) Check if a user exists PT

    const user = await User.findById(id).select('+role');
    if(!user) {
      if(!req.originalUrl.startsWith('/api') ) return next();
      return next(new AppError('You are not logged in! Please login to gain access', 401));
    }

  //4) Check if user changed password after the token was issued PT

  if(user.checkChangedPassword(decoded.iat)) {
    if(!req.originalUrl.startsWith('/api') ) return next();
    return next(new AppError('Password has been changed, please login again', 401))
}
  //5) If valid token, call next(); PT
    if(!req.originalUrl.startsWith('/api') ) res.locals.user = user;
    else req.user = user;
    next();
})

exports.restrictTo = function(...roles) {
  return async function(req, res, next) {
    const { user } = req;
    if(!roles.includes(user.role)) return next(new AppError('You don`t have permission to perform this action!', 403));

    next();
  }
}

exports.signup = catchAsync(async function(req, res, next) {  
    const { name, email, password, passwordConfirm } = req.body;
    
    const user = await User.create({name, email, password, passwordConfirm});

    const token = signToken(user);

    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true
    };

    // if(process.env.NODE_ENV === 'production') cookieOptions.secure = true; 

    res.cookie('jwt', token, cookieOptions);

    res.status(201).json({
      status: 'success'
    })
})

exports.login = catchAsync(async function(req, res, next) {
  const {name, password} = req.body;

  if(!name) return next(new AppError('Validation Error: الرجاء ادخال الاسم الكامل', 400, 'name'));
  if(!password) return next(new AppError('Validation Error: الرجاء ادخال كلمة السر', 400, 'password'));

  const user = await User.findOne({name});
  if(!user) return next(new AppError('Validation Error: هذا المستخدم غير موجود', 404, 'name'));

  if(!(await user.correctPassword(password, user.password))) return next(new AppError('Validation Error: كلمة السر خاطئة حاول مجددا', 400, 'password'));

  const token = signToken(user);

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  // if(process.env.NODE_ENV === 'production') cookieOptions.secure = true; 

  res.cookie('jwt', token, cookieOptions);

  res.status(200).json({
    status: 'success',
  })

})

// exports.forgotPassword = catchAsync(async function(req, res, next) {
//   const { email } = req.body;
//   if(!email) return next(new AppError('Please enter your email', 400));

//   const user = await User.findOne({email});
//   if(!user) return next(new AppError('There is no account with this email', 404));

//   const resetToken = await user.createResetToken();

//   await sendMail(user.email, `To reset your password follow this link: http://127.0.0.1/api/v1/users/reset-password/${resetToken}`, 'Reseting the password');

//   res.status(200).json({
//     status: 'success'
//   })
// })

// exports.resetPassword = catchAsync(async function(req, res, next) {
//   const { resetToken } = req.params;
//   if(!resetToken) return next(new AppError('You need a reset token', 400));

//   const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

//   const user = await User.findOne({passwordResetToken: hashedResetToken, passwordResetTokenExpiresIn: {$gt: Date.now()}});

//   if(!user) return next(new AppError('Reset Token unvalid or outdated', 400));

//   const { curPassword, password, passwordConfirm } = req.body;
//   if(!(await user.correctPassword((curPassword + ''), user.password))) return next(new AppError('Sorry, your password is incorrect, please try again', 400));

  
//   user.password = password;
//   user.passwordConfirm = passwordConfirm;

//   const err = user.validateSync('password');
//   if(err) return next(new AppError(err.message, 400));

//   const err2 = user.validateSync('passwordConfirm');
//   if(err2) return next(new AppError(err2.message, 400));

//   user.passwordResetToken = undefined;
//   user.passwordResetTokenExpiresIn = undefined;

//   await user.save({validateBeforeSave: false});


//   res.status(200).json({
//     status: 'success'
//   })
// })

exports.checkFingerPrint = function(req, res, next) {
  const userAgent = req.headers['user-agent'];

  next();
}
