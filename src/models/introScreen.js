var mongoose = require('../config/db')
var Schema = mongoose.Schema;

var screenSchema = new Schema({
    screenId: Number,
    sno : {type: Number, unique: true},
    title : String,
    imageURL : String,
    imageDesc : String,
    status : Number,
    insertDate :Date,
    insertBy : Number,
    lastModifiedDate : Date,
    lastModifiedBy : Number

},{strict : false});

var IntroScreen = mongoose.model('introScreen', screenSchema);
module.exports = IntroScreen;

