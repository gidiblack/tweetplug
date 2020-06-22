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

  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Incorrect username or password', 401));
  }
  if (user.active === false) {
    return next(new AppError('User cannot login'));
  }
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});
