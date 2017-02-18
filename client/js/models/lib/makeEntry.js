// Abstract Entry model initializer
//
// Usage:
//   var MyEntry = function (rawEntry, location) {
//     makeEntry(this, rawEntry, location);
//     ...
//   };
//

var emitter = require('component-emitter');

module.exports = function (context, rawEntry, location) {
  // Parameters:
  //   context
  //     the "this" context of the inheriting object
  //   rawEntry
  //     plain content entry object
  //   location
  //     models.Location instance. Work as a parent of the entry.

  emitter(context);

  context.getId = function () {
    return rawEntry._id;
  };

  context.getType = function () {
    return rawEntry.type;
  };

  context.getTime = function () {
    return rawEntry.time;
  };

  context.getUserName = function () {
    return rawEntry.user;
  };

  context.getLocation = function () {
    // Return models.Location instance
    return location;
  };

  context.remove = function (callback) {
    // Remove entry from the backend
    //location.removeEntry(rawEntry._id, callback);
    return callback();
  };
};
