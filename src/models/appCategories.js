var mongoose = require('../config/db');
var Schema = mongoose.Schema;


var appCategoriesSchema = new Schema({
    categoryId: Number,
    categoryName :String
},{strict : false});


var AppCategories = mongoose.model('appCategories', appCategoriesSchema);
module.exports = AppCategories;

