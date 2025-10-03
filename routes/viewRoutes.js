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

router.get("/sign-up", checkJWT, async (req, res) => {
  if (res.locals.user || req.user) {
    return res.status(200).render("toMain");
  }
  res.status(200).render("sign", {
    metaContent: 'تسجيل الدخول الى المنصة للإشتراك في الكورسات'
  });
});

router.get("/", checkJWT, catchAsync(async (req, res) => {
  let user = undefined;
    if (res.locals.user) {
        user  = res.locals.user;
    }

    const classes = await Class.find();
    

    res.status(200).render("mainpage", {
      user,
      classes,
      title: "الصفحة الرئيسية",
      metaContent: `الدكتور إياد سكر | الدكتور غيث سكر
كورسات للصف الثالث ثانوي`
    });
  })
);

router.get("/classes/:classId/courses", checkJWT, catchAsync(async (req, res) => {
  let user = undefined;
  if (res.locals.user) {
      user  = res.locals.user;
  }

    const { classId } = req.params;
    const className = await Class.findById(classId);
    if(!className) return res.status(400).json({
      status: 'fail',
      message: 'هذا الصف غير موجود'
    });

    const courses = await Course.find({ class: classId });
    const subcourses = [];

      for(const c of courses) {
        const foundSubcourses = await Subcourse.find({course: c._id});
        const ids = foundSubcourses.map(fsc => fsc._id.toString());
        subcourses.push(ids);
      }
    res.status(200).render("courses", {
      user,
      courses,
      subcourses,
      title: className.title,
      metaContent: `جميع كورسات ${className.title}`
    });
  })
);

router.get("/courses/:courseId/subcourses", checkJWT, catchAsync(async (req, res) => {
  let user = undefined;
  if (res.locals.user) {
      user  = res.locals.user;
  }

    const { courseId } = req.params;
    const courseName = await Course.findById(courseId);
    if(!courseName) return res.status(400).json({
      status: 'fail',
      message: 'هذا الصف غير موجود'
    });

    const subcourses = await Subourse.find({ course: courseId });
    
    const subcoursesId = subcourses.map(sc => sc._id.toString());

    res.status(200).render("subcourses", {
      user,
      subcourses,
      subcoursesId,
      title: courseName.title,
      metaContent: `الشرح لكامل لمنهاج الكتاب
شرح جميع الرسمات
تحديد كامل على الكتاب
أتمتة جميع الدروس`
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
      title: "الدروس",
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
      title: 'إعدادت الحساب',
      metaContent: `تغيير الاسم و البريد و كلمة السر
جميع كورساتي المفعلة
تفعيل أكواد لتفعيل الكورسات`
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


/**







 */