const Course = require('./../models/coursesModel');
const Subcourse = require('./../models/subcourseModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');

exports.getSubcourses = catchAsync(async function(req, res, next) {
  const { courseId } = req.params;
  const subcourses = await Subcourse.find({course: courseId}).populate('course');

  res.status(200).json({
    status: "success",
    results: subcourses.length,
    data: {
      subcourses
    }
  })
});

exports.createSubcourse = catchAsync(async function(req, res, next) {
  const { title, description, photoUrl, price } = req.body;
  const { courseId } = req.params;
  if(!(await Course.findById(courseId))) return next(new AppError('Wrong course!', 400));

  const subcourse = await Subcourse.create({title, description, photoUrl, price, course: courseId});

  res.status(201).json({
    status: "success",
    data: {
      subcourse
    }
  })
});
