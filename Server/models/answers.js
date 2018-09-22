var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var answers = mongoose.Schema({
    is_accepted: {
        type: Boolean
    },
    score: {
        type: Number
    },
    content: {
        type: String
    },
    creation_date: {
        type: Date,
        "default": Date.now
    }
});

mongoose.model('answers', answers);