const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, 'Please enter your firstname'],
  },
  lastname: {
    type: String,
    required: [true, 'Please enter your lastname'],
  },
  username: {
    type: String,
    required: [true, 'Please enter a username'],
    unique: [
      true,
      'Seems like that username is already taken, please try another',
    ],
  },
  gender: {
    type: String,
    required: [true, 'Please state your gender'],
    enum: ['male', 'female', 'other'],
  },
  twitterhandle: {
    type: String,
    required: [true, 'Please enter your twitter handle'],
  },
  bankAccountNumber: {
    type: Number,
    required: [true, 'Please enter your bank account number'],
  },
  bankAccountName: {
    type: String,
    required: [true, 'Please enter your bank account name'],
  },
  bank: {
    type: String,
    required: [true, 'Please select your bank'],
  },
  mobileNumber: {
    type: Number,
    required: [true, 'please enter your phone number'],
    min: [11, 'A phone number must be at least 11 characters in length'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: [
      true,
      'A user is already registered with that email, please log in or try another email',
    ],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  emailConfirmed: {
    type: Boolean,
    default: false,
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  Plan: {
    type: String,
    default: 'free influencer',
    enum: [
      'Free trial',
      'free influencer',
      'junior influencer',
      'whiz influencer',
      'adept influencer',
      'chief influencer',
      'expert influencer',
      'principal influencer',
      'liege influencer',
      'professional influencer',
      'prime influencer',
      'monarch influencer',
      'genius influencer',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    select: false,
    minlength: [8, 'password must be at least 8 characters long'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'passwords do not match',
    },
  },
  links: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Link',
    },
  ],
  withdrawals: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Withdrawal',
    },
  ],
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin'],
  },

  //records date password was changed at
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
  },
  timeLeft: {
    type: Number,
  },
});

//userSchema.pre(/^find/, function (next) {
//  this.find({ active: { $ne: false } });
//  next();
//});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

//pre-save middleware to set date password was changed at
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // minus 1 second from the date incase of latency in jwt issue timestamp
  next();
});

//instance method to validate password available on all user instances
userSchema.methods.checkPassword = async function (
  inputpassword,
  userpassword
) {
  return await bcrypt.compare(inputpassword, userpassword);
};

//
userSchema.methods.passwordChangeTimeStamp = function (JWTTimeStamp) {
  //if passwordchangedat field exists ie user has changed password
  if (this.passwordChangedAt) {
    //convert date user changed his password to seconds
    const changeDateTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //console.log(this.passwordChangedAt, JWTTimeStamp);
    //check if the time in the JWT time stamp is greater than the time the user changed his password, if jwttimestamp is greater jwt was issues after user changed his password, if ///not jwt was issued before user changed his password in such an instance we want to deny access
    const check = JWTTimeStamp < changeDateTimeStamp;
    //check is true if user has changed his password after jwt was issued, it is false if jwt was issued before user changed password
    return check;
  }
  //return false if the passwordchangedat field is empty ie user has not chnaged his password
  return false;
};

//passwordresettoken instance method
userSchema.methods.createPasswordResetToken = function () {
  //generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  //console.log(resetToken);
  //encrypt token and save to DB in password reset token field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //set expiry for reset token
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  //reset plain text token to send to user via email
  return resetToken;
};

userSchema.pre('save', function (next) {
  if (this.Plan === 'free influencer') {
    this.timeLeft = 999;
    next();
  }
  if (this.Plan === 'junior influencer') {
    this.timeLeft = 14;
    next();
  } else {
    this.timeLeft = 30;
    next();
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
