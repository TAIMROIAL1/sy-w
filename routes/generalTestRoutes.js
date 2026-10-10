const express = require('express');

const router = express.Router();
const { checkJWT, restrictTo } = require('./../controllers/authController');
const {
  getLiveTests, createTest, updateTest, deleteTest, startTest, saveAnswers, submitTest
} = require('./../controllers/generalTestController');

router.use(checkJWT);

// live tests the user has not finished yet (notification banner)
router.get('/live', getLiveTests);

router.post('/', restrictTo('admin'), createTest);
router.route('/:testId')
  .patch(restrictTo('admin'), updateTest)
  .delete(restrictTo('admin'), deleteTest);

router.post('/:testId/start', startTest);
// body: { answers: { questionIndex: choiceIndex } }
router.patch('/:testId/attempt', saveAnswers);
router.post('/:testId/submit', submitTest);

module.exports = router;
