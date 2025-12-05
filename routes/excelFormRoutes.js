const express = require('express');

const {checkJWT, restrictTo} = require('./../controllers/authController');

const {addForm, getUsers} = require('./../controllers/excelFormController');
const router = express.Router({mergeParams: true});

router.post('/get-users', checkJWT, restrictTo('admin'), getUsers);

router.post('/', checkJWT, addForm);

module.exports = router;