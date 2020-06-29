const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Task = require('../models/taskModel');
const moment = require('moment');

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

const DateToNumber = (dateString, newArr) => {
  const stringArr = dateString.split(':');
  stringArr.forEach((element) => {
    const conEl = parseInt(element);
    newArr.push(conEl);
  });
};
exports.getAdminDashboard = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ active: true });
  const timeCreated = moment(tasks[0].date).format('H:mm:ss');
  const currentTime = moment(Date.now()).format('H:mm:ss');
  //typet = typeof timeCreated;
  //console.log(typet);
  const timeCreatedArr = [];
  const currentTimeArr = [];
  DateToNumber(timeCreated, timeCreatedArr);
  DateToNumber(currentTime, currentTimeArr);
  //console.log(timeCreatedArr);
  //console.log(currentTimeArr);

  const diff = currentTimeArr[0] - timeCreatedArr[0];
  //console.log(diff);

  res.status(200).render('admin/adminDashboard', {
    tasks,
    moment,
  });
});

exports.setTask = catchAsync(async (req, res, next) => {
  const newTask = await Task.create({
    tweet1: req.body.tweet1,
    tweet2: req.body.tweet2,
    tweet3: req.body.tweet3,
  });
  res.redirect('/admin/dashboard');
});
