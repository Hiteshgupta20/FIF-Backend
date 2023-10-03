var mongoose = require('../config/db')
var Schema = mongoose.Schema;

var commentsSchema = new Schema({
    commentId: Number,
    sourceId: {type: Schema.ObjectId, ref: 'newsAndPromo'},
    commentText : String,
    insertDate: Date,
    insertBy : Number

},{strict : false});

var Comments = mongoose.model('comments', commentsSchema);
module.exports = Comments;

