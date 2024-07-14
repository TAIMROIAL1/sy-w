const Class = require('./../models/classesModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');

exports.getClasses = catchAsync(async function(req, res, next) {
  const classes = await Class.find();

  res.status(200).json({
    status: "success",
    results: classes.length,
    data: {
      classes
    }
  })
});

exports.createClass = catchAsync(async function(req, res, next) {
  const { title, description, photoUrl } = req.body;

  const cClass = await Class.create({title, description, photoUrl});

  res.status(201).json({
    status: "success",
    data: {
      class: cClass
    }
  })
});