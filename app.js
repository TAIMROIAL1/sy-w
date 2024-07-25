const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const errorController = require('./controllers/errorController');
const cors = require('cors');
const viewRouter = require('./routes/viewRoutes')
const cookieParser = require('cookie-parser');

//TODO Hash codes
//TODO Activate subcourse
//TODO update 
//TODO unique fields
//TODO check for invalid data : In both rendering and api
//TODO Handle casting errors
//TODO security
//TODO rendering

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))

dotenv.config({path: './config.env'});

//SEC Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')))

// app.use((req, res, next) => {
//   console.log(req.cookies);
//   next();
// })

const userRouter = require('./routes/userRoutes');
const classRouter = require('./routes/classesRoutes');
const courseRouter = require('./routes/coursesRoutes');
const subcourseRouter = require('./routes/subcourseRoutes');
const lessonRouter = require('./routes/lessonRoutes');
const videoRouter = require('./routes/videoRoutes');
const questionRouter = require('./routes/questionRoutes');
const codeRouter = require('./routes/codeRoutes');

app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/classes', classRouter);
app.use('/api/v1/classes/:classId/courses', courseRouter);
app.use('/api/v1/courses/:courseId/subcourses', subcourseRouter);
app.use('/api/v1/subcourses/:subcourseId/lessons', lessonRouter);
app.use('/api/v1/lessons/:lessonId/videos', videoRouter);
app.use('/api/v1/videos/:videoId/questions', questionRouter);
app.use('/api/v1/codes', codeRouter);

app.use(errorController);

app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: 'not found!'
  })
})
module.exports = app;