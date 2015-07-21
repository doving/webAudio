var database = null;

var MongoClient = require('./').MongoClient;

function connect_to_mongo(callback) {
  if (database != null) {
    callback(null, database);
  } else {
    var connection = "mongodb://127.0.0.1:27017/test_db";
    MongoClient.connect(connection, {
      server : {
        reconnectTries : 5,
        reconnectInterval: 1000,
        autoReconnect : true
      }
    }, function (err, db) {
      database = db;
      callback(err, db);
    });
  }
}

function log(message) {
  console.log(new Date(), message);
}

var queryNumber = 0;

function make_query(db) {
  var currentNumber = queryNumber;
  ++queryNumber;
  log("query " + currentNumber + ": started");
  
  setTimeout(function() {
      make_query(db);
  }, 5000);
  
  var collection = db.collection('test_collection');
  collection.findOne({},
    function (err, result) {
      if (err != null) {
        log("query " + currentNumber + ": find one error: " + err.message);
        return;
      }
      log("query " + currentNumber + ": find one result: " + result);
    }
  );
}

connect_to_mongo(
  function(err, db) {
    if (err != null) {
      log(err.message);
      return;
    }

    make_query(db);
  }
);
