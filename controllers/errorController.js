const AppError = require('./../utils/AppError');

const sendErrorDev = function(err, res) {
  res.status(500).json({
    status: 'fail',
    err,
    stack: err.stack
  })
}

const sendErrorProd = function(err, res) {

}

module.exports = function(err, req, res, next) {
  if(process.env.NODE_ENV === 'development') return sendErrorDev(err, res);
  if(process.env.NODE_ENV === 'production') return sendErrorProd(err, res);

}