// Card images are stored in a Bunny Storage zone, MongoDB only keeps the CDN url + the storage path.
// Env (Render → Environment):
//   BUNNY_STORAGE_ZONE      storage zone name                     e.g. studyou-images
//   BUNNY_STORAGE_PASSWORD  storage zone password (FTP & API Access → Password)
//   BUNNY_STORAGE_HOST      region host of the zone               e.g. storage.bunnycdn.com (Falkenstein), uk.storage.bunnycdn.com ...
//   BUNNY_CDN_URL           pull zone connected to the zone       e.g. https://studyou-images.b-cdn.net
const crypto = require('crypto');
const AppError = require('./appError');

const FOLDER = 'ankiPrivateGroupsCardImages';
const PHOTO_FOLDER = 'ankiOfficialGroupPhotos';

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

// photo of an official group, same return value as uploadCardImage
exports.uploadGroupPhoto = (buffer, groupId) => exports.uploadCardImage(buffer, groupId, PHOTO_FOLDER);

// best effort: a failed delete only leaves an unused file, it never fails the request
exports.deleteCardImages = async function(...paths) {
  const toDelete = paths.flat().filter(p => typeof p === 'string' && [FOLDER, PHOTO_FOLDER].some(folder => p.startsWith(`${folder}/`)));
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
