// const Course = require('./../models/coursesModel');
const Subcourse = require('./../models/subcourseModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const Lesson = require('./../models/lessonModel');
const Question = require('./../models/questionModel');

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
    message: 'تم رفع الدرس بنجاح'
  })
});

exports.deleteLesson = catchAsync(async function(req, res, next) {
  const { lessonId } = req.params;
  await Lesson.findByIdAndDelete(lessonId);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف الدرس بنجاح'
  })
})

exports.editLesson = catchAsync(async function(req, res, next) {
  const { lessonId } = req.params;

  const lessonToEdit = await Lesson.findById(lessonId);

  const { title, photoUrl, num } = req.body;

  if(!title) return next(new AppError('الرجاء ادخال عنوان الدرس', 400, 'message'));
  if(!photoUrl) return next(new AppError('الرجاء ادخال الصورة', 400, 'message'));
  if(!num) return next(new AppError('الرجاء ادخال رقم الدرس', 400, 'message'));

  const checkTitle = lessonToEdit.title === title;
  const checkPhotoUrl = lessonToEdit.photoUrl === photoUrl;
  const checkNum = lessonToEdit.num === Number(num);

  if(checkTitle && checkPhotoUrl && checkNum) return next(new AppError('لم تقم بتعديل اي شيء', 400, 'message'));

  lessonToEdit.title = title;
  lessonToEdit.photoUrl = photoUrl;
  lessonToEdit.num = num;

  await lessonToEdit.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'تم تعديل الدرس بنجاح'
  })
})

// TODO test
exports.addVideo = catchAsync(async function(req, res, next) {
  const { title, num, videoUrl} = req.body;
  const { lessonId } = req.params;

  const lesson = await Lesson.findById(lessonId)
  if(!lesson) return next(new AppError('Lesson subcourse!', 400));

  lesson.videos.push({title, num, videoUrl});
  await lesson.save({validateBeforeSave: false})

  res.status(201).json({
    status: "success",
    message: 'Video added successfully'
  })
});

exports.editVideo = catchAsync(async function(req, res, next) {
  const { lessonId, videoId } = req.params;

  const lesson = await Lesson.findById(lessonId);
  const videoToEdit = lesson.videos.find(vid => vid._id == videoId);

  const { title, num } = req.body;

  if(!title) return next(new AppError('الرجاء ادخال عنوان الفيديو', 400, 'message'));
  if(!num) return next(new AppError('الرجاء ادخال رقم الفيديو', 400, 'message'));

  const checkTitle = videoToEdit.title === title;
  const checkNum = videoToEdit.num === Number(num);

  if(checkTitle && checkNum) return next(new AppError('لم تقم بتعديل اي شيء', 400, 'message'));

  videoToEdit.title = title;
  videoToEdit.num = num;

  await lesson.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'تم تعديل الفيديو بنجاح'
  })
})

exports.deleteVideo = catchAsync(async function(req, res, next) {
  const { lessonId, videoId } = req.params;
  const lesson = await Lesson.findById(lessonId);

  const videoIndex = lesson.videos.findIndex(vid => vid == videoId);

  lesson.videos.splice(videoIndex, 1);

  await lesson.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'تم حذف الفيديو بنجاح'
  })
})

exports.addQuestions = catchAsync(async function(req, res, next) {
  const { questions } = req.body;


  if(questions.length < 1) return next(new AppError('Please enter one question at least', 400));

  await Question.create(questions)

  res.status(201).json({
    status: "success",
    message: 'تم اضافة الأسالة بنجاح'
  })
});

exports.editQuestion = catchAsync(async function(req, res, next) {
  const { questionId } = req.params;

  const questionToEdit = await Question.findById(questionId);

  const { text, correctAnswer, answers } = req.body;

  if(!text) return next(new AppError('الرجاء ادخال نص السؤال', 400, 'message'));
  if(!correctAnswer) return next(new AppError('الرجاء ادخال رقم الاجابة الصحيحة', 400, 'message'));
  if(!answers || answers.length < 4) return next(new AppError('الرجاء اكمال الأسألة', 400, 'message'));


  const checkText = questionToEdit.text === text;
  const checkCorrectAnswer = questionToEdit.correctAnswer === Number(correctAnswer);
  let checkAnswers = 0;
  answers.forEach( (answer,i) => {
    if(answer === questionToEdit.answers[i]) checkAnswers++;
  })

  if(checkText && checkCorrectAnswer && checkAnswers === 4) return next(new AppError('لم تقم بتعديل اي شيء', 400, 'message'));

  questionToEdit.text = text;
  questionToEdit.correctAnswer = correctAnswer;
  questionToEdit.answers = answers;

  await questionToEdit.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'تم تعديل السؤال بنجاح'
  })
})

exports.deleteQuestion = catchAsync(async function(req, res, next) {
  const { questionId } = req.params;
  await Question.findByIdAndDelete(questionId);
  
  res.status(200).json({
    status: 'success',
    message: 'تم حذف السؤال بنجاح'
  })
})

exports.getQuestions = catchAsync(async function(req, res, next) {
  const { videoId } = req.params;

  const questions = await Question.find({video: videoId}).select('-correctAnswer');

  res.status(200).json({
    status: 'success',
    results: questions.length,
    data: {
      questions
    }
  })
})

exports.solveQuestions = catchAsync(async function(req, res, next) {
  const { videoId } = req.params;
  const { solvedQuestions } = req.body;

  const questions = await Question.find({video: videoId});

  const results = questions.map(q => {
    const solvedQuestion = solvedQuestions.find(sq => sq.id == q._id);
    return {questionId: q._id, solvedRight: solvedQuestion.answer == q.correctAnswer, correctAnswer: q.correctAnswer, yourAnswer: solvedQuestion.answer}
  })

  res.status(200).json({
    status: 'success',
    results
  })
})