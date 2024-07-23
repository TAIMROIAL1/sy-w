const express = require('express');
const Class = require('./../models/classesModel');
const Course = require('./../models/coursesModel');
const Lesson = require('./../models/lessonModel');
const Subourse = require('./../models/subcourseModel');
const catchAsync = require('./../utils/catchAsync')
const { checkJWT, restrictTo } = require('./../controllers/authController')
const router = express.Router();

router.get('/sign-up', checkJWT, (req, res) => {
  if(res.locals.user) {
    return res.status(200).render('mainpage');
  }
  res.status(200).render('sign');
});

router.get('/', checkJWT, catchAsync(async (req, res) => {
  if(!res.locals.user) {
    return res.status(200).render('toSign');
  }
  const classes = await Class.find();
  console.log(classes)

  const { user } = res.locals;
  res.status(200).render('mainpage', {
    user,
    classes,
    title: "Studyou"
  });
}))

router.get('/classes/:classId/courses', checkJWT, catchAsync(async (req, res) => {
  if(!res.locals.user) {
    return res.status(200).render('toSign');
  }
  const {classId} = req.params;
  const courses = await Course.find({ class: classId});
  
  const { user } = res.locals;
  res.status(200).render('courses', {
    user,
    courses,
    title: "Studyou | courses"
  });
}))

router.get('/courses/:courseId/subcourses', checkJWT, catchAsync(async (req, res) => {
  if(!res.locals.user) {
    return res.status(200).render('toSign');
  }

  const {courseId} = req.params;
  console.log(courseId);
  const subcourses = await Subourse.find({ course: courseId});
  console.log(subcourses)
  const { user } = res.locals;
  res.status(200).render('subcourses', {
    user,
    subcourses,
    title: "Studyou | subcourses"
  });
}))

router.get('/subcourses/:subcourseId/lessons', checkJWT, catchAsync(async (req, res) => {
  if(!res.locals.user) {
    return res.status(200).render('toSign');
  }

  const {subcourseId} = req.params;

  const lessons = await Lesson.find({ subcourse: subcourseId});

  const { user } = res.locals;

  res.status(200).render('video', {
    user,
    lessons,
    title: "Studyou | lessons"
  });
}))

router.get('/settings', checkJWT, catchAsync(async (req, res) => {
  if(!res.locals.user) {
    return res.status(200).render('toSign');
  }
  const { user } = res.locals;
  res.status(200).render('settings', {
    user
  });
}))

router.get('/upload-class', checkJWT, restrictTo('admin'), catchAsync(async (req, res) => {
  const { user } = res.locals;
  res.status(200).render('uploadClass', {
    user
  });
}))

router.get('/classes/:classId/upload-course', checkJWT, restrictTo('admin'), catchAsync(async (req, res) => {
  const { user } = res.locals;
  res.status(200).render('uploadCourse', {
    user
  });
}))

router.get('/edit-class/:classId', checkJWT, restrictTo('admin'), catchAsync(async(req, res) => {
  const { classId } = req.params;
  const classToEdit = await Class.findById(classId);
  res.status(200).render('editClass', {
    cToEdit: classToEdit
  })
}));

router.get('/classes/:classId/edit-course/:courseId', checkJWT, restrictTo('admin'), catchAsync(async(req, res) => {
  const { courseId } = req.params;
  const courseToEdit = await Course.findById(courseId);
  res.status(200).render('editCourse', {
    cToEdit: courseToEdit
  })
}))
module.exports = router;