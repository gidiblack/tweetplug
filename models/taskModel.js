const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  task: {
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
