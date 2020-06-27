const User = require('../models/userModel');
const { promisify } = require('util');
const JWT = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const signToken = (id) => {
  return JWT.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    gender: req.body.gender,
    twitterhandle: req.body.twitterhandle,
    bankAccountNumber: req.body.bankAccountNumber,
    bankAccountName: req.body.bankAccountName,
    bank: req.body.bank,
    mobileNumber: req.body.mobileNumber,
    photo: req.body.photo,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const token = signToken(newUser._id);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Please provide your email or password', 400));
  }
  const user = await User.findOne({ username }).select('+password');
  //console.log(user.active);
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Incorrect username or password', 401));
  }
  if (user.active == false) {
    return next(new AppError('User cannot login. Please contact Admin', 401));
  }
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.authenticate = catchAsync(async (req, res, next) => {
  //get token from req
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in, please log in to get access', 401)
    );
  }
  //validate token
  const decoded = await promisify(JWT.verify)(token, process.env.JWT_SECRET);
  //check if user still exits
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError('The user associated with this token no longer exist', 401)
    );
  }
  //check if user has changed password after token was issued using the passwordChangeTimeStamp instance method (userModel)
  if (user.passwordChangeTimeStamp(decoded.iat)) {
    return next(
      new AppError('User recently changed password please log in again', 401)
    );
  }
  //access granted to user
  //store user details in the request
  req.user = user;
  next();
});

//restiction function accepts an array of roles can only be used after the authenticate function
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //if roles array does not includes the specified  role of the user currently on the request throw an error
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have authorization to perform this action',
          403
        )
      );
    }
    //if user roles is included allow access
    next();
  };
};
