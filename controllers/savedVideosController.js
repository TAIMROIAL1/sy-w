const Subcourse = require("./../models/subcourseModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");

const findSaved = (user, subcourseId, videoNum, lessonNum) =>
  user.savedVideos.find(
    (v) =>
      v.subcourseId == subcourseId &&
      v.videoNum == videoNum &&
      v.lessonNum == lessonNum
  );

exports.isSaved = catchAsync(async function (req, res, next) {
  const { subcourseId } = req.params;

  if (!subcourseId) return next(new AppError("اي دي الكورس غير موجود", 400));

  const subcourse = await Subcourse.findById(subcourseId);

  if (!subcourse) return next(new AppError("هذا الكورس غير موجود", 400));

  const { videoNum, lessonNum } = req.body;

  if ((!videoNum && videoNum != 0) || !lessonNum)
    return next(new AppError("ادخل كامل المعلومات المطلوبة", 400));

  const { user } = req;

  if (!user) return next(new AppError("المستخدم غير موجود", 400));

  const saved = findSaved(user, subcourseId, videoNum, lessonNum);

  return res.status(200).json({
    status: "success",
    data: { saved: !!saved, savedId: saved ? saved._id : null },
  });
});

exports.saveVideo = catchAsync(async function (req, res, next) {
  const { subcourseId } = req.params;

  if (!subcourseId) return next(new AppError("اي دي الكورس غير موجود", 400));

  const subcourse = await Subcourse.findById(subcourseId);

  if (!subcourse) return next(new AppError("هذا الكورس غير موجود", 400));

  const { videoNum, lessonNum, courseTitle, lessonTitle, videoTitle, reason } =
    req.body;

  if ((!videoNum && videoNum != 0) || !lessonNum)
    return next(new AppError("ادخل كامل المعلومات المطلوبة", 400));

  const { user } = req;

  if (!user) return next(new AppError("المستخدم غير موجود", 400));

  if (findSaved(user, subcourseId, videoNum, lessonNum))
    return next(new AppError("هذا الفيديو محفوظ مسبقا", 400));

  user.savedVideos.push({
    subcourseId,
    videoNum,
    lessonNum,
    courseTitle: courseTitle || subcourse.title,
    lessonTitle,
    videoTitle,
    reason: (reason || "").trim(),
  });

  await user.save({ validateBeforeSave: false });

  const saved = user.savedVideos[user.savedVideos.length - 1];

  return res.status(201).json({
    status: "success",
    message: "تم حفظ الفيديو بنجاح",
    data: { savedId: saved._id },
  });
});

exports.unsaveVideo = catchAsync(async function (req, res, next) {
  const { subcourseId } = req.params;

  if (!subcourseId) return next(new AppError("اي دي الكورس غير موجود", 400));

  const subcourse = await Subcourse.findById(subcourseId);

  if (!subcourse) return next(new AppError("هذا الكورس غير موجود", 400));

  const { savedId } = req.body;

  if (!savedId) return next(new AppError("ادخل كامل المعلومات المطلوبة", 400));

  const { user } = req;

  if (!user) return next(new AppError("المستخدم غير موجود", 400));

  const index = user.savedVideos.findIndex((v) => v._id == savedId);

  if (index === -1) return next(new AppError("هذا الفيديو غير محفوظ", 404));

  user.savedVideos.splice(index, 1);

  await user.save({ validateBeforeSave: false });

  return res.status(204).json({
    status: "success",
    message: "تم إزالة الفيديو من المحفوظات",
  });
});

exports.getAllSaved = catchAsync(async function (req, res, next) {
  const { subcourseId } = req.params;

  if (!subcourseId) return next(new AppError("اي دي الكورس غير موجود", 400));

  const subcourse = await Subcourse.findById(subcourseId);

  if (!subcourse) return next(new AppError("هذا الكورس غير موجود", 400));

  const { user } = req;

  if (!user) return next(new AppError("المستخدم غير موجود", 400));

  const savedVideos = user.savedVideos
    .filter((v) => v.subcourseId == subcourseId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.status(200).json({
    status: "success",
    results: savedVideos.length,
    data: savedVideos,
  });
});
