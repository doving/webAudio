var settings = require('../settings');
var db = require('mongodb').Db;
var connection = require("mongodb").Connection;
var server = require("mongodb").Server;

module.exports = new db(
	settings.db, 
	new server(settings.host, connection.DEFAULT_PORT, {}),
	{safe: true}
);