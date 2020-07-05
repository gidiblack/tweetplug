const User = require('../models/userModel');
const { promisify } = require('util');
const JWT = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');

const signToken = (id) => {
  return JWT.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//helper function: creates jwt, sends token alongside response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: false,
    httpOnly: true,
  };
  res.cookie('jwt', token, cookieOptions);
  //remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
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
  const url = `${req.protocol}://${req.get('host')}/emailconfirm/${
    newUser._id
  }`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.confirmEmail = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.userId, {
    emailConfirmed: true,
  });
  res.status(200).redirect('/login');
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
  if (user.emailConfirmed == false) {
    return next(
      new AppError(
        'You have not confirmed your email yet, Please do so before you can login',
        403
      )
    );
  }
  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
});

exports.authenticate = catchAsync(async (req, res, next) => {
  //get token from req
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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
  if (user.emailConfirmed == false) {
    return next(
      new AppError(
        'You have not confirmed your email yet, Please do so before you can login',
        403
      )
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

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //get user from db via email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }
  //generate random token using instance method (userModel)
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //send token to user email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/user/resetpassword/${resetToken}`;

  const message = `Forgot your password ? Submit a patch request with your new password and passwordConfirm to ${resetURL}.\n If you didn't make this request please ignore`;
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Password reset token(Valid for 10 minutes)',
    //   message,
    // });
    res.status(200).json({
      status: 'success',
      message: `Token sent to ${user.email}`,
    });
  } catch (error) {
    //console.log(error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending your email, try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on token(first encrypt plain text token and compare with encrypted token in db)
  const hashedtoken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedtoken,
    passwordResetExpires: { $gt: Date.now() }, //check if reset token has expired
  });
  //set new password if token has not expired
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //update changedpasswordat property for current user
  //Implemented in the user model
  //login user
  createSendToken(user, 200, res);
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  //get user from db
  const user = await User.findById(req.user.id).select('+password');
  //check if password is correct using instance method
  if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Current password entered is wrong', 401));
  }
  //update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //log user in and send token
  createSendToken(user, 200, res);
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(JWT.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      const user = await User.findById(decoded.id);
      if (!user) {
        return next();
      }
      if (user.passwordChangeTimeStamp(decoded.iat)) {
        return next();
      }
      res.locals.user = user;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
});
