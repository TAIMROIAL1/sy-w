const express = require('express');

const router = express.Router({mergeParams: true});
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getlessons, createLesson, addVideo, addQuestions } = require('./../controllers/lessonController')

router.route('/')
.get(checkJWT, getlessons)
.post(checkJWT, restrictTo('admin'), createLesson);

router.route('/add-video')
.post(checkJWT, restrictTo('admin'), addVideo);

router.route('/add-questions')
.post(checkJWT, restrictTo('admin'), addQuestions);

module.exports = router;

