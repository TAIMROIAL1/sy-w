const User = require('./../models/userModel');
const Code = require('./../models/codeModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');

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
  const cCode = await Code.create({code, value});

  res.status(201).json({
    status: "success",
    data: {
      code: cCode
    }
  })
});

exports.activateCode = catchAsync(async function(req, res, next) {
  const { code } = req.body;
  const c = await Code.findOne({code, activated: false});
  console.log(c);
  if(!c) return next(new AppError('Invalid code', 400));

  const { user } = req;
  await c.activateCode(user._id);

  res.status(200).json({
    status: "success",
    message: "Code has been activated"
  })
})