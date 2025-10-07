const express = require('express');

const router = express.Router();
const { checkJWT, restrictTo } = require('./../controllers/authController');
const { getCodes, createCode, activateCode, createCodes, deleteCode } = require('./../controllers/codeController');


router.route('/')
.get(checkJWT, restrictTo('admin'), getCodes)
.post(checkJWT, restrictTo('admin'), createCode);

router.post('/activate-code', checkJWT, activateCode);
router.post('/create-codes', checkJWT, restrictTo('admin'), createCodes);

router.delete('/:code', checkJWT, restrictTo('admin'), deleteCode);

module.exports = router;