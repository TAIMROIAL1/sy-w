process.on('uncaughtException', (err) => {
  console.log('ERROR: ', err);
  process.exit(1);
})

const app = require('./app.js');
const mongoose = require('mongoose');


mongoose.connect(process.env.DATABASE_CONNECT_LINK, {}).then(() => {
  console.log('DB connected successfully');
})

const server = app.listen(process.env.SERVER_PORT, () => {
  console.log('Started Server');
  console.log("Port: ",process.env.SERVER_PORT)
})

process.on('unhandledRejection', (err) => {
  console.log(err.message);
  server.close(() => {
    process.exit(1);
  });
})

