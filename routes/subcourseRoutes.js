const express = require('express');

const router = express.Router({mergeParams: true});
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getSubcourses, createSubcourse } = require('./../controllers/subcourseController')

router.route('/')
.get(checkJWT, getSubcourses)
.post(checkJWT, restrictTo('admin'), createSubcourse);


module.exports = router;