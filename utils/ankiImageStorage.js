// Card images are stored in a Bunny Storage zone, MongoDB only keeps the CDN url + the storage path.
// Env (Render → Environment):
//   BUNNY_STORAGE_ZONE      storage zone name                     e.g. studyou-images
//   BUNNY_STORAGE_PASSWORD  storage zone password (FTP & API Access → Password)
//   BUNNY_STORAGE_HOST      region host of the zone               e.g. storage.bunnycdn.com (Falkenstein), uk.storage.bunnycdn.com ...
//   BUNNY_CDN_URL           pull zone connected to the zone       e.g. https://studyou-images.b-cdn.net
const crypto = require('crypto');
const AppError = require('./AppError');

const FOLDER = 'ankiPrivateGroupsCardImages';
const PHOTO_FOLDER = 'ankiOfficialGroupPhotos';
const LESSON_FILE_FOLDER = 'lessonFiles';

// read on every call so it works whenever dotenv is loaded
const config = function() {
  const { BUNNY_STORAGE_ZONE: zone, BUNNY_STORAGE_PASSWORD: password, BUNNY_CDN_URL: cdnUrl } = process.env;
  const host = process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';

  if(!zone || !password || !cdnUrl) throw new AppError('رفع الصور غير مفعل حالياً', 500, 'message');

  return {
    storageBase: `${/^https?:\/\//.test(host) ? host : `https://${host}`}/${zone}`.replace(/\/+$/, ''),
    password,
    cdnUrl: cdnUrl.replace(/\/+$/, '')
  };
};

// detect the real type from the first bytes (don't trust the file name / mimetype)
const detectExtension = function(buffer) {
  if(buffer.length < 12) return null;
  if(buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'jpg';
  if(buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'png';
  if(buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if(['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return 'gif';
  return null;
};

const CONTENT_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

exports.detectExtension = detectExtension;

// uploads the image of a card, returns { image: cdn url, imagePath: path inside the zone }
exports.uploadCardImage = async function(buffer, groupId, folder = FOLDER) {
  const ext = detectExtension(buffer);
  if(!ext) throw new AppError('الملف المرفوع ليس صورة صالحة', 400, 'message');

  const { storageBase, password, cdnUrl } = config();
  const imagePath = `${folder}/${groupId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

  let res;
  try {
    res = await fetch(`${storageBase}/${imagePath}`, {
      method: 'PUT',
      headers: { AccessKey: password, 'Content-Type': 'application/octet-stream' },
      body: buffer
    });
  } catch (err) {
    console.error('Bunny upload failed:', err.message);
  }

  if(!res || !res.ok) {
    if(res) console.error('Bunny upload failed:', res.status, await res.text().catch(() => ''));
    throw new AppError('تعذر رفع الصورة، الرجاء المحاولة مجددا', 502, 'message');
  }

  return { image: `${cdnUrl}/${imagePath}`, imagePath, contentType: CONTENT_TYPES[ext] };
};

// lesson attachments (pdf, office, zip, images), detected from the first bytes
const ZIP_EXTS = ['docx', 'pptx', 'xlsx', 'zip'];
const OLE_EXTS = ['doc', 'ppt', 'xls'];
const FILE_CONTENT_TYPES = {
  ...CONTENT_TYPES,
  pdf: 'application/pdf',
  zip: 'application/zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  doc: 'application/msword',
  ppt: 'application/vnd.ms-powerpoint',
  xls: 'application/vnd.ms-excel'
};

const detectFileExtension = function(buffer, originalName = '') {
  const nameExt = (originalName.split('.').pop() || '').toLowerCase();
  if(buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') return 'pdf';
  if(buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04)
    return ZIP_EXTS.includes(nameExt) ? nameExt : 'zip';
  if(buffer.length >= 8 && buffer.slice(0, 8).equals(Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])))
    return OLE_EXTS.includes(nameExt) ? nameExt : null;
  return detectExtension(buffer);
};

// returns { fileUrl, filePath }
exports.uploadLessonFile = async function(buffer, originalName, lessonId) {
  const ext = detectFileExtension(buffer, originalName);
  if(!ext) throw new AppError('نوع الملف غير مدعوم (PDF أو Word أو PowerPoint أو Excel أو ZIP أو صورة)', 400, 'message');

  const { storageBase, password, cdnUrl } = config();
  const filePath = `${LESSON_FILE_FOLDER}/${lessonId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

  let res;
  try {
    res = await fetch(`${storageBase}/${filePath}`, {
      method: 'PUT',
      headers: { AccessKey: password, 'Content-Type': FILE_CONTENT_TYPES[ext] || 'application/octet-stream' },
      body: buffer
    });
  } catch (err) {
    console.error('Bunny upload failed:', err.message);
  }

  if(!res || !res.ok) {
    if(res) console.error('Bunny upload failed:', res.status, await res.text().catch(() => ''));
    throw new AppError('تعذر رفع الملف، الرجاء المحاولة مجددا', 502, 'message');
  }

  return { fileUrl: `${cdnUrl}/${filePath}`, filePath };
};

// photo of an official group, same return value as uploadCardImage
exports.uploadGroupPhoto = (buffer, groupId) => exports.uploadCardImage(buffer, groupId, PHOTO_FOLDER);

// best effort: a failed delete only leaves an unused file, it never fails the request
exports.deleteCardImages = async function(...paths) {
  const toDelete = paths.flat().filter(p => typeof p === 'string' && [FOLDER, PHOTO_FOLDER, LESSON_FILE_FOLDER].some(folder => p.startsWith(`${folder}/`)));
  if(!toDelete.length) return;

  let cfg;
  try { cfg = config(); } catch (err) { return; }

  await Promise.all(toDelete.map(async imagePath => {
    try {
      const res = await fetch(`${cfg.storageBase}/${imagePath}`, { method: 'DELETE', headers: { AccessKey: cfg.password } });
      if(!res.ok && res.status !== 404) console.error('Bunny delete failed:', imagePath, res.status);
    } catch (err) {
      console.error('Bunny delete failed:', imagePath, err.message);
    }
  }));
};
