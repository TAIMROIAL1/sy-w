const Workshop = require('./../models/workshopsModel');
const Lesson = require('./../models/lessonModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');

exports.activateWorkshop = catchAsync(async function(req, res, next) {
  const { workshopId } = req.params;

  const workshop = await Workshop.findById(workshopId);

  if(!workshop) return next('هذه الورشة غير موجودة', 400);

  const { user } = req;

  if(user.workshops.includes(workshop._id))
    return next(new AppError('لقد اشتريت هذه الورشة', 400));

  if(workshop.value > user.value) return next(new AppError('لا تمتلك نقاط كافية لشراء هذه الورشة', 400));

  user.value -= workshop.value;

  user.workshops.push(workshop._id);

  await user.save({validateBeforeSave: false});

  res.status(200).json({
    status: "success",
    message: 'تم شراء الورشة بنجاح'
  })
})

exports.createLesson = catchAsync(async function(req, res, next) {
  const { title, num, photoUrl } = req.body;
  const { workshopId } = req.params;
  if(!(await Workshop.findById(workshopId))) return next(new AppError('هذه الورشة غير موجودة', 400));

  const lesson = await Lesson.create({title, num, photoUrl, workshop: workshopId});

  res.status(201).json({
    status: "success",
    message: 'تم رفع الدرس بنجاح'
  })
});
