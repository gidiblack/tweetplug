const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
    enum: ['male', 'female'],
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
  photo: {
    type: String,
    default: 'default.jpg',
  },
  Plan: {
    type: String,
    default: 'Free trial',
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
  },

  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
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

userSchema.methods.checkPassword = async function (
  inputpassword,
  userpassword
) {
  return await bcrypt.compare(inputpassword, userpassword);
};
const User = mongoose.model('User', userSchema);

module.exports = User;
