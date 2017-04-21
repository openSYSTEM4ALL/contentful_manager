"use strict";

var express = require('express');
var path = require('path');

var server = express();
server.use(express.static(__dirname));


server.listen(process.env.PORT || 1004, function () {
    console.log("ready on 1004");
});

//server.set('views', path.join(__dirname, 'views'));
server.set('images', path.join(__dirname, 'images'));

//server.use(require('./index'));

var router = express.Router();
router.get('/', function (req, res) {
    res.render('./index.html');
});

module.exports = router;