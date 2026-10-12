// Number of completed resources in a lesson (the resource at this index is the next unlocked one).
// Old progress only stored one course-wide position: lessons before it count as complete.
exports.lessonPointer = function(progress, lessonNum, length) {
  const legacy = progress?.achievedVideos || {};
  const legacyLesson = legacy.lessonNum ?? 1;
  const legacyRes = legacy.videoNumber ?? 0;

  let pointer = lessonNum < legacyLesson ? length : lessonNum == legacyLesson ? legacyRes : 0;

  const saved = progress?.lessons?.find(l => l.lessonNum == lessonNum);
  if(saved) pointer = Math.max(pointer, saved.videoNumber);

  return Math.min(pointer, length);
};
