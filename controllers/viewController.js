const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Task = require('../models/taskModel');
const Withdrawal = require('../models/withdrawalModel');
const Link = require('../models/LinkModel');
const User = require('../models/userModel');
const Email = require('../utils/email');
const crypto = require('crypto');

const moment = require('moment');

//revenue to be added for each user plan
const freeinfluencerrev = 5;
const juniorinfluencerrev = 270;
const whizinfluencerrev = 250;
const adeptinfluencerrev = 500;
const chiefinfluencerrev = 1000;
const expertinfluencerrev = 1500;
const principalinfluencerrev = 2000;
const liegeinfluencerrev = 2500;
const professionalinfluencerrev = 3000;
const primeinfluencerrev = 4000;
const monarchinfluencerrev = 5000;
const geniusinfluencerrev = 6000;

//function to set the rev of user based on userPlan
const setRevenue = (user) => {
  let revenue;
  if (user.Plan == 'Free influencer') {
    revenue = freeinfluencerrev;
  }
  if (user.Plan == 'Junior influencer') {
    revenue = juniorinfluencerrev;
  }
  if (user.Plan == 'Whiz influencer') {
    revenue = whizinfluencerrev;
  }
  if (user.Plan == 'Adept influencer') {
    revenue = adeptinfluencerrev;
  }
  if (user.Plan == 'Chief influencer') {
    revenue = chiefinfluencerrev;
  }
  if (user.Plan == 'Expert influencer') {
    revenue = expertinfluencerrev;
  }
  if (user.Plan == 'Principal influencer') {
    revenue = principalinfluencerrev;
  }
  if (user.Plan == 'Liege influencer') {
    revenue = liegeinfluencerrev;
  }
  if (user.Plan == 'Professional influencer') {
    revenue = professionalinfluencerrev;
  }
  if (user.Plan == 'Prime influencer') {
    revenue = primeinfluencerrev;
  }
  if (user.Plan == 'Monarch influencer') {
    revenue = monarchinfluencerrev;
  }
  if (user.Plan == 'Genius influencer') {
    revenue = geniusinfluencerrev;
  }
  return revenue;
};

// get home page
exports.getHome = catchAsync(async (req, res, next) => {
  res.status(200).render('index');
});

//get login page
exports.getLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('login');
});

//get register page
exports.getRegister = catchAsync(async (req, res, next) => {
  res.status(200).render('register');
});

//get faq page
exports.getFAQ = catchAsync(async (req, res, next) => {
  res.status(200).render('faq');
});

//get page for users to confirm their email. link to this is sent to users via email
exports.getEmailConfirm = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  res.status(200).render('emailConfirm', {
    user,
  });
});

//get user dashboard
exports.getUserDashboard = catchAsync(async (req, res, next) => {
  // get the previous days date
  const yesterday = moment().add(-1, 'days').format('MMMM Do YYYY');
  //get user from db
  const user = await User.findById(res.locals.user._id).populate({
    path: 'links',
    select: '-user',
  });

  //get date on the last link submission made by the user
  let dateSet;
  if (user.links.length > 0) {
    dateSet = moment(user.links[0 + user.links.length - 1].createdAt).format(
      'MMMM Do YYYY'
    );
  }

  //console.log(yesterday);
  //console.log(dateSet);
  // value that will be used to check if the user submitted the link the previous day. used for the yesterday's action functionality
  let confirmation;
  // if the date on the user's last link submission is eqaul to the previous days submission then user submtted a link yesterday and cheeck is passed yesterday's action is set to met on dash, if not the the check fails and yesterday's action is set to missed.
  if (dateSet == yesterday) {
    //console.log('passed');
    confirmation = 'passed';
  } else {
    //console.log('failed');
    confirmation = 'failed';
  }

  // time from which users can no longer submit tasks
  const taskSubmissionLimit = '22:00:00';
  //console.log(taskSubmissionLimit);
  const tasks = await Task.find({ active: true });
  res.status(200).render('userDashboard', {
    tasks,
    moment,
    taskSubmissionLimit,
    user,
    confirmation,
  });
});

//regex to check if any of links user submitted is valid
const linkCheck = (link) => {
  const re = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
  if (re.test(String(link)) == true) {
    return true;
  } else {
    return false;
  }
};

//function for user to submit new links anytime a new set(3) of links are submitted the previous set(3) of links are deleted from the DB
exports.userSubmitLinks = catchAsync(async (req, res, next) => {
  //first we get the link set from the the req and save the 3 links into an array
  const linksArr = [req.body.link1, req.body.link2, req.body.link3];
  const linkCheckValues = [];
  linksArr.forEach((link) => {
    if (linkCheck(link) == false) {
      linkCheckValues.push(false);
    }
  });

  if (linkCheckValues.includes(false)) {
    return next(
      new AppError(
        'One of the links you submitted was invalid, please check the links and try again',
        401
      )
    );
  }
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
  const date = moment(Date.now());
  res.status(200).render('withdrawals', {
    moment,
    user,
    date,
  });

  //const dow = date.day();
  //console.log(dow);
});

exports.makeWithdrawalRequest = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.body.userID);
  if (user.revenue < req.body.amount) {
    return next(
      new AppError(
        'Withdrawal request is greater than total revenue please adjust',
        401
      )
    );
  }
  const newWithdrawal = await Withdrawal.create({
    user: req.body.userID,
    amount: req.body.amount,
  });
  const previousWithdrawalId =
    user.withdrawals[0 + user.withdrawals.length - 1];
  await Withdrawal.findByIdAndUpdate(previousWithdrawalId, { active: false });
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
  //console.log(req.body.passwordCurrent);
  //console.log(user.password);

  if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Current password entered is wrong', 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //console.log(user);
  await user.save();
  res.redirect('/');
});

exports.getUpgradePage = catchAsync(async (req, res, next) => {
  res.status(200).render('upgrade');
});

exports.getAdminLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('admin/adminLogin');
});

exports.getForgotPasswordPage = catchAsync(async (req, res, next) => {
  res.status(200).render('forgotPassword');
});

exports.sendPasswordResetToken = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(
        'There is no registered user with that email address, please enter a registered email address',
        404
      )
    );
  }
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/resetpassword/${resetToken}`;

  try {
    await new Email(user, resetUrl).sendPasswordReset();
    res.status(200).redirect('/');
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

exports.getResetPasswordPage = catchAsync(async (req, res, next) => {
  res.status(200).render('resetPassword', {
    req,
  });
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

  res.redirect('/login');
});

exports.getContact = catchAsync(async (req, res, next) => {
  res.status(200).render('contactUs');
});
exports.getTerms = catchAsync(async (req, res, next) => {
  res.status(200).render('terms');
});
exports.getSubscribe = catchAsync(async (req, res, next) => {
  res.status(200).render('subscribe');
});
exports.getAdvertise = catchAsync(async (req, res, next) => {
  res.status(200).render('advertise');
});

//get the admin dashboard
exports.getAdminDashboard = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ active: true });
  const withdrawals = await Withdrawal.find({ status: 'unconfirmed' });
  const links = await Link.find({ status: 'unconfirmed' });
  const users = await User.find({ role: 'user' })
    .populate({
      path: 'links',
      select: '-_id -user ',
    })
    .populate({
      path: 'withdrawals',
      select: '-user',
    });
  const usersWithWithdrawals = [];

  users.forEach((user) => {
    //console.log(user.withdrawals.length);
    //console.log(user.withdrawals[0 + user.withdrawals.length - 1].status);
    if (
      user.withdrawals.length > 0 &&
      user.withdrawals[0 + user.withdrawals.length - 1].status == 'unconfirmed'
    ) {
      usersWithWithdrawals.push(user);
    }
  });
  //console.log(usersWithWithdrawals);
  res.status(200).render('admin/adminDashboard', {
    tasks,
    withdrawals,
    links,
    moment,
    users,
    usersWithWithdrawals,
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
  const userr = await User.findById(req.params.userId)
    .populate({
      path: 'links',
      select: '-_id -user ',
    })
    .populate({
      path: 'withdrawals',
      select: '-__v -user',
    });
  if (!userr) {
    return next(
      new AppError('No user found with that Id, please try again', 404)
    );
  }
  res.status(200).render('admin/userPage', {
    userr,
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
  if (Check == 'approved') {
    const amount = withdrawalRequest.amount;
    const userId = req.body.userId;
    const user = await User.findById(userId);
    const newRev = user.revenue - amount;
    user.revenue = newRev;
    await user.save({ validateBeforeSave: false });
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

  const rev = setRevenue(user);
  const newRev = user.revenue + rev;
  user.revenue = newRev;
  await user.save({ validateBeforeSave: false });
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

exports.confirmAllWithdrawals = catchAsync(async (req, res, next) => {
  const withdrawalsIdArr = req.body.withdrawal;
  //console.log(withdrawalsIdArr);

  const userIdArr = [];
  const withAmountArr = [];
  if (Array.isArray(withdrawalsIdArr)) {
    withdrawalsIdArr.forEach(async (Id) => {
      const withdrawal = await Withdrawal.findByIdAndUpdate(Id, {
        status: 'approved',
      });

      //console.log(withdrawal);
      const userId = withdrawal.user._id;
      const amount = withdrawal.amount;
      userIdArr.push(userId);
      withAmountArr.push(amount);
      userIdArr.forEach(async (id, index) => {
        const user = await User.findById(id);
        const newRev = user.revenue - withAmountArr[index];
        //console.log(`newRev for user${index} is ${newRev}`);
        user.revenue = newRev;
        //console.log(`updatedRev for user${index} is ${user.revenue}`);

        await user.save({ validateBeforeSave: false });
      });
    });

    return res.status(200).redirect('/admin/dashboard');
  }

  const withdrawal = await Withdrawal.findByIdAndUpdate(withdrawalsIdArr, {
    status: 'approved',
  });
  const userId = withdrawal.user._id;
  const amount = withdrawal.amount;
  const user = await User.findById(userId);
  const newRev = user.revenue - amount;
  user.revenue = newRev;
  await user.save({ validateBeforeSave: false });

  res.status(200).redirect('/admin/dashboard');
  //console.log(withdrawalsIdArr);
});

exports.getPlanChangePage = catchAsync(async (req, res, next) => {
  const userr = await User.findById(req.params.userId);
  res.status(200).render('changePlan', {
    userr,
  });
});

exports.changeUserPlan = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.body.userId, {
    Plan: req.body.plan,
  });
  res.status(200).redirect(`/admin/user/${user._id}`);
});

exports.confirmAllLinks = catchAsync(async (req, res, next) => {
  //console.log(req.body.userLinksID);
  const userIds = req.body.userLinksID;
  if (Array.isArray(userIds)) {
    userIds.forEach(async (id) => {
      const user = await User.findById(id);
      linksArr = user.links;
      linksArr.forEach(async (id) => {
        await Link.findByIdAndUpdate(id, { status: 'confirmed' });
      });
    });

    return res.status(200).redirect('/admin/dashboard');
  }

  if (typeof userIds == String) {
    const linkIds = await User.findById(userIds);
    linkIds.forEach(async (id) => {
      await Link.findByIdAndUpdate(id, { status: 'confirmed' });
    });

    return res.status(200).redirect('/admin/dashboard');
  }

  res.status(200).redirect('/admin/dashboard');
});
