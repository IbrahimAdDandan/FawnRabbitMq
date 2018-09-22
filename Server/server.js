var amqp = require('amqplib/callback_api');
require('./models/db');
var mongoose = require('mongoose');
var answers = mongoose.model('answers');
var Logs = mongoose.model('Logs');
var Fawn = require("fawn");

Fawn.init(mongoose);

amqp.connect('amqp://localhost', function (err, conn) {
  conn.createChannel(function (err, ch) {
    var q = 'rpc_queue';
    var q1 = 'rpc_queue1';

    ch.assertQueue(q, {
      durable: false
    });
    ch.assertQueue(q1, {
      durable: false
    });
    ch.prefetch(1);
    console.log(' [x] Awaiting RPC requests');
    ch.consume(q, function reply(msg) {
      var r = {
        "status": 200,
        "result": ''
      };
      answers.find((err, res) => {
        if (err) {
          r.status = 500;
          r.result = err;
        } else if (res.length == 0) {
          r.status = 404;
          r.result = "No content found";
        } else {
          r.status = 200;
          r.result = res;
        }
        ch.sendToQueue(msg.properties.replyTo,
          new Buffer(JSON.stringify(r)), {
            correlationId: msg.properties.correlationId
          });
      });
      
      ch.ack(msg);
    });
    ch.consume(q1, function reply(msg) {
      var r = {
        "status": 201,
        "result": {}
      };
      msg1 = JSON.parse(msg.content.toString());
      var answer = new answers(msg1);
      var task = Fawn.Task();
      var l = {
        action: "POST Request: Adding answer."
      };
      var logs = new Logs(l);
      task.save(Logs, logs)
      .save(answers, answer)
      .run()
      .then(function(results){
        // task is complete 
        r.status = 201;
        r.result = results;
        ch.sendToQueue(msg.properties.replyTo,
          new Buffer(JSON.stringify(r)), {
            correlationId: msg.properties.correlationId
          });
      })
      .catch(function(err){
        // Everything has been rolled back.
        r.status = 400;
        r.result = err;
        // log the error which caused the failure
        console.log(err);
        ch.sendToQueue(msg.properties.replyTo,
          new Buffer(JSON.stringify(r)), {
            correlationId: msg.properties.correlationId
          });
      });
      ch.ack(msg);
    });
  });
});