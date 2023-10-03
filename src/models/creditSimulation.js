var mongoose = require('../config/db');
var Schema = mongoose.Schema;


var creditSimulationSchema = new Schema({
    creditSimulationId: Number,
    productType : {type: Schema.ObjectId, ref: 'creditProducts'},
    termOfPayment : Array,
    rate: Number,
    downPayment: Number,
    status: Number,
    insertDate : Date,
    insertBy: Number,
    lastModifiedDate: Date,
    lastModifiedBy: Number

},{strict : false});


var CreditSimulation = mongoose.model('creditSimulation', creditSimulationSchema);
module.exports = CreditSimulation;

