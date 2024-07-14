const express = require('express');

const { createClass, getClasses } = require('./../controllers/classesController');
const { checkJWT, restrictTo } = require('./../controllers/authController');
const coursesRouter = require('./coursesRoutes');

const router = express.Router();

router.route('/')
.get(checkJWT, getClasses)
.post(checkJWT, restrictTo('admin'), createClass);

router.use('/:classId/courses', coursesRouter);

module.exports = router;