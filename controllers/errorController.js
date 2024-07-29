const handleCastingErrorDB = function(err, res) {
  err.message = `Casting error, value: ${err.stringValue}`;
  return err.path;
}

const handleDuplicateFieldsDB = function(err, res) {
  const path = Object.keys(err.keyValue)[0];
  err.message = `Validation Error: هئا ${path === 'name' ? 'الاسم' : path === 'code'? 'الكود' : 'البريد'} غير صالح`;
  return path;
}

const handleJsonWebTokenError = function(err, res) {  
  err.message = `You are not logged in! please login to reach our website`; 
}

const handleJsonWebTokenExpired = function(err, res) {
  err.message = `You are not logged in! please login to reach our website`;
}
const handleValidationErrorDB = function(err, res) {
  const error = Object.entries(err.errors)[0];
  const message = `Validation Error: ${error[1].message}, value: ${error[1].value}.`;
 err.message = message.trim().slice(0, -1);
 return error[1].path;
}

const handleValidationErrorDB2 = function(err, res) {
  return err.path;
}
const sendErrorDev = function(err, res) {
  res.status(500).json({
    status: 'fail',
    err,
    stack: err.stack
  })
}

// const handlerUnauthorized = function(res) {
//   res.status(400).render('sign');
// }

const sendErrorProd = function(err, res, req) {
  let path;
  if(err.name === 'CastError') path = handleCastingErrorDB(err, res);
    if(err.code === 11000) path = handleDuplicateFieldsDB(err, res);
    if(err.name === 'ValidationError') path = handleValidationErrorDB(err, res);
    if(err.name === 'ValidationError2') path = handleValidationErrorDB2(err, res);
    // if(err.statusCode === 401 && !req.originalUrl.startsWith('/api')) return handlerUnauthorized(res);
    if(err.name === 'JsonWebTokenError') handleJsonWebTokenError(err, res);
    if(err.name ==='TokenExpiredError') handleJsonWebTokenExpired(err, res);
  res.status(400).json({
    status: 'fail',
    message: err.message,
    path: path ?? undefined
  })
}

module.exports = function(err, req, res, next) {
  if(process.env.NODE_ENV === 'development') return sendErrorDev(err, res);
  if(process.env.NODE_ENV === 'production') return sendErrorProd(err, res, req);

}