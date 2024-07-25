const Class = require('./../models/classesModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const { deleteCourses } = require('./deleteChain');

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

  await Class.create({title, description, photoUrl});

  res.status(201).json({
    status: "success",
    message: 'تم رفع الصف بنجاح'
  })
});

exports.editClass = catchAsync(async function(req, res, next) {
  const { classId } = req.params;

  const classToEdit = await Class.findById(classId);

  const { title, description, photoUrl } = req.body;

  if(!title) return next(new AppError('الرجاء ادخال عنوان الدرس', 400, 'message'));
  if(!description) return next(new AppError('الرجاء ادخال الوصف', 400, 'message'));
  if(!photoUrl) return next(new AppError('الرجاء ادخال الصورة', 400, 'message'));

  const checkTitle = classToEdit.title === title;
  const checkDescription = classToEdit.description === description;
  const checkPhotoUrl = classToEdit.photoUrl === photoUrl;

  if(checkTitle && checkDescription && checkPhotoUrl) return next(new AppError('لم تقم بتعديل اي شيء', 400, 'message'));

  classToEdit.title = title;
  classToEdit.description = description;
  classToEdit.photoUrl = photoUrl;

  await classToEdit.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'تم تعديل الصف بنجاح'
  })
})

exports.deleteClass = catchAsync(async function(req, res, next) {
  const { classId } = req.params;
  await deleteCourses(classId);

  await Class.findByIdAndDelete(classId);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف الصف بنجاح'
  })
})