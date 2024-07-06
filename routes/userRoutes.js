const express = require('express');

const router = express.Router();

const { signup, login, forgotPassword, resetPassword, checkFingerPrint } = require('./../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/forgot-password', checkFingerPrint, forgotPassword)
router.patch('/reset-password/:resetToken', resetPassword);

module.exports = router;