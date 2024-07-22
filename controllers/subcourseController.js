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

exports.activateSubcourse = catchAsync(async function(req, res, next) {
  const { user } = req;

  const { subcourseId } = req.body;
  if(!subcourseId) return next(new AppError('الرجاء اختيار كورس', 400, 'message'));
  
  if(user.subcourses.includes(subcourseId)) return next(new AppError('لقد اشتريت هذا الكورس بالفعل', 400, 'message'));

  const subcourse = await Subcourse.findById(subcourseId);
  if(!subcourse) return next('هذا الكورس غير موجود', 400, 'message');

  if(user.value < subcourse.price) return next(new AppError('لا تمتلك نقاط كافية لشراء هذا الكورس', 400, 'message'))

  user.value -= subcourse.price;
  user.subcourses.push(subcourseId);

  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    message: 'لقد اشتريت الكورس بنجاح',
    path: 'message'
  })
})