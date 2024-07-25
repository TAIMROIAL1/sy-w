const express = require('express');

const router = express.Router({mergeParams: true});
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getQuestions, addQuestions, editQuestion, deleteQuestion, solveQuestions } = require('./../controllers/lessonController');

router.get('/', checkJWT, getQuestions);
router.post('/', checkJWT, restrictTo('admin'), addQuestions);
router.post('/:questionId/edit-question', checkJWT, restrictTo('admin'), editQuestion);
router.delete('/:questionId', checkJWT, restrictTo('admin'), deleteQuestion);
router.post('/solve-questions', checkJWT, solveQuestions);

module.exports = router;