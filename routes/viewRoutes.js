const express = require('express');

const router = express.Router();

router.get('/sign-up', (req, res) => {
  const courses = '';
  res.status(200).render('sign', {
courses
  })
});

module.exports = router;