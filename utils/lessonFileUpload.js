// multer middleware for lesson resources: JSON (video/quiz) or multipart (file resource, field "file")
const multer = require('multer');
const AppError = require('./AppError');

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(), // kept in memory then sent to Bunny, nothing is written on the server
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 5 }
}).single('file');

module.exports = function(req, res, next) {
  if(!req.is('multipart/form-data')) return next();

  upload(req, res, err => {
    if(err instanceof multer.MulterError)
      return next(new AppError(err.code === 'LIMIT_FILE_SIZE' ? 'حجم الملف يجب ألا يتجاوز 25MB' : 'طلب رفع غير صحيح', 400, 'message'));
    if(err) return next(err);
    if(!req.body || typeof req.body !== 'object') req.body = {};
    next();
  });
};
