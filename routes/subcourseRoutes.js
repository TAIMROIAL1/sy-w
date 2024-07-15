const express = require('express');

const router = express.Router({mergeParams: true});
const lessonRouter = require('./lessonRoutes');
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getSubcourses, createSubcourse } = require('./../controllers/subcourseController')

router.route('/')
.get(checkJWT, getSubcourses)
.post(checkJWT, restrictTo('admin'), createSubcourse);

router.use('/:subcourseId/lessons', lessonRouter)

module.exports = router;