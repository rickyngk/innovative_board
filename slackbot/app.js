var express = require('express');
var cors = require('cors')
var bodyParser = require('body-parser');
var app = express();
var port = 4000;
var bot__new_idea = require('./ib_bot__new_idea');
var bot__notif = require('./ib_bot__notif');

var whitelist = ['http://localhost:3000', 'http://iamprogrammer.work:8080', 'https://ib-slack.firebaseapp.com'];
var corsOptions = {
    origin: function(origin, callback){
        var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
        callback(null, originIsWhitelisted);
    }
};

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// test route
app.get('/', function (req, res) { res.status(200).send('Hello world!') });
app.post('/idea', bot__new_idea);
app.post('/notif', cors(corsOptions), bot__notif);

// error handler
app.use(function (err, req, res, next) {
    if (err) {
        console.error(err.stack);
        res.status(400).send(err.message);
    }
    next();
});

app.listen(port, function () {
    console.log('Slack bot listening on port ' + port);
});
