const nodemailer = require('nodemailer');
const catchAsync = require('./catchAsync');

module.exports = async function(email, message, subject){
  try {
    
  const tOpts = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  const trasporter = nodemailer.createTransport(tOpts);
  const options = {
    from: process.env.EMAIL_MY_EMAIL,
    to: email,
    subject: subject,
    text: message,
  };

  await trasporter.sendMail(options);
  } catch(err) {
    throw err;
  }
};