const express = require('express');

const router = express.Router({mergeParams: true});
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getlessons, createLesson, addQuestions, deleteLesson, editLesson, editVideo, editQuiz, deleteVideo } = require('./../controllers/lessonController')

router.route('/')
.post(checkJWT, restrictTo('admin'), createLesson);

router.delete('/:lessonId', checkJWT, restrictTo('admin'), deleteLesson)

router.post('/:lessonId/edit-lesson', checkJWT, restrictTo('admin'), editLesson);

router.delete('/:lessonId/videos/:videoNum', checkJWT, restrictTo('admin'), deleteVideo);

router.post('/:lessonId/videos/:videoNum/edit-video', checkJWT, restrictTo('admin'), editVideo);

router.post('/:lessonId/quizzes/:videoNum/edit-quiz', checkJWT, restrictTo('admin'), editQuiz);

module.exports = router;
