const express = require('express');

const { checkJWT, restrictTo, checkActivatedWorkshop } = require('./../controllers/authController');
const { activateWorkshop, createLesson } = require('./../controllers/workshopController');
const { getQuestions, solveQuestions } = require('./../controllers/lessonController');

const router = express.Router({mergeParams: true});


router.post('/:workshopId/activate-workshop', checkJWT, activateWorkshop);

router.post('/:workshopId/lessons', checkJWT, restrictTo('admin'), createLesson)

router.post('/videos/:videoId/questions', checkJWT, checkActivatedWorkshop, getQuestions);

router.post('/videos/:videoId/questions/solve-questions', checkJWT, checkActivatedWorkshop, solveQuestions);

module.exports = router;