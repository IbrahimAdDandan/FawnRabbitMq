var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var logs = mongoose.Schema({
    action: {
        type: String
    },
    creation_date: {
        type: Date,
        "default": Date.now
    }
});

mongoose.model('Logs', logs);