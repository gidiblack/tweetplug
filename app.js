const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const morgan = require('morgan');
const compression = require('compression');
const cors = require('cors');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

//routers
const userRouter = require('./routers/userRoutes');
const adminRouter = require('./routers/adminRoutes');
const viewRouter = require('./routers/viewRoutes');

const app = express();

//set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//cors
app.use(cors());
app.options('*', cors());

//set up static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride('_method'));

//body parser
app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));

app.use(cookieParser());

//logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(compression());

//routes
app.use('/', viewRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/admin', adminRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`));
});

//errors
app.use(globalErrorHandler);

module.exports = app;
