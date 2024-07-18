const express = require('express');
const Class = require('./../models/classesModel');
const { checkJWT } = require('./../controllers/authController')
const router = express.Router();

router.get('/sign-up', checkJWT, (req, res) => {
  if(res.locals.user) {
    return res.status(200).render('mainpage');
  }
  res.status(200).render('sign');
});

router.get('/', checkJWT, async (req, res) => {
  if(!res.locals.user) {
    return res.status(200).render('sign');
  }
  const classes = await Class.find();
  const { user } = res.locals;
  res.status(200).render('mainpage', {
    user,
    classes,
    title: "Studyou"
  });
})

module.exports = router;