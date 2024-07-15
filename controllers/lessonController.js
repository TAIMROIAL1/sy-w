// const Course = require('./../models/coursesModel');
const Subcourse = require('./../models/subcourseModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const Lesson = require('./../models/lessonModel');


exports.getlessons = catchAsync(async function(req, res, next) {
  const { subcourseId } = req.params;
  const lessons = await Lesson.find({subcourse: subcourseId});

  res.status(200).json({
    status: "success",
    results: lessons.length,
    data: {
      lessons
    }
  })
});


exports.createLesson = catchAsync(async function(req, res, next) {
  const { title, num, photoUrl } = req.body;
  const { subcourseId } = req.params;
  if(!(await Subcourse.findById(subcourseId))) return next(new AppError('Wrong subcourse!', 400));

  const lesson = await Lesson.create({title, num, photoUrl, subcourse: subcourseId});

  res.status(201).json({
    status: "success",
    data: {
      lesson
    }
  })
});

// TODO test
exports.addVideo = catchAsync(async function(req, res, next) {
  const { title, num, videoUrl, lessonId } = req.body;

  const lesson = await Lesson.findById(lessonId)
  if(!lesson) return next(new AppError('Lesson subcourse!', 400));

  lesson.videos.push({title, num, videoUrl});
  await lesson.save({validateBeforeSave: false})

  res.status(201).json({
    status: "success",
    message: 'Video added successfully'
  })
});

exports.addQuestions = catchAsync(async function(req, res, next) {
  const { questions, lessonId, videoId } = req.body;
  if(questions.length < 1) return next(new AppError('Please enter one question at least', 400));

  const lesson = await Lesson.findById(lessonId)
  if(!lesson) return next(new AppError('Lesson subcourse!', 400));

  const video = lesson.videos.find(v => {
  return v._id == videoId
  });

  questions.forEach(q => video.questions.push(q));
  video.questions.push(questions);
  await lesson.save({validateBeforeSave: false})

  res.status(201).json({
    status: "success",
    message: 'Questions added successfully'
  })
});