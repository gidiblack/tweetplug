const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Task = require('../models/taskModel');
const Withdrawal = require('../models/withdrawalModel');
const Link = require('../models/LinkModel');
const User = require('../models/userModel');

const moment = require('moment');
const { check } = require('prettier');

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

//const DateToNumber = (dateString, newArr) => {
//  const stringArr = dateString.split(':');
//  stringArr.forEach((element) => {
//    const conEl = parseInt(element);
//    newArr.push(conEl);
//  });
//};

//get the admin dashboard
exports.getAdminDashboard = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ active: true });
  const withdrawals = await Withdrawal.find({ status: 'unconfirmed' });
  const links = await Link.find({ status: 'unconfirmed' });
  const users = await User.find().populate({
    path: 'links',
    select: '-_id -user ',
  });
  res.status(200).render('admin/adminDashboard', {
    tasks,
    withdrawals,
    links,
    moment,
    users,
  });
});

//function to set a new task by admin
exports.setTask = catchAsync(async (req, res, next) => {
  const newTask = await Task.create({
    tweet1: req.body.tweet1,
    tweet2: req.body.tweet2,
    tweet3: req.body.tweet3,
  });
  res.redirect('/admin/dashboard');
});

// function to get the detail page for a user by admin
exports.getIndividualPageAdmin = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId)
    .populate({
      path: 'links',
      select: '-_id -user ',
    })
    .populate({
      path: 'withdrawals',
      select: '-__v -user',
    });
  if (!user) {
    return next(
      new AppError('No user found with that Id, please try again', 404)
    );
  }
  res.status(200).render('admin/userPage', {
    user,
    moment,
  });
});

//function to manage withdrawals
exports.setWithdrawalStatus = catchAsync(async (req, res, next) => {
  let Check;
  if (req.body.withdrawB === 'Confirm_Withdrawal') {
    Check = 'approved';
  } else if (req.body.withdrawB === 'Deny_Withdrawal') {
    Check = 'rejected';
  }
  const withdrawalRequest = await Withdrawal.findByIdAndUpdate(
    req.body.withdrawalID,
    { status: Check }
  );
  if (!withdrawalRequest) {
    return next(new AppError('No request found with that id', 401));
  }
  res.status(200).redirect(`/admin/user/${req.body.userId}`);
});

//function to manage links
exports.setLinkStatus = catchAsync(async (req, res, next) => {
  //get the user from the id which is sent through a hidden input field
  const user = await User.findById(req.body.user_id);
  //get the links associated with the user
  const userLinks = user.links;
  //console.log(userLinks);
  //loop through all the links associated with the user
  userLinks.forEach(async (link) => {
    const linkToCheck = await Link.findById(link);
    if (linkToCheck.status === 'unconfirmed' && linkToCheck.active === true) {
      linkToCheck.status = 'confirmed';
      linkToCheck.active = false;
      await linkToCheck.save();
    }
  });

  res.status(200).redirect(`/admin/user/${user._id}`);
});

//function to manage users
exports.setUserStatus = catchAsync(async (req, res, next) => {
  if (req.body.user_p) {
    console.log('change user plan');
  }
  if (req.body.user_s) {
    await User.findByIdAndUpdate(req.body.user_id, { active: false });
  }
  if (req.body.user_d) {
    await User.findByIdAndDelete(req.body.user_id);
    return res.status(204).redirect('/admin/dashboard');
  }
  res.status(200).redirect(`/admin/user/${req.body.user_id}`);
});
