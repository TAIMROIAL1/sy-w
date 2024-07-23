const Course = require('./../models/coursesModel');
const Subcourse = require('./../models/subcourseModel')
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const Class = require('./../models/classesModel');

exports.getCourses = catchAsync(async function(req, res, next) {
  const { classId } = req.params;
  const courses = await Course.find({class: classId}).populate('class');

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
  if(!(await Class.findById(classId))) return next(new AppError('Wrong class!', 400));

  const course = await Course.create({title, description, photoUrl, price, class: classId});

  const subcourses = [{
    title: "كورس تفريغ",
    price: 30,
    course: course._id
},
{
  title: "كورس رسمات",
  price: 30,
  course: course._id
},
{
  title: "كورس اتمتات",
  price: 30,
  course: course._id
},
{
  title: "كورس شرح",
  price: 30,
  course: course._id
}];

  await Subcourse.create(subcourses);
  
  res.status(201).json({
    status: "success",
    message: 'تم رفع الكورس بنجاح'
  })
});

exports.activateCourse = catchAsync(async function(req, res, next) {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if(!course) return next('This course doesn`t exist!', 400);

  const { user } = req;
  const subcourses = await Subcourse.find({course: courseId});

  for(const sc of subcourses) {
    if(user.subcourses.includes(sc._id)) return next(new AppError('You have already unlocked this course', 400));
  }

  if(course.price > user.value) return next('You don`t have enough money to buy this course!', 400);

  user.value -= course.price;

  subcourses.forEach(sc => user.subcourses.push(sc._id));

  await user.save({validateBeforeSave: false});

  res.status(200).json({
    status: "success",
    message: 'Course has been bought successfully'
  })
})

exports.deleteCourse = catchAsync(async function(req, res, next) {
  const { courseId } = req.params;
  await Course.findByIdAndDelete(courseId);
  await Subcourse.deleteMany({course: courseId});
  res.status(200).json({
    status: 'success',
    message: 'تم حذف الكورس بنجاح'
  })
})

exports.editCourse = catchAsync(async function(req, res, next) {
  const { courseId } = req.params;

  const courseToEdit = await Course.findById(courseId);

  const { title, description, photoUrl, price } = req.body;

  if(!title) return next(new AppError('الرجاء ادخال عنوان الدرس', 400, 'message'));
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