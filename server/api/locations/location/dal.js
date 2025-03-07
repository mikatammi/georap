/* eslint-disable max-lines */

var db = require('tresdb-db');
var proj = require('../../../services/proj');
var googlemaps = require('../../../services/googlemaps');
var eventsDal = require('../../events/dal');

exports.changeGeom = function (params, callback) {
  // Change geom but do not recompute layer.
  //
  // Parameters:
  //   params
  //     locationId
  //       ObjectId
  //     locationName
  //       string
  //     locationGeom
  //       GeoJSON Point
  //     locationLayer
  //       integer
  //     username
  //       string
  //     latitude
  //       number
  //     longitude
  //       number
  var lat = params.latitude;
  var lng = params.longitude;

  googlemaps.reverseGeocode([lat, lng], function (err, newPlaces) {
    // Places is an array of strings
    if (err) {
      return callback(err);
    }

    var newGeom = {
      type: 'Point',
      coordinates: [lng, lat],  // note different order to google
    };

    // Find new layer or do not find new layer?
    // Do not. Because findLayerForPoint picks the highest layer number,
    // i.e. the bottommost empty layer. A single move of loc with low layer
    // number would hide it from global navigation if new layer is searched
    // for. So we do not find new layer here but use the same layer as
    // before.

    var locColl = db.collection('locations');
    var q = { _id: params.locationId };

    var u = {
      $set: {
        geom: newGeom,
        places: newPlaces,
        layer: params.locationLayer,
      },
    };

    locColl.updateOne(q, u, function (err2) {
      if (err2) {
        return callback(err2);
      }

      var oldGeom = params.locationGeom;

      eventsDal.createLocationGeomChanged({
        locationId: params.locationId,
        locationName: params.locationName,
        username: params.username,
        newGeom: newGeom,
        oldGeom: oldGeom,
      }, function (err3) {
        if (err3) {
          return callback(err3);
        }

        return callback();
      });
    });  // updateOne
  });  // reverseGeocode
};

exports.changeName = function (params, callback) {
  // Parameters
  //   params
  //     locationId
  //     locationName
  //     newName
  //     username
  //

  var locColl = db.get().collection('locations');

  var q = { _id: params.locationId };
  var u = { $set: { name: params.newName } };

  locColl.updateOne(q, u, function (err) {
    if (err) {
      return callback(err);
    }

    var oldName = params.locationName;

    eventsDal.createLocationNameChanged({
      locationId: params.locationId,
      locationName: params.locationName,
      username: params.username,
      newName: params.newName,
      oldName: oldName,
    }, function (err2) {
      if (err2) {
        return callback(err2);
      }

      return callback();
    });
  });
};

exports.changeStatus = function (params, callback) {
  // Parameters:
  //   params
  //     locationId
  //     locationName
  //     locationStatus
  //       string, old status
  //     username
  //       string
  //     status
  //       string, new status
  //   callback
  //     function (err)

  var locColl = db.get().collection('locations');

  var q = { _id: params.locationId };
  var newStatus = params.status;
  var u = { $set: { status: newStatus } };

  locColl.updateOne(q, u, function (err) {
    if (err) {
      return callback(err);
    }

    var oldStatus = params.locationStatus;

    eventsDal.createLocationStatusChanged({
      locationId: params.locationId,
      locationName: params.locationName,
      username: params.username,
      newStatus: newStatus,
      oldStatus: oldStatus,
    }, function (err2) {
      if (err2) {
        return callback(err2);
      }

      return callback();
    });
  });
};

exports.changeType = function (params, callback) {
  // Parameters:
  //   params
  //     locationId
  //     locationName
  //     locationType
  //       string, old type
  //     username
  //       string
  //     type
  //       string, new type
  //   callback
  //     function (err)

  var locColl = db.get().collection('locations');

  var q = { _id: params.locationId };
  var newType = params.type;
  var u = { $set: { type: newType } };

  locColl.updateOne(q, u, function (err) {
    if (err) {
      return callback(err);
    }

    var oldType = params.locationType;

    eventsDal.createLocationTypeChanged({
      locationId: params.locationId,
      locationName: params.locationName,
      username: params.username,
      newType: newType,
      oldType: oldType,
    }, function (err2) {
      if (err2) {
        return callback(err2);
      }

      return callback();
    });
  });
};

exports.getRaw = function (id, callback) {
  // Get single location without events and entries
  //
  // Parameters:
  //   id
  //     ObjectId
  //   callback
  //     function (err, loc)
  //       err null and loc null if no loc found
  //

  var locColl = db.get().collection('locations');

  locColl.findOne({ _id: id }, function (err, doc) {
    if (err) {
      return callback(err);
    }

    if (!doc) {
      return callback(null, null);
    }

    return callback(null, doc);
  });
};

exports.getOne = function (id, callback) {
  // Get single location with additional cooridinate systems, events,
  // and entries.
  //
  // Parameters:
  //   id
  //     ObjectId
  //   callback
  //     function (err, loc)
  //       err null and loc null if no loc found
  //

  var locColl = db.get().collection('locations');
  var evColl = db.get().collection('events');
  var enColl = db.get().collection('entries');

  locColl.findOne({ _id: id }, function (err, doc) {
    if (err) {
      return callback(err);
    }

    if (!doc) {
      return callback(null, null);
    }

    var q = { locationId: id };
    var opt = { sort: { time: -1 } };
    evColl.find(q, opt).toArray(function (err2, docs) {
      if (err2) {
        return callback(err2);
      }

      doc.events = docs;

      enColl.find(q, opt).toArray(function (err3, docs2) {
        if (err3) {
          return callback(err3);
        }

        doc.entries = docs2;

        // Compute additional coodinate systems
        doc.altGeom = proj.getAltPositions(doc.geom.coordinates);

        return callback(null, doc);
      });
    });
  });
};

exports.removeOne = function (id, username, callback) {
  // Remove single location
  //
  // Parameters:
  //   id
  //     ObjectId
  //   username
  //     string
  //   callback
  //     function (err)
  //

  var coll = db.get().collection('locations');

  // Prevent deletion of already deleted location.
  var q = {
    _id: id,
    deleted: false,
  };
  var u = {
    $set: {
      deleted: true,
    },
  };

  coll.findOneAndUpdate(q, u, function (err, result) {
    if (err) {
      return callback(err);
    }

    if (result.value === null) {
      // Already deleted or not found at all. Success but no event.
      return callback();
    }

    var loc = result.value;

    eventsDal.createLocationRemoved({
      locationId: loc._id,
      locationName: loc.name,
      username: username,
    }, callback);
  });
};
