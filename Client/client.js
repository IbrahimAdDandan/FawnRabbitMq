var amqp = require('amqplib/callback_api');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
      ch.assertQueue('', {
        exclusive: true
      }, function (err, q) {
        var corr = generateUuid();
        var num = "get request";
        console.log(' [x] Requesting fib(%s)', num);

        ch.consume(q.queue, function (msg) {
          if (msg.properties.correlationId == corr) {
            msg1 = JSON.parse(msg.content.toString());
            console.log(' [.] Got ' + msg1);
            res.status(parseInt(msg1.status)).json(msg1.result);
          }
        }, {
          noAck: true
        });

        ch.sendToQueue('rpc_queue',
          new Buffer(num.toString()), {
            correlationId: corr,
            replyTo: q.queue
          });
      });
    });
  });
});

app.post('/', function (req, res) {
  var answer = {
    is_accepted: req.body.is_accepted || false,
    score: req.body.score,
    content: req.body.content
  };
  amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
      ch.assertQueue('', {
        exclusive: true
      }, function (err, q) {
        var corr = generateUuid();
        console.log(' [x] Requesting' + answer);

        ch.consume(q.queue, function (msg) {
          if (msg.properties.correlationId == corr) {
            msg1 = JSON.parse(msg.content.toString());
            console.log(' [.] Got ' + msg1);
            res.status(parseInt(msg1.status)).json(msg1.result);
          }
        }, {
          noAck: true
        });

        ch.sendToQueue('rpc_queue1',
          new Buffer(JSON.stringify(answer)), {
            correlationId: corr,
            replyTo: q.queue
          });
      });
    });
  });
});

app.listen(3000, () => {
  console.log('Client started on port 3000...');
});

function generateUuid() {
  return Math.random().toString() +
    Math.random().toString() +
    Math.random().toString();
}