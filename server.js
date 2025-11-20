process.on('uncaughtException', (err) => {
  console.log('ERROR: ', err);
  process.exit(1);
})

const app = require('./app.js');
const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');

mongoose.connect(process.env.DATABASE_CONNECT_LINK, {}).then(() => {
  console.log('DB connected successfully');
})

// const options = {
//   key: fs.readFileSync('server.key'),
//   cert: fs.readFileSync('server.cert')
// };

// https.createServer(options, app).listen(3000, '0.0.0.0',() => {
//   console.log('HTTPS server running at https://localhost:4430');
// });


const server = app.listen(process.env.SERVER_PORT,() => {
  console.log('Started Server');
  console.log("Port: ",process.env.SERVER_PORT)
})

process.on('unhandledRejection', (err) => {
  console.log(err.message);
  server.close(() => {
    process.exit(1);
  });
})

