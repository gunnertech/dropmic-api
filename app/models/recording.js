var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var schema  = new Schema({
  deviceState: {type: String},
  levelState: {type: String},
  dbValue: {type: Number, required: true},
  recordedAt: {type: Date, required: true},
  device: {type: Schema.Types.ObjectId, ref: 'Device', required: true}
},{timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }});


module.exports = mongoose.model('Recording', schema);