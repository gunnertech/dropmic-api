var express = require('express');
var router = express.Router();
var User = require('../app/models/user');
var _ = require('lodash');
var jwt = require("jsonwebtoken");
var sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY)
var uuid = require('node-uuid')

/* GET users listing. */
router.get('/', function(req, res, next) {
  var params = {};
  
  if(req.query) {
    params = req.query;
    
    delete params.token;
  }
  
  
  User.find(params,function(err, users) {
    if (err) { return res.send(err); }

    return res.format({
      json: function() {
        return res.json(users);
        
      }
    });
  });
});

router.get('/:user_id/password_reset/:reset_token', function(req, res) {
  User.findById(req.params.user_id, function(err, user) {
      if (err) { console.log(err); }

      if (user && user.compareResetTokenValidity(req.params.reset_token)) {
        return res.redirect(user.resetPasswordFrom + "://password_reset/" + req.params.user_id + "/" + req.params.reset_token);
      } else {
        return res.status(404).send("Not Found");
      }
  });
});

router.post('/:user_id/password_reset/:reset_token', function(req, res) {
  User.findById(req.params.user_id, function(err, user) {
      if (err) return res.send(err);

      if (user && user.compareResetTokenValidity(req.params.reset_token)) {
        user.password = req.body.new_password;
        user.resetPasswordInitOn = new Date(0)

        user.save(function(err) {
          if (err) { return res.status(400).end() }

          return res.status(200).end();
        });
      } else {
        return res.status(404).end()
      }
  });
});

router.post('/password_reset', function(req, res) {
  User.findOne({ 'email': req.body.email }, function(err, user) {
    if (err) { return res.send(err) }

    var app = req.body.app.toLowerCase()
    if (app === 'iarmor') {
      from = 'no-reply@iArmor.com'
    } else if (app === 'ipolish') {
      from = 'no-reply@iPolish.xyz'
    } else {
      return res.status(400).send('Must specify which app')
    }

    var email = new sendgrid.Email({
      to: req.body.email,
      from: from,
      subject: 'Forgot Password'
    });

    if (user) {
      user.resetPasswordToken = uuid.v4()
      user.resetPasswordInitOn = Date()
      user.resetPasswordFrom = app
      user.save(function(err) {
        if (err) console.log(err)
      });

      email.html = 'Did you forget your password? <a href="' + req.headers.host + '/users/' + user.id + '/password_reset/' + user.resetPasswordToken +  '">Click this link to reset your password</a> - Please note this link will expire in 1 hour. If you did not request this email please disregard it.'
    } else {
      email.text = "We are sorry, but that email is not in our records. Perhaps you typed in the wrong email? If not, we would love to see you make an account of your own!"
    }

    sendgrid.send(email, function(err, json) {
      if (err) {
        console.log(err)
        return res.status(500).end()
      }

      return res.status(200).end()
    });

    return res.status(200).end()
  });
});

router.get('/:user_id', function(req, res) {
  User.findById(req.params.user_id, function(err, user) {
      if (err) return res.send(err);
      return res.format({
        json: function(){
          return res.json(store);
        }
      });
    });
});

router.delete('/:user_id', function(req, res) {
  User.findByIdAndRemove(req.params.user_id, function(err) {
    if (err){  return res.send(err); }

    return res.format({
      json: function(){
        return res.json({});
      }
    });

  });

});

router.put('/:user_id', function(req, res) {
  User.findOneAndUpdate({_id: req.params.user_id}, (req.body.user || req.body), function(err, user) {
      if (err){ console.log(err); return res.status(500).send(err); }
      
      return res.format({
        json: function(){
          return res.json("OK"); 
        }
      });
    });
});

router.post('/', function(req, res) {
  
  console.log("WHY THIS???");
  var user = new User();
  
  
  _.assign(user, req.body.user || req.body);
  
  user.token = jwt.sign(user, process.env.JWT_SECRET);

  user.save(function(err) {
    
    if (err) { console.log(err); return res.status(500).json(err); }
    
    return res.format({
      json: function(){
        var response = {}
        _.assign(response, user._doc);
        return res.json(response);
      }
    });
  });
});

router.post('/login', function(req, res) {
  console.log("LOGGIN IN")
  console.log(req)
  User.findById(req.params._id, function(err, user) {
    return res.format({
      json: function(){
        if(user.facebookId == req.params.facebookId) {
          user.token = jwt.sign(user, process.env.JWT_SECRET);
          user.save(function(err, user1) {
            var response = {}
            _.assign(response, user._doc);
            return res.json(response);
          });
        } else {
          return res.status(400).json({message: "Invalid Username or Password"});
        }
      }
    });
  })
});

module.exports = router;
