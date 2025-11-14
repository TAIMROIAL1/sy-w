const express = require('express');

const router = express.Router();

const { signup, login, checkFingerPrint, checkJWT, restrictTo, updatePassword, updateEmailName, checkActivatedSubcourse, logout, updateCertainPassword } = require('./../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/update-password', checkJWT, updatePassword);
router.post('/update-email-name', checkJWT, updateEmailName);
router.post('/check-activated-subcourse', checkJWT, checkActivatedSubcourse);
router.post('/update-certain-password', updateCertainPassword);
// router.get('/forgot-password', checkFingerPrint, forgotPassword)
// router.patch('/reset-password/:resetToken', resetPassword);

module.exports = router;