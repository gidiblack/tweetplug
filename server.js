const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('Uncaught exception, Shuting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');
dotenv.config({ path: './config.env' });

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App runnng on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandled rejection, Shutting down ...');
  console.log((err.name, err.message));
  server.close(() => {
    process.exit(1);
  });
});
