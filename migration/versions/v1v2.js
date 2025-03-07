var iter = require('../iter');
var schema = require('../lib/schema');
var db = require('tresdb-db');

var LNG_MAX = 180;
var LNG_MIN = -180;
var LAT_MAX = 90;
var LAT_MIN = -90;

exports.run = function (callback) {
  // Parameters
  //   db
  //     Monk db instance
  //   callback
  //     function (err)

  console.log();
  console.log('### Step v1 to v2 ###');

  // 1. Create schema version tag
  console.log('Creating schema version tag...');

  schema.setVersion(2, function (err) {
    if (err) {
      return callback(err);
    }  // else
    console.log('Schema version tag created.');

    // 2. Transform locations to have a geometry in GeoJSON
    console.log('Transforming locations to have GeoJSON geometry...');

    var locsColl = db.collection('locations');

    iter.updateEach(locsColl, function (loc, next) {

      // MongoDB requires coordinates to be in valid ranges.
      // Let us mod them between.
      loc.lng = ((loc.lng + LNG_MAX) % (LNG_MAX - LNG_MIN)) + LNG_MIN;
      loc.lat = ((loc.lat + LAT_MAX) % (LAT_MAX - LAT_MIN)) + LAT_MIN;

      loc.geom = {
        type: 'Point',
        coordinates: [loc.lng, loc.lat],
      };
      delete loc.lng;
      delete loc.lat;

      return next(null, loc);
    }, function (err2) {
      if (err2) {
        return callback(err2);
      }  // else
      console.log('Locations transformed.');

      // 3. Create 2dsphere index
      console.log('Creating 2dsphere index for locations...');

      locsColl.createIndex({ 'geom': '2dsphere' }, function (err3) {
        if (err3) {
          return callback(err3);
        }

        console.log('Index created.');
        console.log('### Step successful ###');

        return callback(null);
      });

    });
  });

};
