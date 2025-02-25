const User = require('./../models/userModel');
const Code = require('./../models/codeModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const crypto = require('crypto')

exports.getCodes = catchAsync(async function(req, res, next) {
  const codes = await Code.find();

  res.status(200).json({
    status: "success",
    results: codes.length,
    data: {
      codes
    }
  })
});

exports.createCode = catchAsync(async function(req, res, next) {
  const { code, value } = req.body;

  // TODO crypt the code
  const hashedCode = crypto.pbkdf2Sync(code, process.env.JWT_SECRET_KEY, 10000, 64, 'sha512').toString('hex');
  const cCode = await Code.create({code: hashedCode, value});

  res.status(201).json({
    status: "success",
    message: "تم انشاء الكود بنجاح"
  })
});

exports.activateCode = catchAsync(async function(req, res, next) {
  const { code } = req.body;
  const session = await Code.startSession();
  session.startTransaction();
  
  const hashedCode = crypto.pbkdf2Sync(code, process.env.JWT_SECRET_KEY, 10000, 64, 'sha512').toString('hex');
  try{

  const c = await Code.findOne({code: hashedCode, activated: false}).session(session);

  if(!c){
    await session.abortTransaction();
    session.endSession();
    return next(new AppError('هذا الكود غير فعال', 400, 'code'));
  } 

  const { user } = req;
  const tried = await c.activateCode(user._id);
  if(!tried){
    await session.abortTransaction();
    session.endSession();
    return next(new AppError('هذا الكود غير فعال', 400, 'code'));
  } 
  await session.commitTransaction();
  session.endSession();
  res.status(200).json({
    status: "success",
    message: "تم تفعيل الكود بنجاح"
  })
}catch(err){
  await session.abortTransaction();
  session.endSession();
  throw(err);
} 
})