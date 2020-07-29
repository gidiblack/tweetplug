const mongoose = require('mongoose');
const dotenv = require('dotenv');

const schedule = require('node-schedule');
const scheduletz = require('node-schedule-tz');
const User = require('./models/userModel');
const Task = require('./models/taskModel');
const moment = require('moment');

process.on('uncaughtException', (err) => {
  console.log('Uncaught exception, Shuting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');
const { validate } = require('node-cron');
dotenv.config({ path: './config.env' });

mongoose
  .connect(process.env.DATABASE_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful'));

const port = process.env.PORT || 3000;
const mode = process.env.NODE_ENV;
const server = app.listen(port, () => {
  console.log(`App runnng  in ${mode} mode, on port ${port}`);
});

//setInterval(() => {
//  intervalController.clearTask, 24 * 60 * 60;
//});

process.on('unhandledRejection', (err) => {
  console.log('unhandled rejection, Shutting down ...');
  console.log(err);
  console.log((err.name, err.message));
  server.close(() => {
    process.exit(1);
  });
});

//scheduled fucntions
// const rule = new scheduletz.RecurrenceRule();
// rule.minute = 32;
// rule.hour = 11;
// rule.tz = "Africa/Lagos";
// const j = scheduletz.scheduleJob(rule, async function () {
//     try {
//       await Task.deleteMany({ active: false });
//       await Task.updateMany({ active: true }, { $set: { active: false } });
//       console.log('Task job done');
//     } catch (error) {
//       console.log(error);
//     }
//   });
const j = schedule.scheduleJob('57 09 * * *', async function () {
  try {
    await Task.deleteMany({ active: false });
    await Task.updateMany({ active: true }, { $set: { active: false } });
    console.log('Task job done');
  } catch (error) {
    console.log(error);
  }
});

const j2 = schedule.scheduleJob('01 19 * * *', async function () {
  try {
    const users = await User.find({ Plan: { $ne: 'Free influencer' } });
    users.forEach(async (user) => {
      try {
        const newTimeLeft = user.timeLeft - 1;
        //console.log(newTimeLeft);
        await User.findByIdAndUpdate(user._id, { timeLeft: newTimeLeft });
      } catch (error) {
        console.log(error);
      }
    });
    console.log('User job done');
  } catch (error) {
    console.log(error);
  }
});

//const j3 = schedule.scheduleJob('')
