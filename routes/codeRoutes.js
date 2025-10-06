const express = require('express');

const router = express.Router();
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getCodes, createCode, activateCode, createCodes } = require('./../controllers/codeController');


router.route('/')
.get(checkJWT, restrictTo('admin'), getCodes)
.post(checkJWT, restrictTo('admin'), createCode);

router.post('/activate-code', checkJWT, activateCode);
router.post('/create-codes', checkJWT, restrictTo('admin'), createCodes);

module.exports = router;