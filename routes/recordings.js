var express = require('express');
var router = express.Router();
var Recording = require('../app/models/recording');
var Device = require('../app/models/device');

var findOrCreateDevice = function (req, res, next) {
  if(req.body && req.body.mac) {
    Device.find({mac: req.body.mac}).exec()
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


router.post('/', function(req, res) {
  console.log(req.body)
  Recording.create(req.body)
  .then(function(recording){
      res.json(recording);
  })
  .then(undefined, function (err) {
    console.log(err)
    res.status(500).json(err)
  });
});

module.exports = router;
