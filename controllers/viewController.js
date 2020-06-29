const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getHome = catchAsync(async (req, res, next) => {
  res.status(200).render('index');
});

exports.getLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('login');
});

exports.getRegister = catchAsync(async (req, res, next) => {
  res.status(200).render('register');
});

exports.getFAQ = catchAsync(async (req, res, next) => {
  res.status(200).render('faq');
});

exports.getUserDashboard = catchAsync(async (req, res, next) => {
  res.status(200).render('userDashboard');
});

exports.getAdminLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('admin/adminLogin');
});

exports.getAdminDashboard = catchAsync(async (req, res, next) => {
  res.status(200).render('admin/adminDashboard');
});
