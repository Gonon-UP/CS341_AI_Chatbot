var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("dotenv").config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var saveURLRouter = require('./routes/saveURL');
var loadURLRouter = require('./routes/loadURL');
var deleteURLRouter = require('./routes/deleteURL');
var savePageRouter = require('./routes/savePage');
var loadPagesRouter = require('./routes/loadPages');
var deletePageRouter = require('./routes/deletePage');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', saveURLRouter);
app.use('/', loadURLRouter);
app.use('/', deleteURLRouter);
app.use('/', savePageRouter);
app.use('/', loadPagesRouter);
app.use('/', deletePageRouter);

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
