const express = require('express');
const { checkJWT } = require('./../controllers/authController')
const router = express.Router();

router.get('/sign-up', checkJWT, (req, res) => {
  if(res.locals.user) {
    return res.status(200).render('mainpage');
  }
  res.status(200).render('sign');
});

router.get('/', checkJWT, (req, res) => {
  res.status(200).render('mainpage');
})

module.exports = router;