const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

const userRouter = require('./routers/userRoutes');
const adminRouter = require('./routers/adminRoutes');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));
app.use(cookieParser());

app.use('/api/v1/user', userRouter);
app.use('/api/v1/admin', adminRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`));
});

//errors
app.use(globalErrorHandler);

module.exports = app;
