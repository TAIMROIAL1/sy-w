const express = require("express");
const User = require('./../models/userModel');
const Class = require("./../models/classesModel");
const Course = require("./../models/coursesModel");
const Subcourse = require("./../models/subcourseModel");
const Lesson = require("./../models/lessonModel");
const Question = require('./../models/questionModel')
const Subourse = require("./../models/subcourseModel");
const catchAsync = require("./../utils/catchAsync");
const { checkJWT, restrictTo, checkActivatedSubcourse } = require("./../controllers/authController");
const router = express.Router();

router.get("/sign-up", checkJWT, (req, res) => {
  if (res.locals.user) {
    console.log('FK')
    return res.status(200).render("mainpage");
  }
  res.status(200).render("sign");
});

router.get("/", checkJWT, catchAsync(async (req, res) => {
    if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
    const classes = await Class.find();
    console.log(classes);

    const { user } = res.locals;
    res.status(200).render("mainpage", {
      user,
      classes,
      title: "Studyou",
    });
  })
);

router.get("/classes/:classId/courses", checkJWT, catchAsync(async (req, res) => {
    if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
    const { classId } = req.params;
    const courses = await Course.find({ class: classId });
    const subcourses = [];

      for(const c of courses) {
        const foundSubcourses = await Subcourse.find({course: c._id});
        const ids = foundSubcourses.map(fsc => fsc._id.toString());
        subcourses.push(ids);
      }
      const { user } = res.locals;
      
      console.log('Subcourses: ', subcourses);
      console.log(user.subcourses.some(sc => subcourses.includes(sc.toString())));

    res.status(200).render("courses", {
      user,
      courses,
      subcourses,
      title: "Studyou | courses",
    });
  })
);

router.get("/courses/:courseId/subcourses", checkJWT, catchAsync(async (req, res) => {
    if (!res.locals.user) {
      return res.status(200).render("toSign");
    }

    const { courseId } = req.params;

    const subcourses = await Subourse.find({ course: courseId });
    
    const subcoursesId = subcourses.map(sc => sc._id.toString());

    const { user } = res.locals;
    res.status(200).render("subcourses", {
      user,
      subcourses,
      subcoursesId,
      title: "Studyou | subcourses",
    });
  })
);

router.get("/subcourses/:subcourseId/lessons", checkJWT, checkActivatedSubcourse, catchAsync(async (req, res) => {
    if (!res.locals.user) {
      return res.status(200).render("toSign");
    }

    const { subcourseId } = req.params;

    const lessons = await Lesson.find({ subcourse: subcourseId });

    const { user } = res.locals;
    
    res.status(200).render("rayan", {
      user,
      lessons,
      title: "Studyou | lessons",
    });
  })
);

router.get("/settings", checkJWT, catchAsync(async (req, res) => {
    if (!res.locals.user) {
      return res.status(200).render("toSign");
    }
    const { user } = res.locals;
    const newUser = await User.findById(user._id).populate('subcourses').select('+role');
    res.status(200).render("settings", {
      user: newUser,
    });
  })
);

router.get("/upload-class", checkJWT, restrictTo("admin"),
  catchAsync(async (req, res) => {
    const { user } = res.locals;
    res.status(200).render("uploadClass", {
      user,
    });
  })
);

router.get("/classes/:classId/upload-course", checkJWT, restrictTo("admin"), catchAsync(async (req, res) => {
    const { user } = res.locals;
    res.status(200).render("uploadCourse", {
      user,
    });
  })
);

router.get("/edit-class/:classId", checkJWT, restrictTo("admin"), catchAsync(async (req, res) => {
    const { classId } = req.params;
    const classToEdit = await Class.findById(classId);
    res.status(200).render("editClass", {
      cToEdit: classToEdit,
    });
  })
);

router.get("/classes/:classId/edit-course/:courseId", checkJWT, restrictTo("admin"), catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const courseToEdit = await Course.findById(courseId);
    res.status(200).render("editCourse", {
      cToEdit: courseToEdit,
    });
  })
);

router.get("/courses/:courseId/edit-subcourse/:subcourseId", checkJWT, restrictTo("admin"), catchAsync(async (req, res) => {
    const { subcourseId } = req.params;
    const subcourseToEdit = await Subcourse.findById(subcourseId);
    res.status(200).render("editSubcourse", {
      cToEdit: subcourseToEdit,
    });
  })
);

router.get('/subcourses/:subcourseId/upload-lesson', checkJWT, restrictTo('admin'), catchAsync(async (req, res) => {
  res.status(200).render('uploadLesson');
}))

router.get('/subcourses/:subcourseId/edit-lesson/:lessonId', checkJWT, restrictTo('admin'), catchAsync(async(req, res) => {
  const { lessonId } = req.params;
  const lesson = await Lesson.findById(lessonId);

  res.status(200).render('editLesson', {
    lesson
  })
}))

router.get('/lessons/:lessonId/upload-video', checkJWT, restrictTo('admin'), catchAsync(async (req, res) => {
  res.status(200).render('uploadVideo');
}))

router.get('/lessons/:lessonId/edit-video/:videoId', checkJWT, restrictTo('admin'), catchAsync(async(req, res) => {
  const { lessonId, videoId } = req.params;

  const lesson = await Lesson.findById(lessonId);

  const video = lesson.videos.find(vid => vid._id == videoId);

  res.status(200).render('editVideo', {
    video
  })
}))

router.get('/videos/:videoId/upload-question', checkJWT, restrictTo('admin'), catchAsync(async(req, res) => {
  res.status(200).render('uploadQuestion');
}))

router.get('/videos/:videoId/edit-question/:questionId', checkJWT, restrictTo('admin'), catchAsync(async(req, res) => {
  const { questionId } = req.params;

  const question = await Question.findById(questionId);

  res.status(200).render('editQuestion', {
    question
  })
}))
module.exports = router;
