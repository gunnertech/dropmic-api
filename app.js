var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var swig = require('swig');
var methodOverride = require('method-override');
var auth = require('basic-auth')
var Device = require('./app/models/device');
var Recording = require('./app/models/recording');
var Notification = require('./app/models/notification');
var _ = require('lodash');

//mongoose.Promise = require('bluebird');


/*** ROUTES ****/
// var routes = require('./routes/index');
var recordings = require('./routes/recordings');
var notifications = require('./routes/notifications');

/*** MODELS ****/
// var User = require('./app/models/user');

var app = express();


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

// app.use(function(req, res, next) {
//   if(req.query && req.query.authToken) {
//     User.findByToken(req.query.authToken,function(err,user){
//
//       if(err){ next(err); }
//       else {
//         req.currentUser = user;
//         next();
//       }
//     });
//   } else {
//     next();
//   }
// });


app.use('/recordings', recordings);
app.use('/notifications', notifications);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (true || app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

setInterval(function checkRecordings() {
  console.log("~~~~~~~~Let's check")
  Device.find({}).exec()
  .then(function(devices){
    console.log("~~~~~~~~Devices " + devices)
      _.each(devices,function(device){
        Recording.findOne({device: device}).sort('-recordedAt').exec()
        .then(function(recording){
          console.log("~~~~~~~~Recording " + recording)
          if(!recording) {
            require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD).send({
              to:       ['cody@gunnertech.com','hozencool@gmail.com'],
              from:     'no-reply@dropmic.com',
              subject:  'Error: No recordings received',
              text:     'Device with mac address: ' + device.mac + ' has not sent a recording yet.'
            }, function(err, json) {
              if (err) { return console.error(err); }
              console.log(json);
            });
            
          } else {
            var now = new Date();
            var diffMs = (now - recording.recordedAt); // milliseconds
            var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
            
            console.log("~~~~~~~~minutes " + diffMins)
            
            if(diffMins > 5) {
              Notification.create({
                notificationValue: diffMinutes.toString(),
                notificationSubject: 'Warning: No recent recordings received',
                notificationMessage: 'Device with mac address: ' + device.mac + ' has not sent a recording in the past ' + diffMins + ' minutes.',
                recordedAt: now,
                device: device
              });
            }
          }
        });
      });
  })
  
  return checkRecordings;
}(),300000)

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });

mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/dropmic');


module.exports = app;
