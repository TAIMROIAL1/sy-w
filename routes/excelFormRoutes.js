const express = require('express');

const {checkJWT} = require('./../controllers/authController');

const {addForm} = require('./../controllers/excelFormController');
const router = express.Router({mergeParams: true});

router.post('/', checkJWT, addForm);

module.exports = router;