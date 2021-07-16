const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// import mongoDB
const mongoose = require('mongoose');
const config = require('./database/mongodb');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const customersRouter = require('./routes/customers');
const architectsRouter = require('./routes/architects');
const engineersRouter = require('./routes/engineers');
const paymentsRouter = require('./routes/payments');

const app = express();
require('dotenv').config();
const bodyParser = require('body-parser');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use('/public', express.static(path.join(__dirname, 'public')));

// MongoDB Connexion
mongoose
    .connect(config.mongo.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log('Connected to Mongo'))
    .catch((err) => console.log(err));

// MiddleWares
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/customers', customersRouter);
app.use('/architects', architectsRouter);
app.use('/engineers', engineersRouter);
app.use('/payments', paymentsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
