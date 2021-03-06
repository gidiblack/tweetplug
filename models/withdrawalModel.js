const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: [true, 'Please enter withdrawal amount'],
    },
    status: {
      type: String,
      default: 'unconfirmed',
      enum: ['unconfirmed', 'approved', 'rejected'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

withdrawalSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: '-__v -photo -links -withdrawals -role -gender',
  });
  next();
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
module.exports = Withdrawal;
