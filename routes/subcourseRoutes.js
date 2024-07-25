const express = require('express');

const router = express.Router({mergeParams: true});
const lessonRouter = require('./lessonRoutes');
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getSubcourses, createSubcourse, activateSubcourse, editSubcourse, deleteSubcourse } = require('./../controllers/subcourseController')

router.route('/')
.get(checkJWT, getSubcourses)
.post(checkJWT, restrictTo('admin'), createSubcourse);

router.post('/:subcourseId/activate-subcourse', checkJWT, activateSubcourse);
router.post('/:subcourseId/edit-subcourse', checkJWT, restrictTo('admin'), editSubcourse)
router.delete('/:subcourseId', checkJWT, restrictTo('admin'), deleteSubcourse);

module.exports = router;