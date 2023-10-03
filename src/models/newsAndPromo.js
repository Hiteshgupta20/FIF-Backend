var mongoose = require('../config/db');
var Schema = mongoose.Schema;


var newsAndPromoSchema = new Schema({
    newsPromoId: Number,
    title :String,
    type : Number,
    shortDesc : String,
    longDesc : String,
    listImageUrl: String,
    imageUrl : Array,
    videoUrl : Array,
    status : Number,
    publishDate :Date,
    expiryDate :Date,
    priority: {type: Number},
    sendNotification: Array,
    comments: String,
    downPayment: Number,
    monthlyInstallment: Number,
    durationInstallment: Number,
    viewCount: { type: Number, default: 0},
    commentCount: { type: Number, default: 0},
    insertDate: Date,
    insertBy : Number,
    lastModifiedDate : Date,
    lastModifiedBy : Number

},{strict : false});


var NewsAndPromo = mongoose.model('newsAndPromo', newsAndPromoSchema);

module.exports = NewsAndPromo;

