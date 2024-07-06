class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = (this.statusCode + '').startsWith('5') ? 'error' : 'fail';
    this.isOperational = true;
    this.statck = Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;