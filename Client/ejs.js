var amqp = require('amqplib/callback_api');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

/*
var args = process.argv.slice(2);

if (args.length == 0) {
  console.log("Usage: rpc_client.js num");
  process.exit(1);
}
*/
app.get('/', function (req, res) {
  amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
      ch.assertQueue('', {
        exclusive: true
      }, function (err, q) {
        var corr = generateUuid();
        //var num = parseInt(args[0]);
        var num = "get request";
        console.log(' [x] Requesting fib(%s)', num);

        ch.consume(q.queue, function (msg) {
          if (msg.properties.correlationId == corr) {
            msg1 = JSON.parse(msg.content.toString());
            console.log(' [.] Got ' + msg1);
            //setTimeout(function() { conn.close(); process.exit(0); }, 500);
            //res.status(parseInt(msg1.status)).json(msg1.result);
            if (parseInt(msg1.status) == 200) {
              res.render('index', {
                results: msg1.result
              });
            }
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

app.post('/add', function (req, res) {
  var answer = {
    is_accepted: req.body.is_accepted? true : false,
    score: parseInt(req.body.score),
    content: req.body.content
  };
  amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
      ch.assertQueue('', {
        exclusive: true
      }, function (err, q) {
        var corr = generateUuid();
        //var num = parseInt(args[0]);
        console.log(' [x] Requesting' + answer);

        ch.consume(q.queue, function (msg) {
          if (msg.properties.correlationId == corr) {
            msg1 = JSON.parse(msg.content.toString());
            console.log(' [.] Got ' + msg1);
            //setTimeout(function() { conn.close(); process.exit(0); }, 500);
            //res.status(parseInt(msg1.status)).json(msg1.result);
            res.redirect('/');
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

app.listen(3001, () => {
  console.log('Ejs Client started on port 3001...');
});

function generateUuid() {
  return Math.random().toString() +
    Math.random().toString() +
    Math.random().toString();
}