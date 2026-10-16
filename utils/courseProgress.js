// files are reachable resources but never count as progress
const isFile = res => res?.fileType === 'file';
exports.isFile = isFile;
exports.countedResources = videos => (videos || []).filter(v => !isFile(v)).length;

// Number of completed resources in a lesson (the resource at this index is the next unlocked one).
// Old progress only stored one course-wide position: lessons before it count as complete.
// Files never block: once reached, the pointer moves past them.
exports.lessonPointer = function(progress, lessonNum, videos) {
  const list = Array.isArray(videos) ? videos : [];
  const length = Array.isArray(videos) ? videos.length : Number(videos) || 0;
  const legacy = progress?.achievedVideos || {};
  const legacyLesson = legacy.lessonNum ?? 1;
  const legacyRes = legacy.videoNumber ?? 0;

  let pointer = lessonNum < legacyLesson ? length : lessonNum == legacyLesson ? legacyRes : 0;

  const saved = progress?.lessons?.find(l => l.lessonNum == lessonNum);
  if(saved) pointer = Math.max(pointer, saved.videoNumber);

  pointer = Math.min(pointer, length);
  while(pointer < length && isFile(list[pointer])) pointer++;
  return pointer;
};
