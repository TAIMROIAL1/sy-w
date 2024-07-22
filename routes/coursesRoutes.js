const express = require('express');

const router = express.Router({mergeParams: true});
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getCourses, createCourse, activateCourse } = require('./../controllers/courseController')
const subcourseRouter = require('./subcourseRoutes');

router.route('/')
.get(checkJWT, getCourses)
.post(checkJWT, restrictTo('admin'), createCourse);

router.route('/:courseId/activate-course').post(checkJWT, activateCourse);

module.exports = router;