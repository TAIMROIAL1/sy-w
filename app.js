const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const errorController = require('./controllers/errorController');
const cors = require('cors');

//TODO Hash codes
//TODO Activate subcourse
//TODO update 
//TODO unique fields
//TODO check for invalid data
//TODO Handle casting errors
//TODO security
//TODO rendering



const app = express();

dotenv.config({path: './config.env'});

//SEC Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

const userRouter = require('./routes/userRoutes');
const classRouter = require('./routes/classesRoutes');
const codeRouter = require('./routes/codeRoutes');

app.use('/api/v1/users', userRouter);
app.use('/api/v1/classes', classRouter);
app.use('/api/v1/codes', codeRouter);

app.use(errorController);

app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: 'not found!'
  })
})
module.exports = app;