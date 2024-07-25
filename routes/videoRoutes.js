const express = require('express');

const { checkJWT, restrictTo } = require('./../controllers/authController');
const { addVideo, editVideo, deleteVideo } = require('./../controllers/lessonController');

const router = express.Router({mergeParams: true});

router.post('/', checkJWT, restrictTo('admin'), addVideo);

router.post('/:videoId/edit-video', checkJWT, restrictTo('admin'), editVideo);

router.delete('/:videoId', checkJWT, restrictTo('admin'), deleteVideo);

module.exports = router;