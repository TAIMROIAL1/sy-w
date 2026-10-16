const express = require('express');

const { checkJWT, restrictTo, checkActivatedSubcourse } = require('./../controllers/authController');
const { addVideo, editVideo, deleteVideo } = require('./../controllers/lessonController');

const lessonFileUpload = require('./../utils/lessonFileUpload');

const router = express.Router({mergeParams: true});

router.post('/:lessonNum', checkJWT, restrictTo('admin'), lessonFileUpload, addVideo);

router.post('/:videoId/edit-video', checkJWT, restrictTo('admin'), editVideo);

router.delete('/:videoId', checkJWT, restrictTo('admin'), deleteVideo);

module.exports = router;