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

const Link = mongoose.model('Link', linkSchema);
module.exports = Link;
