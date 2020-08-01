const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Task = require('../models/taskModel');
const Withdrawal = require('../models/withdrawalModel');
const Link = require('../models/LinkModel');
const User = require('../models/userModel');
const Email = require('../utils/email');
const crypto = require('crypto');
const moment = require('moment');
const momenttz = require('moment-timezone');
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const htmltotext = require('html-to-text');
const ejs = require('ejs');

const auth = {
  auth: {
    api_key: process.env.MAILGUN_APIKEY,
    domain: process.env.MAILGUN_DOMAIN,
  },
};

const nodemailerMailgun = nodemailer.createTransport(mg(auth));

//revenue to be added for each user plan
const freeinfluencerrev = 5;
const juniorinfluencerrev = 615;
const whizinfluencerrev = 500;
const adeptinfluencerrev = 1000;
const chiefinfluencerrev = 2000;
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
  const yesterday = moment().add(-1, 'days').format('MMMM DD YYYY');
  //get user from db
  const user = await User.findById(res.locals.user._id).populate({
    path: 'links',
    select: '-user',
  });
  //console.log(user.lastSubmissionDate);
  const yesterdaysLinksArr = [];
  const Links = await Link.find();
  //console.log(user.links);
  if (user.links.length > 0) {
    user.links.forEach((link) => {
      if (link.active == false) {
        yesterdaysLinksArr.push(link);
      }
    });
  }

  //console.log(yesterdaysLinksArr);
  //console.log();
  let confirmation = false;
  if (yesterdaysLinksArr.length > 0) {
    if (
      moment(yesterdaysLinksArr[2].createdAt).format('MMMM DD YYYY') ==
      yesterday
    ) {
      confirmation = true;
    } else {
      confirmation = false;
    }
  }

  //console.log(confirmation);
  // Links.some(function (link) {
  //   const userToCheck = link.user.username;
  //   if (userToCheck == user.username && link.active == false) {
  //     userLinksArr.push(link);
  //   }
  // });

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
    momenttz,
  });
});

//regex to check if any of links user submitted is valid
const linkCheck = (link) => {
  const re = /[(http(s)?):\/\/(www\.)?twitter._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
  if (re.test(String(link)) == true) {
    return true;
  } else {
    return false;
  }
};

//function for user to submit new links,
//user is limited to one submission a day
// anytime a new set(3) of links is submitted, the inactive links are deleted,
//the previous links are set to false
//links are saved
exports.userSubmitLinks = catchAsync(async (req, res, next) => {
  //first we get the link set from the the req and save the 3 links into an array
  const linksArr = [req.body.link1, req.body.link2, req.body.link3];
  const linkCheckValues = [];
  //use the link to check function to see if the links being submitted are valid.
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

  //get the Id of the user's last links (user.links is an array of linksIDs associated with the user)
  const allUserLinks = user.links;
  if (allUserLinks.length > 0) {
    let newLink;
    allUserLinks.forEach(async (link) => {
      //loop through array of link ids associated with user(allUserLinks)
      const linkCheck = await Link.findById(link);
      if (linkCheck.active == false) {
        // if link is inactive delete the link
        await Link.findByIdAndDelete(linkCheck._id);
        // and remove the link id from the user.links
        await User.findByIdAndUpdate(req.body.userId, {
          $pull: { links: linkCheck._id },
        });
      } else {
        //if the link is still active, set the active value to false
        newLink = await Link.findByIdAndUpdate(linkCheck._id, {
          active: false,
        });
        //set the last submission date to the date of the link being deactivated
        //user.lastSubmissionDate = newLink.createdAt;
      }
    });

    //await user.save({ validateBeforeSave: false });
  }

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

exports.getLinkEditPage = catchAsync(async (req, res, next) => {
  const loggedInUser = await User.findById(req.params.userId).populate({
    path: 'links',
  });
  counter = 0;
  //console.log(loggedInUser.links);
  res.status(200).render('editLink', { loggedInUser, counter });
});

exports.editUserLink = catchAsync(async (req, res, next) => {
  const link1 = req.body.link1;
  const link2 = req.body.link2;
  const link3 = req.body.link3;
  const LinksArr = [link1, link2, link3];
  const user = await User.findById(req.body.userId).populate({
    path: 'links',
    select: '-user',
  });
  //console.log(link1);
  //console.log(link2);
  //console.log(link3);
  //console.log(user);
  const activeLinksArr = [];
  user.links.forEach((link) => {
    if (link.active == true) {
      activeLinksArr.push(link);
    }
  });
  //console.log(user);
  //console.log(activeLinksArr);
  activeLinksArr.forEach(async (link, index) => {
    await Link.findByIdAndUpdate(link._id, { link: LinksArr[index] });
  });

  res.status(200).redirect(`/user/links/${user._id}`);
});

exports.getWithdrawalPage = catchAsync(async (req, res, nex) => {
  const user = await User.findById(req.params.userId).populate({
    path: 'withdrawals',
  });
  const timeLimit = 16;
  const date = moment(Date.now());
  res.status(200).render('withdrawals', {
    moment,
    user,
    date,
    timeLimit,
    momenttz,
  });

  //const dow = date.day();
  //console.log(dow);
});

exports.makeWithdrawalRequest = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.body.userID);
  if (req.body.amount < 1000) {
    return next(
      new AppError('You cannot withdraw less than a 1000 naira', 401)
    );
  }

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
    //await new Email(user, resetUrl).sendPasswordReset();
    let temp;
    const html = ejs.renderFile(
      `${__dirname}/../views/emails/passwordReset.ejs`,
      {
        firstName: user.firstName,
        url: resetUrl,
        subject: 'Your password reset token (valid for 10 minutes)',
      },
      (err, html) => {
        if (err) console.log(err);
        temp = html;
      }
    );
    nodemailerMailgun.sendMail(
      {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Your password reset token (valid for 10 minutes)',
        html: temp,
      },
      (err, info) => {
        if (err) {
          console.log(`Error: ${err}`);
        } else {
          console.log(`Info: ${info}`);
        }
      }
    );
    res.status(200).redirect('/');
  } catch (error) {
    console.log(error);
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

exports.contactAdmin = catchAsync(async (req, res, next) => {
  const name = req.body.name;
  const userEmail = req.body.email;
  //const url = req.body.message;
  const message = `${name} sent an Email from ${userEmail} 
  content: ${req.body.message}
  `;
  const supportEmail = 'support@tweetplug.com';
  const user = {
    firstname: name,
    email: userEmail,
  };
  // await new Email(user, url).sendContact();
  nodemailerMailgun.sendMail(
    {
      from: user.email,
      to: supportEmail,
      subject: `Message from ${name} `,
      text: message,
    },
    (err, info) => {
      if (err) {
        console.log(`Error: ${err}`);
      } else {
        console.log(`Info: ${info}`);
      }
    }
  );
  res.status(200).redirect('/');
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
exports.getPrivacy = catchAsync(async (req, res, next) => {
  res.status(200).render('privacy');
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
    momenttz,
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
  const counter = 0;
  res.status(200).render('admin/userPage', {
    userr,
    moment,
    counter,
  });
});

//function to manage withdrawals
exports.setWithdrawalStatus = catchAsync(async (req, res, next) => {
  let Check;
  if (req.body.withdrawB === 'Confirm Withdrawal') {
    Check = 'approved';
  } else if (req.body.withdrawB === 'Deny Withdrawal') {
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
    await User.findByIdAndUpdate(userId, { revenue: newRev });
  }
  res.status(200).redirect(`/admin/user/${req.body.userId}`);
});

//function to manage links
exports.setLinkStatus = catchAsync(async (req, res, next) => {
  //console.log(req.body.link);
  if (req.body.link[0] == '') {
    return next(
      new AppError(
        'The current user has not submitted a link and as such links cannot be confirmed',
        401
      )
    );
  }
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
  const id = user._id;
  await User.findByIdAndUpdate(id, { revenue: newRev });
  res.status(200).redirect(`/admin/user/${user._id}`);
});

//function to manage users
exports.setUserStatus = catchAsync(async (req, res, next) => {
  if (req.body.user_p) {
    console.log('change user plan');
  }
  if (req.body.user_s) {
    const user = await User.findById(req.body.user_id);
    if (user.active == true) {
      await User.findByIdAndUpdate(req.body.user_id, { active: false });
    } else if (user.active == false) {
      await User.findByIdAndUpdate(req.body.user_id, { active: true });
    }
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
        //console.log(`updatedRev for user${index} is ${user.revenue}`);
        await User.findByIdAndUpdate(id, { revenue: newRev });
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
  await User.findByIdAndUpdate(userId, { revenue: newRev });

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
  const user = await User.findById(req.body.userId);
  user.Plan = req.body.plan;
  let newTimeLeft;
  if (req.body.plan == 'Junior influencer') {
    newTimeLeft = 7;
  } else if (req.body.plan == 'Free influencer') {
    newTimeLeft = 999;
  } else if (
    req.body.plan == 'Whiz influencer' ||
    req.body.plan == 'Adept influencer' ||
    req.body.plan == 'Chief influencer'
  ) {
    newTimeLeft = 15;
  } else {
    newTimeLeft = 30;
  }
  user.timeLeft = newTimeLeft;
  await user.save({ validateBeforeSave: false });
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
      const rev = setRevenue(user);
      const newRev = user.revenue + rev;
      await User.findByIdAndUpdate(id, { revenue: newRev });
    });

    return res.status(200).redirect('/admin/dashboard');
  }

  if (typeof userIds == String) {
    const user = await User.findById(userIds);
    user.links.forEach(async (id) => {
      await Link.findByIdAndUpdate(id, { status: 'confirmed' });
    });
    const rev = setRevenue(user);
    const newRev = user.revenue + rev;
    await User.findByIdAndUpdate(id, { revenue: newRev });
    return res.status(200).redirect('/admin/dashboard');
  }

  res.status(200).redirect('/admin/dashboard');
});
