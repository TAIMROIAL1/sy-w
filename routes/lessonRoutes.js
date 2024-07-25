const express = require('express');

const router = express.Router({mergeParams: true});
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getlessons, createLesson, addQuestions, deleteLesson, editLesson } = require('./../controllers/lessonController')

router.route('/')
.get(checkJWT, getlessons)
.post(checkJWT, restrictTo('admin'), createLesson);

router.delete('/:lessonId', checkJWT, restrictTo('admin'), deleteLesson)

router.post('/:lessonId/edit-lesson', checkJWT, restrictTo('admin'), editLesson);

module.exports = router;

