const User = require('../models/userModel');
const Link = require('../models/LinkModel');
const Withdrawal = require('../models/withdrawalModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const filterObj = (obj, ...allowedFields) => {
  const approvedFields = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) approvedFields[el] = obj[el];
  });
  return approvedFields;
};

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
  //create error is user tries to update password with this route
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not to be used for updating the user password, kindly use the update password route: /updatepassword',
        401
      )
    );
  }

  //update user document and filter out restricted fields
  const filteredBody = filterObj(
    req.body,
    'firstname',
    'lastname',
    'username',
    'twitterhandle',
    'gender',
    'email',
    'bankAccountNumber',
    'bankAccountName',
    'bank',
    'mobileNumber'
  );
  const updatedUser = await User.findByIdAndUpdate(
    req.params.userId,
    filteredBody,
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
      user: updatedUser,
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
