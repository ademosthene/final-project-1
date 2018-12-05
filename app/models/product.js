// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var productSchema = mongoose.Schema({

    name : String,
    description : String,
    img : String,
    tags : [String],
    medium : String,
    type : String,
    price : Number,
    artist : { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Product', productSchema);
