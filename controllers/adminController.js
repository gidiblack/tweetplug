const User = require('../models/userModel');
const List = require('../models/LinkModel');
const tweet = require('../models/tweetModel');
const Withdrawal = require('../models/withdrawalModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.setTask = catchAsync(async (req, res, next) => {});

exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  const deactivatedUser = [];
  users.forEach((user) => {
    if (user.active === false) {
      deactivatedUser.push(user);
    }
  });
  res.status(200).json({
    status: 'success',
    total_subscriber: users.length,
    deactivated_users: deactivatedUser.length,
    data: {
      users,
      deactivatedUser,
    },
  });
});

exports.getwithdrawals = catchAsync(async (req, res, next) => {
  const withdrawals = await Withdrawal.find();
  res.status(200).json({
    status: 'success',
    total_withdrawals: withdrawals.length,
    data: {
      withdrawals,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return next(new AppError('No user with that id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.approveWithdrawal = catchAsync(async (req, res, next) => {
  const approvedWithdrawal = await Withdrawal.findByIdAndUpdate(
    req.params.withdrawalId,
    {
      status: 'approved',
    }
  );
  if (!approvedWithdrawal) {
    return next(new AppError('No withdrawal request found with that id', 404));
  }
  const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
  res.status(200).json({
    status: 'sucess',
    data: {
      withdrawal,
    },
  });
});

exports.rejectWithdrawal = catchAsync(async (req, res, next) => {
  const rejectedWithdrawal = await Withdrawal.findByIdAndUpdate(
    req.params.withdrawalId,
    {
      status: 'rejected',
    }
  );
  if (!rejectedWithdrawal) {
    return next(new AppError('No withdrawal request found with that id', 404));
  }
  const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
  res.status(200).json({
    status: 'sucess',
    data: {
      withdrawal,
    },
  });
});

exports.suspendUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.userId, {
    active: false,
  }).select('+active');
  if (!user) {
    return next(new AppError('No user found with that id'));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
