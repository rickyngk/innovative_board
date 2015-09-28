var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var port = process.env.PORT || 4000;
var bot__new_idea = require('./ib_bot__new_idea');
var bot__notif = require('./ib_bot__notif');

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000, http://iamprogrammer.work:8080, http://www.iamprogrammer.work:8080, https://ib-slack.firebaseapp.com");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// test route
app.get('/', function (req, res) { res.status(200).send('Hello world!') });
app.post('/idea', bot__new_idea);
app.post('/notif', bot__notif);

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
