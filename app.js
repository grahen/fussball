var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');



var log4js = require('log4js');
var log = log4js.getLogger();


var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var games = require('./routes/games');

// Database
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/fussball", {native_parser:true});

//TODO setup the database the first time with correct indexes:
//userlist.username -> unique


var app = express();

var bus = require('./bus');

var es = require('eventstore')({
  type: 'mongodb',
  host: 'localhost',                          // optional
  port: 27017,                                // optional
  dbName: 'fussball',                       // optional
  eventsCollectionName: 'events',             // optional
  snapshotsCollectionName: 'snapshots',       // optional
  transactionsCollectionName: 'transactions', // optional
  timeout: 10000                              // optional
  // username: 'technicalDbUser',                // optional
  // password: 'secret'                          // optional
});

es.init(function(){
  log.debug("Ok initialized.....");
});

es.useEventPublisher(function(evt) {
  bus.emit('event', evt);
});


// view engine setup
app.set('views', path.join(__dirname, 'client/views'));
app.set('view engine', 'jade');

if (app.get('env') === 'development') {
    app.locals.pretty = true;
}

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'client')));


// Make our db accessible to our router
app.use(function(req,res,next){
  req.db = db;
  req.es = es; //add event store
  next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/games', games);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
