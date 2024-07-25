const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");
const Course = require("./../models/coursesModel");
const Subcourse = require("./../models/subcourseModel");
const User = require("./../models/userModel");
const Lesson = require("./../models/lessonModel");

exports.deleteCourses = catchAsync(async function (classId) {
  const courses = [...(await Course.find({ class: classId }))];
  courses.forEach(async (course) => {
    exports.deleteSubcourses(course._id);
    await Course.findByIdAndDelete(course._id);
  });
});

exports.deleteSubcourses = catchAsync(async function (courseId) {
  const subcourses = [...(await Subcourse.find({ course: courseId }))];
  subcourses.forEach(async (subcourse) => {
    await User.updateMany({subcourses: subcourse._id}, {$pull: {subcourses: subcourse._id}});
    
    exports.deleteLessons(subcourse._id);
    await Subcourse.findByIdAndDelete(subcourse._id);
  });
});

exports.deleteLessons = catchAsync(async function (subcourseId) {
  await Lesson.deleteMany({ subcourse: subcourseId });
});
