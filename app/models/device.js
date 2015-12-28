var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var schema  = new Schema({
  mac: {type: String, required: true}
},{timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }});


module.exports = mongoose.model('Device', schema);