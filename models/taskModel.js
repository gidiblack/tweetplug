const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskTitle: {
    type: String,
  },
  tweet1: {
    type: String,
  },
  tweet2: {
    type: String,
  },
  tweet3: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
