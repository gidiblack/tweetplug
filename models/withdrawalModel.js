const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
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
});

withdrawalSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: '-_id -__v -photo -links -withdrawals -role -gender',
  });
  next();
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
module.exports = Withdrawal;
