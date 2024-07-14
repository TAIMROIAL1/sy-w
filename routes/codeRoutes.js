const express = require('express');

const router = express.Router();
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getCodes, createCode, activateCode } = require('./../controllers/codeController');


router.route('/')
.get(checkJWT, restrictTo('admin'), getCodes)
.post(checkJWT, restrictTo('admin'), createCode);

router.post('/activate-code', checkJWT, activateCode);

module.exports = router;