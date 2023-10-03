var mongoose = require('../config/db');
var Schema = mongoose.Schema;


var appsCenterSchema = new Schema({
    appId: Number,
    name :String,
    description : String,
    category: {type: Schema.ObjectId, ref: 'appCategories'},
    subCategories: [],
    url : String,
    packageName : String,
    appUrl : String,
    icon : String,
    status : Number,
    insertDate : Date,
    sequenceNo : {type: Number}
},{strict : false});


var AppsCenter = mongoose.model('appsCenter', appsCenterSchema);
module.exports = AppsCenter;

