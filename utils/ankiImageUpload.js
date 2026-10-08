// multer middleware for card requests: accepts JSON or multipart (field "data" = card JSON, field "image" = file)
const multer = require('multer');
const AppError = require('./AppError');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(), // kept in memory then sent to Bunny, nothing is written on the server
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 5 },
  fileFilter(req, file, cb) {
    if(!IMAGE_TYPES.includes(file.mimetype)) return cb(new AppError('الرجاء رفع صورة PNG أو JPG أو WEBP أو GIF', 400, 'message'));
    cb(null, true);
  }
}).single('image');

module.exports = function(req, res, next) {
  if(!req.is('multipart/form-data')) return next();

  upload(req, res, err => {
    if(err instanceof multer.MulterError)
      return next(new AppError(err.code === 'LIMIT_FILE_SIZE' ? 'حجم الصورة يجب ألا يتجاوز 5MB' : 'طلب رفع غير صحيح', 400, 'message'));
    if(err) return next(err);

    if(typeof req.body.data === 'string') {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (parseErr) {
        return next(new AppError('بيانات البطاقة غير صحيحة', 400, 'message'));
      }
    }
    if(!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) req.body = {};
    next();
  });
};
