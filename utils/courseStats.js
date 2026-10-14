const mongoose = require('mongoose');
const Lesson = require('./../models/lessonModel');

// total resources (videos + quizzes) per subcourse, in one query
exports.resourceCounts = async ids => {
  const rows = await Lesson.aggregate([
    { $match: { subcourse: { $in: ids.map(id => new mongoose.Types.ObjectId(String(id))) } } },
    { $group: { _id: '$subcourse', total: { $sum: { $size: { $ifNull: ['$videos', []] } } } } }
  ]);
  return Object.fromEntries(rows.map(r => [r._id.toString(), r.total]));
};

exports.progressOf = (user, subcourseId, total) => {
  const p = user?.courseProgress?.find(c => c.courseId?.toString() === subcourseId.toString());
  const done = Math.min(p?.achievedVideos?.achievedVideosCount || 0, total);
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
    started: done > 0 || !!p?.lastLesson
  };
};
