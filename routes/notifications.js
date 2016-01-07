var express = require('express');
var router = express.Router();
var Notification = require('../app/models/notification');
var Device = require('../app/models/device');

var findOrCreateDevice = function (req, res, next) {
  if(req.body && req.body.mac) {
    Device.findOne({mac: req.body.mac}).exec()
    .then(function(device){
      if(device) {
        req.body.device = device;
        delete req.body.mac;
        next();
      } else {
        Device.create({mac: req.body.mac})
        .then(function(device){
          req.body.device = device;
          delete req.body.mac;
          next();
        })
      }
    })
  } else {
    next();
  }
};


router.post('/', [findOrCreateDevice,function(req, res) {
  console.log(req.body)
  Notification.create(req.body)
  .then(function(notification){
    console.log(notification);
    res.json(notification);
  })
  .then(undefined, function (err) {
    console.log(err)
    res.status(500).json(err)
  });
}]);

module.exports = router;
