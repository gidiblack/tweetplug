const User = require('../models/userModel');
const Task = require('../models/taskModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const moment = require('moment');

//helper function which converts moment formatted date which is a string to an array of numbers
//accepts the moment formated date and an empty array to store the converted date
const DateToNumber = (dateString, newArr) => {
  //split the moment formatted date by the ':' character
  const stringArr = dateString.split(':');
  //loop through split date, formats it and push converted value into empty arr passed in
  stringArr.forEach((element) => {
    const conEl = parseInt(element);
    newArr.push(conEl);
  });
};

//function to clear tasks which are older than a day
exports.clearTask = catchAsync(async (req, res, next) => {
  //get all tasks in the database
  const tasks = await Task.find();
  //create array to hold time created for each task
  const timeCreatedArr = [];
  //create array to hold current time
  const currentTimeArr = [];
  //use momemt to get and format current time in 24-hour format
  const currentTime = moment(Date.now()).format('H:mm:ss');
  //use helper function to convert time string which moment returns to integer values seperated by a comma
  DateToNumber(currentTime, currentTimeArr);
  console.log(`current Time is : ${currentTimeArr}`);
  //loop through all tasks currently present in database
  tasks.forEach(async (task, index) => {
    //convert each tasks time of creation using moment
    const timeCreated = moment(task.date).format('H:mm:ss');
    //use helper function to convert time string which moment returns to integer values seperated by a comma
    DateToNumber(timeCreated, timeCreatedArr);
    //compare hour values of the current time and the time the task was created
    //if the difference between the hour values of the current time and the time the task was created is greated than 22 i.e. 22 hours have elapsed since the task was created, delete the task
    console.log(`time stamp for task ${index + 1}:${timeCreatedArr}`);
    if (currentTimeArr[0] - timeCreatedArr[0] >= 22) {
      await Task.findByIdAndDelete(task._id);
    }
    //console.log(`time creatd at this  1st point is ${timeCreatedArr}`);
    //clear the current time in the time created array and start loop again
    timeCreatedArr.splice(0, timeCreatedArr.length);
    //console.log(`time creatd at this  2nd point is ${timeCreatedArr}`);
    //console.log(timeCreatedArr);
  });
  next();
});

//logs to test should be placed in if statement
//console.log(`this task was created at ${timeCreatedArr[0]}`);
//console.log(
//  `The differnece for this task is ${
//    currentTimeArr[0] - timeCreatedArr[0]
//  } , so ${task._id} should be deleted while the time created is ${
//    timeCreatedArr[0]
//  }`
//);
