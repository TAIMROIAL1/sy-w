const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const errorController = require('./controllers/errorController');
const cors = require('cors');
const viewRouter = require('./routes/viewRoutes')
const cookieParser = require('cookie-parser');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xssProtecter = require('xss-clean');
const noSQLSanitizer = require('express-mongo-sanitize');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))

dotenv.config({path: './config.env'});

//SEC Middleware
const limiter = rateLimit({
  max: 6,
  windowMs: 5 * 1000,
  message: 'تم حظر جهازك مؤقتا من استخدام الموقع'
});

app.use(helmet());

app.use('/api', limiter);

app.use(express.json({ limit: '100kb' }));

// Data sanitization againt NoSQL query injection, XSS
app.use(noSQLSanitizer());
app.use(xssProtecter());

app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors());


app.get('/css/:file', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'css', req.params.file));
})
app.get('/js/:file', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'js', req.params.file))
})

app.get('/imgs/:file', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'imgs', req.params.file))
})

app.get('/imgs/classes/:file', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'imgs', 'classes', req.params.file))
})

app.get('/imgs/courses/:file', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'imgs', 'courses', req.params.file))
})

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