var mongoose = require('../config/db');
var Schema = mongoose.Schema;

var creditRowsSchema = new Schema({
    type: Number, //0 for free text, 1 for dropdown
    data :Array,
    label: String,
    apiKey: String

},{strict : false});

var creditTitleSchema = new Schema({
    name: String,
    rows : [creditRowsSchema]

},{strict : false});

var creditProductsSchema = new Schema({
    creditProductId: Number,
    name :String,
    imageUrl : String,
    titles: [creditTitleSchema],
    status: Number,
    insertDate : Date,
    insertBy: Number,
    lastModifiedDate: Date,
    lastModifiedBy: Number,
    webviewUrl: String,
    isWebviewUrl: Boolean

},{strict : false});


var CreditProducts = mongoose.model('creditProducts', creditProductsSchema);
module.exports = CreditProducts;

