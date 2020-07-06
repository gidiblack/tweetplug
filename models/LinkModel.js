const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    link: {
      type: String,
      required: [true, 'Please enter the link'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      default: 'unconfirmed',
      enum: ['unconfirmed', 'confirmed'],
    },
  },
  {
    timestamps: true,
  }
);
linkSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: '-_id -__v',
  });
  next();
});

const Link = mongoose.model('Link', linkSchema);
module.exports = Link;
