const Course = require('./../models/coursesModel');
const Subcourse = require('./../models/subcourseModel')
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const Class = require('./../models/classesModel');
const { deleteSubcourses } = require('./deleteChain');

exports.getCourses = catchAsync(async function(req, res, next) {
  const { classId } = req.params;

  if(!classId) return next(new AppError('حدث خطأ, الرجاء المحاولة مجددا', 400));

  const courses = await Course.find({class: classId}).populate('class');

  if(!courses) return next(new AppError('حدث خطأ, الرجاء المحاولة مجددا', 400));
  
  res.status(200).json({
    status: "success",
    results: courses.length,
    data: {
      courses
    }
  })
});

exports.createCourse = catchAsync(async function(req, res, next) {
  const { title, description, photoUrl, price } = req.body;
  const { classId } = req.params;
  if(!(await Class.findById(classId))) return next(new AppError('هذا الصف غير موجود', 400));

  const course = await Course.create({title, description, photoUrl, price, class: classId});

  const subcourses = [{
    title: "كورس الشرح",
    price: 300,
    course: course._id,
    photoUrl: 'explain.jpg'
},
{
  title: "ادرس معي",
  price: 300,
  course: course._id,
  photoUrl: 'study-with-me.jpg'
},
{
  title: "كورس الأتمتات",
  price: 300,
  course: course._id,
  photoUrl: 'choices.jpg'
},
{
  title: "كورس الرسمات",
  price: 300,
  course: course._id,
  photoUrl: 'paintings.jpg'
}];

await Subcourse.create(subcourses[0]);
await Subcourse.create(subcourses[1]);
await Subcourse.create(subcourses[2]);
await Subcourse.create(subcourses[3]);

  res.status(201).json({
    status: "success",
    message: 'تم رفع الكورس بنجاح'
  })
});

exports.activateCourse = catchAsync(async function(req, res, next) {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if(!course) return next('هذا الكورس غير موجود', 400);

  const { user } = req;
  const subcourses = await Subcourse.find({course: courseId});

  for(const sc of subcourses) {
    if(user.subcourses.includes(sc._id)) return next(new AppError('لقد اشتريت هذا الكورس او جزء منه', 400));
  }

  if(course.price > user.value) return next(new AppError('لا تمتلك نقاط كافية لشراء هذا الكورس', 400));

  user.value -= course.price;

  subcourses.forEach(sc => user.subcourses.push(sc._id));

  await user.save({validateBeforeSave: false});

  res.status(200).json({
    status: "success",
    message: 'تم شراء الكورس بنجاح'
  })
})

exports.deleteCourse = catchAsync(async function(req, res, next) {
  const { courseId } = req.params;
  await Course.findByIdAndDelete(courseId);
  await deleteSubcourses(courseId);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف الكورس بنجاح'
  })
})

exports.editCourse = catchAsync(async function(req, res, next) {
  const { courseId } = req.params;

  const courseToEdit = await Course.findById(courseId);

  const { title, description, photoUrl, price } = req.body;

  if(!title) return next(new AppError('الرجاء ادخال عنوان الكورس', 400, 'message'));
  if(!description) return next(new AppError('الرجاء ادخال الوصف', 400, 'message'));
  if(!photoUrl) return next(new AppError('الرجاء ادخال الصورة', 400, 'message'));
  if(!price) return next(new AppError('الرجاء ادخال سعر', 400, 'message'));

  

  const checkTitle = courseToEdit.title === title;
  const checkDescription = courseToEdit.description === description;
  const checkPhotoUrl = courseToEdit.photoUrl === photoUrl;
  const checkPrice = courseToEdit.price === Number(price);

  if(checkTitle && checkDescription && checkPhotoUrl && checkPrice) return next(new AppError('لم تقم بتعديل اي شيء', 400, 'message'));

  courseToEdit.title = title;
  courseToEdit.description = description;
  courseToEdit.photoUrl = photoUrl;
  courseToEdit.price = price;

  await courseToEdit.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'تم تعديل الكورس بنجاح'
  })
})