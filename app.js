var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var mongoose   = require('mongoose');
var swig = require('swig');
var methodOverride = require('method-override');
var auth = require('basic-auth')

//mongoose.Promise = require('bluebird');


/*** ROUTES ****/
// var routes = require('./routes/index');
var recordings = require('./routes/recordings');

/*** MODELS ****/
// var User = require('./app/models/user');

var app = express();

console.log("HIII")

app.set('view cache', process.env.stage === 'production');
swig.setDefaults({ cache: process.env.stage === 'production' });

// view engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'html');
app.engine('html', swig.renderFile);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))

// app.use(function(req, res, next) {
//     var credentials = auth(req);
//
//     res.format({
//       html: function(){
//         if (typeof credentials == 'undefined' || credentials['name'] != process.env.USERNAME || credentials['pass'] != process.env.PASSWORD) {
//           res.statusCode = 401;
//           res.setHeader('WWW-Authenticate', 'Basic realm="dropmic"');
//           res.end('Unauthorized');
//         } else {
//           next();
//         }
//       },
//
//       json: function(){
//         next();
//       }
//     });
// });

app.use(function(req, res, next) {
  if(req.query && req.query.authToken) {
    User.findByToken(req.query.authToken,function(err,user){
      
      if(err){ next(err); }
      else {
        req.currentUser = user; 
        next(); 
      }
    });
  } else {
    next();
  }
});


app.use('/recordings', recordings);

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

// mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/dropmic');


module.exports = app;
