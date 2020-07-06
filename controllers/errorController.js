const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  //console.log(err.keyValue);
  const key = Object.keys(err.keyPattern);
  const value = Object.values(err.keyValue);
  const message = `${key} : ${value}, already Exists, Please try another`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const error = Object.values(err.errors).map((el) => el.message);
  //console.log(error);
  const message = `Invalid input Data. ${error.join(', ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token, Please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired, Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  //error handling for api
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //error handling for rendered website
  console.error('error', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // api
  if (req.originalUrl.startsWith('/api')) {
    //operational errors
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //internal errors
    console.error('Error', err);
    res.status(500).json({
      status: 'error',
      message: 'Looks like something went wrong',
    });
  }

  //rendred website
  //operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  //internal errors
  console.error('error', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    //console.log(err.name);
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //console.log(err.name);

    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    //error.statusCode = err.statusCode;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
