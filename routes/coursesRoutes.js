const express = require('express');

const router = express.Router({mergeParams: true});
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getCourses, createCourse, activateCourse, editCourse, deleteCourse } = require('./../controllers/courseController')
const subcourseRouter = require('./subcourseRoutes');

router.route('/')
.get(checkJWT, getCourses)
.post(checkJWT, restrictTo('admin'), createCourse);

router.post('/:courseId/activate-course', checkJWT, activateCourse);

router.post('/:courseId/edit-course', checkJWT, restrictTo('admin'), editCourse);
router.delete('/:courseId', checkJWT, restrictTo('admin'), deleteCourse);

module.exports = router;