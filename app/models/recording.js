var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var schema  = new Schema({
  db: {type: Float, required: true},
  recordedAt: {type: Date, required: true},
  device: {type: Schema.Types.ObjectId, ref: 'Device'}
},{timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }});


module.exports = mongoose.model('Recording', schema);