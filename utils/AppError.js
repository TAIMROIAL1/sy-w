class AppError extends Error {
  constructor(message, statusCode, path = undefined) {

    super(message);
    this.statusCode = statusCode;
    this.status = (this.statusCode + '').startsWith('5') ? 'error' : 'fail';
    this.isOperational = true;
    this.statck = Error.captureStackTrace(this, this.constructor);
    if(path){ 
      this.path = path;
      this.name = 'ValidationError2';
    }
  }
}

module.exports = AppError;