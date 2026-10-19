const express = require('express');
const { checkJWT, restrictTo } = require('./../controllers/authController');
const bot = require('./../controllers/botController');

const router = express.Router();

router.use(checkJWT, restrictTo('admin'));

router.get('/overview', bot.getOverview);

router.route('/buttons').get(bot.getButtons).post(bot.createButton);
router.post('/buttons/reorder', bot.reorderButtons);
router.route('/buttons/:id').patch(bot.updateButton).delete(bot.deleteButton);
router.post('/buttons/:id/move', bot.moveButton);

router.post('/upload', bot.uploadMiddleware, bot.uploadFile);

router.route('/settings').get(bot.getSettings).patch(bot.updateSettings);

router.get('/subscribers', bot.getSubscribers);
router.get('/stats/monthly', bot.getMonthlyStats);

router.get('/questions', bot.getQuestions);
router.post('/questions/:id/answer', bot.answerQuestion);
router.delete('/questions/:id', bot.deleteQuestion);

router.route('/posts').get(bot.getPosts).post(bot.createPost);
router.post('/posts/preview', bot.previewPost);

module.exports = router;
