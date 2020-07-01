const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Task = require('../models/taskModel');
const Withdrawal = require('../models/withdrawalModel');
const Link = require('../models/LinkModel');
const User = require('../models/userModel');

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
  //time from which link submissions are no longer allowed
  const taskSubmissionLimit = '22:00:00';
  console.log(taskSubmissionLimit);
  const tasks = await Task.find({ active: true });
  res.status(200).render('userDashboard', {
    tasks,
    moment,
    taskSubmissionLimit,
  });
});

//function for user to submit new links anytime a new link set(3) is submitted the previous links set(3) are deleted from the DB
exports.userSubmitLinks = catchAsync(async (req, res, next) => {
  //first we get the link set from the the req and save the 3 links into an array
  const linksArr = [req.body.link1, req.body.link2, req.body.link3];
  //get the User that is making the request
  const user = await User.findById(req.body.userId);
  //get all previous linksIds of links the user has submitted (user.links is an array of linksIDs associated with the user)
  const linksToBeDeactivated = user.links;
  //console.log(linksToBeDeactivated);
  //loop through the array and delete each link from the link collection
  //also pull the link id of the links from the user document
  linksToBeDeactivated.forEach(async (link) => {
    await Link.findByIdAndDelete(link);
    await User.findByIdAndUpdate(req.body.userId, { $pull: { links: link } });
  });
  //create new link based on linkArr which is an array of incoming links on the req
  linksArr.forEach(async (link) => {
    const newLink = await Link.create({
      user: req.body.userId,
      link: link,
    });
    //add id of new links created to the user document
    await User.findByIdAndUpdate(req.body.userId, {
      $push: { links: newLink._id },
    });
  });

  res.status(201).redirect('/user/dashboard');
});

exports.getWithdrawalPage = catchAsync(async (req, res, nex) => {
  const user = await User.findById(req.params.userId).populate({
    path: 'withdrawals',
  });
  res.status(200).render('withdrawals', {
    moment,
    user,
  });
});

exports.makeWithdrawalRequest = catchAsync(async (req, res, next) => {
  const newWithdrawal = await Withdrawal.create({
    user: req.body.userID,
    amount: req.body.amount,
  });
  const updatedUser = await User.findByIdAndUpdate(req.body.userID, {
    $push: { withdrawals: newWithdrawal._id },
  });

  res.status(200).redirect('/');
});

exports.getMyProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  res.status(200).render('profile', {
    user,
  });
});

exports.editProfile = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.body.userId,
    {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.username,
      gender: req.body.gender,
      twitterhandle: req.body.twitterhandle,
      bankAccountNumber: req.body.bankaccountnumber,
      bankAccountName: req.body.bankaccountname,
      bank: req.body.bank,
      mobileNumber: req.body.mobile,
      email: req.body.email,
    },
    {
      runValidators: true,
    }
  );
  res.status(200).redirect(`/user/profile/${updatedUser._id}`);
});

exports.changePassowrd = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.body.userId).select('+password');
  console.log(req.body.passwordCurrent);
  console.log(user.password);

  if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Current password entered is wrong', 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  res.redirect('/');
});

exports.getUpgradePage = catchAsync(async (req, res, next) => {
  res.status(200).render('upgrade');
});

exports.getAdminLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('admin/adminLogin');
});

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
  const oldTasks = await Task.find({ active: true });
  if (oldTasks.length > 0) {
    oldTasks.forEach(async (task) => {
      await Task.findByIdAndUpdate(task._id, { active: false });
    });
  }
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
