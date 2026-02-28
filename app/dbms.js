/**
 * dbms.js
 *
 * This file contains functions for accessing the MySQL database
 * which contains the Cheesecake order data.
 *
 */

exports.version = '0.0.1';

var mysql = require('mysql'),
    async = require('async');

var host = "pdx0mysql00.campus.up.edu";
var database = "cs341s26aibot";
var user = "cs341s26aibot";
var password = "q*gRYF-oHf)CtWmF";

/**
 * dbquery
 *
 * performs a given SQL query on the database and returns the results
 * to the caller
 *
 * @param query     the SQL query to perform (e.g., "SELECT * FROM ...")
 * @param callback  the callback function to call with two values
 *                   error - (or 'false' if none)
 *                   results - as given by the mysql client
 */
exports.dbquery = function (query_str, params, callback) {
    var dbclient;
    var results = null;

    // Allow function to be called with 2 arguments (query, callback)
    if (typeof params === "function") {
        callback = params;
        params = [];
    }

    async.waterfall([

        // Step 1: Connect to the database
        function (cb) {
            console.log("\n** creating connection.");
            dbclient = mysql.createConnection({
                host: host,
                user: user,
                password: password,
                database: database,
            });

            dbclient.connect(cb);
        },
            dbclient.connect(cb);
        },

        // Step 2: Issue query
        function (_, cb) {  // previous results ignored
            console.log("\n** retrieving data");
            dbclient.query(query_str, params, cb);  // <-- pass params here
        },

        // Step 3: Collect results
        function (rows, fields, cb) {
            console.log("\n** dumping data:");
            results = rows;
            console.log("" + rows);
            cb(null);
        }

    ],
        // waterfall cleanup function
        function (err, res) {
            if (err) {
                console.log("Database query failed. sad");
                console.log(err);
                callback(err, null);
            } else {
                console.log("Database query completed.");
                callback(false, results);
            }

            // Close connection
            dbclient.end();
        });

}; //function dbquery