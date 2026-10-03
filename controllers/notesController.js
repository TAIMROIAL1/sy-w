const Subcourse = require("./../models/subcourseModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");
const { default: mongoose } = require("mongoose");

exports.addNote = catchAsync(async function (req, res, next) {
  const { subcourseId } = req.params;

  if (!subcourseId) return next(new AppError("اي دي الكورس غير موجود", 400));

  const subcourse = await Subcourse.findById(subcourseId);

  if (!subcourse) return next(new AppError("هذا الكورس غير موجود", 400));

  const { noteText, videoNum, lessonNum, courseTitle, lessonTitle, videoTitle } =
    req.body;

  if (!noteText || (!videoNum && videoNum != 0) || !lessonNum)
    return next(new AppError("ادخل كامل المعلومات المطلوبة", 400));

  const { user } = req;

  if (!user) return next(new AppError("المستخدم غير موجود", 400));

  const userNote = {
    subcourseId,
    videoNum,
    lessonNum,
    noteText,
    courseTitle: courseTitle || subcourse.title,
    lessonTitle,
    videoTitle,
  };

  user.notes.push(userNote);

  await user.save({ validateBeforeSave: false });

  return res.status(201).json({
    status: "success",
    message: "تم اضافة الملاحظة بنجاح",
  });
});

exports.deleteNote = catchAsync(async function (req, res, next) {
  const { subcourseId } = req.params;

  if (!subcourseId) return next(new AppError("اي دي الكورس غير موجود", 400));

  const subcourse = await Subcourse.findById(subcourseId);

  if (!subcourse) return next(new AppError("هذا الكورس غير موجود", 400));

  const { noteId } = req.body;

  if (!noteId) return next(new AppError("ادخل كامل المعلومات المطلوبة", 400));

  const { user } = req;

  if (!user) return next(new AppError("المستخدم غير موجود", 400));

  const noteIndex = user.notes.findIndex((note) => note._id == noteId);

  if (noteIndex === -1)
    return next(new AppError("هذه الملاحظة غير موجودة", 404));

  user.notes.splice(noteIndex, 1);

  await user.save({ validateBeforeSave: false });

  return res.status(204).json({
    status: "success",
    message: "تم حذف الملاحظة بنجاح",
  });
});

exports.getNotes = catchAsync(async function (req, res, next) {
  const { subcourseId } = req.params;

  if (!subcourseId) return next(new AppError("اي دي الكورس غير موجود", 400));

  const subcourse = await Subcourse.findById(subcourseId);

  if (!subcourse) return next(new AppError("هذا الكورس غير موجود", 400));

  const { videoNum, lessonNum } = req.body;

  if ((!videoNum && videoNum != 0) || !lessonNum)
    return next(new AppError("ادخل كامل المعلومات المطلوبة", 400));

  const { user } = req;

  if (!user) return next(new AppError("المستخدم غير موجود", 400));
  let notes;
  notes = user.notes.filter(
    (note) =>
      note.subcourseId == subcourseId &&
      note.videoNum == videoNum &&
      note.lessonNum == lessonNum
  );

  if (!Array.isArray(notes) || notes.length < 1) {
    notes = [];
  }

  return res.status(200).json({
    status: "success",
    data: notes,
  });
});

exports.getAllNotes = catchAsync(async function (req, res, next) {
  const { subcourseId } = req.params;

  if (!subcourseId) return next(new AppError("اي دي الكورس غير موجود", 400));

  const subcourse = await Subcourse.findById(subcourseId);

  if (!subcourse) return next(new AppError("هذا الكورس غير موجود", 400));

  const { user } = req;

  if (!user) return next(new AppError("المستخدم غير موجود", 400));

  const notes = user.notes
    .filter((note) => note.subcourseId == subcourseId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.status(200).json({
    status: "success",
    results: notes.length,
    data: notes,
  });
});
