const User = require('../models/userModel');
const Link = require('../models/LinkModel');
const Withdrawal = require('../models/withdrawalModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.addLink = catchAsync(async (req, res, next) => {
  const newLink = await Link.create({
    user: req.params.userId,
    link: req.body.link,
  });

  const updatedUser = await User.findByIdAndUpdate(req.params.userId, {
    $push: { links: newLink._id },
  });
  userLinks = updatedUser.links;

  res.status(201).json({
    status: 'success',
    data: {
      newLink,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.params.userId,
    {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.username,
      twitterhandle: req.body.twitterhandle,
      gender: req.body.gender,
      email: req.body.email,
      bankAccountNumber: req.body.bankAccountNumber,
      bankAccountName: req.body.bankAccountName,
      bank: req.body.bank,
      mobileNumber: req.body.mobileNumber,
    },
    {
      runValidators: true,
      new: true,
    }
  );
  if (!updatedUser) {
    return next(new AppError('No user found with that ID'));
  }
  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

exports.withdrawalRequest = catchAsync(async (req, res, next) => {
  const newWithdrawal = await Withdrawal.create({
    user: req.params.userId,
    amount: req.body.amount,
  });
  const updatedUser = await User.findByIdAndUpdate(req.params.userId, {
    $push: { withdrawals: newWithdrawal._id },
  });

  res.status(201).json({
    status: 'succeess',
    data: {
      newWithdrawal,
    },
  });
});
