const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/);
  const message = `Duplicate field value:${value}. Please use another value `;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const error = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input Data. ${error.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token, Please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired, Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  //for API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //for rendered site
  //console.log(err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
    statusCode: err.statusCode,
  });
};

const sendErrorProd = (err, req, res) => {
  //for API
  if (req.originalUrl.startsWith('/api')) {
    //operational errors
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,

        message: err.message,
      });
    }
    //internal errors
    console.log(err);
    return res.status(500).json({
      status: 'error',
      message: `Looks like Something went wrong, Please don't hate us  `,
    });
  }
  // for rendered website
  if (err.isOperational) {
    //operational errors
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
      statusCode: err.statusCode,
    });
  }
  console.log(err);
  //Internal error
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Welp! Looks like Mofe messed up again. Please try again later',
    statusCode: err.statusCode,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
