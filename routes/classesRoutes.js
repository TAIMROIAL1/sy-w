const express = require('express');

const { createClass, getClasses, editClass, deleteClass } = require('./../controllers/classesController');
const { checkJWT, restrictTo } = require('./../controllers/authController');

const router = express.Router();

router.route('/')
.get(checkJWT, getClasses)
.post(checkJWT, restrictTo('admin'), createClass);

router.post('/:classId/edit-class', checkJWT, restrictTo('admin'), editClass)
router.delete('/:classId', checkJWT, restrictTo('admin'), deleteClass);

module.exports = router;