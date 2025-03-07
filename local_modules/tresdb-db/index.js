// Singleton wrapper around mongodb

var config = require('tresdb-config');
var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;

var dbClient = null;

exports.INDICES = require('./indices');

exports.id = function (k) {
  return new ObjectId(k);
};

exports.init = function (mongoUrl, callback) {
  // Usage:
  //   db.init(function (err) {
  //     if (err) ...
  //     db.get().collection('mydocs').find()...
  //   });
  //
  // Parameters:
  //   mongoUrl
  //     optional connection url. If not given, config.env is used to determine
  //     which url to use.
  //   callback
  //     function (err)

  if (dbClient !== null) {
    return;
  }

  if (typeof mongoUrl === 'function') {
    callback = mongoUrl;

    if (config.env === 'test') {
      mongoUrl = config.mongo.testUrl;
    } else {
      mongoUrl = config.mongo.url;
    }
  }

  var mongoOpts = {
    // Use new server discovery and monitoring engine
    // instead of the deprecated one. Becomes the default in the future.
    useUnifiedTopology: true,
  };

  mongoClient.connect(mongoUrl, mongoOpts, function (dbErr, connectedClient) {
    if (dbErr) {
      return callback(dbErr);
    }

    dbClient = connectedClient;
    return callback();
  });

};

exports.get = function () {
  // Return
  //   connected mongodb database instance

  if (dbClient !== null) {
    return dbClient.db();
  }

  throw new Error('db.init must be called and finished before db.get');
};

exports.collection = function (collName) {
  // Return
  //   a MongoDB collection instance

  if (dbClient !== null) {
    return dbClient.db().collection(collName);
  }

  throw new Error('db.init must be called and finished before db.collection');
};

exports.close = function () {
  if (dbClient !== null) {
    dbClient.close();
    dbClient = null;
  }
};
