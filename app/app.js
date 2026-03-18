var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("dotenv").config();

var searchWebRouter = require('./routes/searchWeb');
var usersRouter = require('./routes/users');
var saveURLRouter = require('./routes/saveURL');
var loadURLRouter = require('./routes/loadURL');
var deleteURLRouter = require('./routes/deleteURL');
var savePageRouter = require('./routes/savePage');
var loadPageRouter = require('./routes/loadPage');
var loadPagesRouter = require('./routes/loadPages');
var deletePageRouter = require('./routes/deletePage');
var saveTitleRouter = require('./routes/saveTitle');
var saveTopicsRouter = require('./routes/saveTopics');
var loadTopicsRouter = require('./routes/loadTopics');
var uploadDocumentRouter = require('./routes/uploadDocument');
var getDocumentsRouter = require('./routes/getDocuments');
var deleteDocumentRouter = require('./routes/deleteDocument');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use('/', searchWebRouter);
app.use('/users', usersRouter);
app.use('/', saveURLRouter);
app.use('/', loadURLRouter);
app.use('/', deleteURLRouter);
app.use('/', savePageRouter);
app.use('/', loadPageRouter);
app.use('/', loadPagesRouter);
app.use('/', deletePageRouter);
app.use('/', saveTitleRouter);
app.use('/', saveTopicsRouter);
app.use('/', loadTopicsRouter);
app.use('/', uploadDocumentRouter);
app.use('/', getDocumentsRouter);
app.use('/', deleteDocumentRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.error(err);

  res.status(err.status || 500).json({
    error: err.message || "Server error"
  });
});

module.exports = app;
