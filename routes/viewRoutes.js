const express = require('express');
const Class = require('./../models/classesModel');
const Course = require('./../models/coursesModel');
const { checkJWT } = require('./../controllers/authController')
const router = express.Router();

router.get('/sign-up', checkJWT, (req, res) => {
  if(res.locals.user) {
    return res.status(200).render('mainpage');
  }
  res.status(200).render('sign');
});

router.get('/', checkJWT, async (req, res) => {
  if(!res.locals.user) {
    return res.status(200).render('sign');
  }
  const classes = await Class.find();
  const { user } = res.locals;
  res.status(200).render('mainpage', {
    user,
    classes,
    title: "Studyou"
  });
})

router.get('/classes/:classId/courses', checkJWT, async (req, res) => {
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
})

module.exports = router;