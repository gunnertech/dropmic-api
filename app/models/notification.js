var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var schema  = new Schema({
  notificationValue: {type: String, required: true},
  notificationSubject: {type: String, required: true},
  notificationMessage: {type: String, required: true},
  recordedAt: {type: Date, required: true},
  device: {type: Schema.Types.ObjectId, ref: 'Device', required: true}
},{timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }});

schema.post('save', function(doc) {
  
  require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD).send({
    to:       ['cody@gunnertech.com','hozencool@gmail.com'],
    from:     'no-reply@dropmic.com',
    subject:  doc.notificationSubject,
    text:     doc.notificationMessage
  }, function(err, json) {
    if (err) { return console.error(err); }
    console.log(json);
  });
  
});


module.exports = mongoose.model('Notification', schema);