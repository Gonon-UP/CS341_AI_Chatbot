var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("dotenv").config();

// Routers
var searchWebRouter = require('./routes/searchWeb');
var usersRouter = require('./routes/users');
var urlsRouter = require('./routes/urls');
var pagesRouter = require('./routes/pages');
var topicsRouter = require('./routes/topics');
var documentsRouter = require('./routes/documents');

const authRouter = require('./routes/auth');
const requireAuthPage = require('./middleware/requireAuthPage');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// sessions (must be before routes that use req.session)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false // set true only if HTTPS
  }
}));

// ---------- AUTH (unprotected) ----------
app.use(authRouter);

/**
 * IMPORTANT:
 * Block the app shell from loading when not logged in.
 * This must be BEFORE express.static, otherwise /index.html will be served to everyone.
 */
app.get('/', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/index.html');
  return res.redirect('/login');
});

app.get('/index.html', (req, res, next) => {
  if (req.session && req.session.userId) return next(); // allow static to serve it
  return res.redirect('/login');
});

// static (after gating)
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- EVERYTHING BELOW REQUIRES LOGIN ----------
app.use(requireAuthPage);

// keep ALL your original paths exactly the same:
app.use('/', searchWebRouter);
app.use('/users', usersRouter);
app.use('/', urlsRouter);
app.use('/', pagesRouter);
app.use('/', topicsRouter);
app.use('/', documentsRouter);

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
