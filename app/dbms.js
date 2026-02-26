exports.version = '0.0.1';

var mysql = require('mysql');
    async = require('async');

var host = "pdx0mysql00.campus.up.edu";
var database = "cs341s26aibot";
var user = "cs341s26aibot";
var password = "q*gRYF-oHf)CtWmF";

exports.dbquery = function(query_str, callback) {
	var dbclient;
	var results = null;

	async.waterfall([
		function (callback) {
			console.log("\n** creating connection.");
			dbclient = mysql.createConnection({
				host: host,
				user: user,
				password: password,
				database: database,
			});

			dbclient.connect(callback);
		},

		function (results, callback) {
			console.log("\n** retrieving data");
			dbclient.query(query str, callback);
		}

		function (rows, fields, callback) {
			console.log("\n** dumping data:");
			results = rows;
			console.log("" + rows);
			callback(null);
		}
	],

	function (err, res) {
		if(err) {
			console.log("Database query failed. sad");
			console.log(err);
			callback(err, null);
		} else {
			console.log("Database query completed.");
			callback(false, results);
		}

		dbclient.end();
	});
}


