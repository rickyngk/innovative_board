var express = require('express');
var app = express();
var bodyParser = require('body-parser')

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/', function (req, res) {
    res.redirect("index.html");
});

app.use(express.static('./dist'));

var server = app.listen(8080, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});
