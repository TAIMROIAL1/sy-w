const Course = require('./../models/coursesModel');
const Subcourse = require('./../models/subcourseModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const { deleteLessons } = require('./deleteChain');

exports.getSubcourses = catchAsync(async function(req, res, next) {
  const { courseId } = req.params;

  if(!courseId) return next(new AppError('حدث خطأ, الرجاء المحاولة مجددا', 400));

  const subcourses = await Subcourse.find({course: courseId}).populate('course');

  if(!subcourses) return next(new AppError('حدث خطأ, الرجاء المحاولة مجددا', 400));
  
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
  if(!(await Course.findById(courseId))) return next(new AppError('هذا الكورس غير موجود', 400));

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

  const { subcourseId } = req.params;
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

exports.editSubcourse = catchAsync(async function(req, res, next) {
  const { subcourseId } = req.params;

  const subcourseToEdit = await Subcourse.findById(subcourseId);

  const { title, description, photoUrl, price } = req.body;

  if(!title) return next(new AppError('الرجاء ادخال عنوان الكورس', 400, 'message'));
  if(!description) return next(new AppError('الرجاء ادخال الوصف', 400, 'message'));
  if(!photoUrl) return next(new AppError('الرجاء ادخال الصورة', 400, 'message'));
  if(!price) return next(new AppError('الرجاء ادخال سعر', 400, 'message'));

  

  const checkTitle = subcourseToEdit.title === title;
  const checkDescription = subcourseToEdit.description === description;
  const checkPhotoUrl = subcourseToEdit.photoUrl === photoUrl;
  const checkPrice = subcourseToEdit.price === Number(price);

  if(checkTitle && checkDescription && checkPhotoUrl && checkPrice) return next(new AppError('لم تقم بتعديل اي شيء', 400, 'message'));

  subcourseToEdit.title = title;
  subcourseToEdit.description = description;
  subcourseToEdit.photoUrl = photoUrl;
  subcourseToEdit.price = price;

  await subcourseToEdit.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'تم تعديل الكورس بنجاح'
  })
})

exports.deleteSubcourse = catchAsync(async function(req, res, next) {
  const { subcourseId } = req.params;
  await Subcourse.findByIdAndDelete(subcourseId);
  await deleteLessons(subcourseId);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف الكورس بنجاح'
  })
})