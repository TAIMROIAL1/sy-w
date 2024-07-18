const express = require('express');
const Class = require('./../models/classesModel');
const Course = require('./../models/coursesModel');
const Subourse = require('./../models/subcourseModel');
const catchAsync = require('./../utils/catchAsync')
const { checkJWT } = require('./../controllers/authController')
const router = express.Router();

router.get('/sign-up', checkJWT, (req, res) => {
  if(res.locals.user) {
    return res.status(200).render('mainpage');
  }
  res.status(200).render('sign');
});

router.get('/', checkJWT, catchAsync(async (req, res) => {
  if(!res.locals.user) {
    return res.status(200).render('sign');
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
    return res.status(200).render('sign');
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
    return res.status(200).render('sign');
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

module.exports = router;