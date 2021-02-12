/* eslint-disable max-lines,no-magic-numbers */

const db = require('tresdb-db');
const eventsDal = require('../events/dal');
const path = require('path');
const _ = require('lodash');
const purifyMarkdown = require('purify-markdown');

// Private methods

const insertOne = (entry, callback) => {
  // Parameters:
  //   entry
  //     raw entry to insert
  //   callback
  //     function (err, entryId);
  const coll = db.collection('entries');

  coll.insertOne(entry, (err, result) => {
    if (err) {
      return callback(err);
    }
    return callback(null, result.insertedId);
  });
};

const removeOne = (entryId, callback) => {
  // Parameters
  //   entryId
  //     object id
  //   callback
  //     function (err)

  const coll = db.get().collection('entries');
  const q = { _id: entryId };

  coll.deleteOne(q, {}, (err) => {
    if (err) {
      return callback(err);
    }
    return callback();
  });
};


// Public methods

exports.changeLocationEntry = (params, callback) => {
  // Modify entry markdown, attachments, or flags.
  //
  // Parameters:
  //   params:
  //     oldEntry
  //       raw entry object
  //     locationName
  //       because entries dont store location name but events do
  //     delta
  //       object of changed values
  //   callback
  //     function (err)
  //
  const oldEntry = params.oldEntry;
  const coll = db.collection('entries');
  const q = { _id: oldEntry._id };
  const delta = Object.assign({}, params.delta); // keep original intact

  // Sanitize possible markdown
  if ('markdown' in delta) {
    delta.markdown = purifyMarkdown(delta.markdown).trim();
  }

  // Ensure minimal delta by including only values that differ.
  // This step also ensures that forbidden properties have no effect.
  const minDelta = {};
  const original = {};
  if (delta.markdown !== oldEntry.markdown) {
    minDelta.markdown = delta.markdown;
    original.markdown = oldEntry.markdown;
  }
  if (!_.isEqual(delta.attachments, oldEntry.attachments)) {
    minDelta.attachments = delta.attachments;
    original.attachments = oldEntry.attachments;
  }
  if (!_.isEqual(delta.flags, oldEntry.flags)) {
    minDelta.flags = delta.flags;
    original.flags = oldEntry.flags;
  }

  const changedEntry = Object.assign({}, oldEntry, minDelta);

  coll.replaceOne(q, changedEntry, (err) => {
    if (err) {
      return callback(err);
    }

    const eventParams = {
      entryId: oldEntry._id,
      locationId: oldEntry.locationId,
      locationName: params.locationName,
      delta: minDelta,
      original: original,
    };

    eventsDal.createLocationEntryChanged(eventParams, callback);
  });
};

exports.createLocationEntry = (params, callback) => {
  // Parameters:
  //   params:
  //     locationId
  //       ObjectId
  //     locationName
  //       string, for event
  //     username
  //       string
  //     markdown
  //       optional string or null
  //     attachments
  //       optional array of attachment keys
  //     flags
  //       optional array of instance-specific flags e.g. 'visit'
  //   callback
  //     function (err, insertedId)
  //
  const sanitizedMarkdown = purifyMarkdown(params.markdown).trim();

  if (typeof params.markdown !== 'string') {
    params.markdown = '';
  }
  if (typeof params.attachments !== 'object') {
    params.attachments = [];
  }
  if (typeof params.flags !== 'object') {
    params.flags = [];
  }

  const newEntry = {
    type: 'location_entry',
    user: params.username,
    time: db.timestamp(),
    locationId: params.locationId,
    deleted: false,
    published: false,
    markdown: sanitizedMarkdown,
    attachments: params.attachments,
    comments: [],
    flags: params.flags,
  };

  insertOne(newEntry, (err, newEntryId) => {
    if (err) {
      return callback(err);
    }

    newEntry._id = newEntryId;
    const eventParams = {
      locationName: params.locationName,
      newEntry: newEntry,
    };

    eventsDal.createLocationEntryCreated(eventParams, callback);
  });
};


exports.filterUniqueLocationEntries = function (args, callback) {
  // Append given entries into the given location if they do not yet exist.
  //
  // Parameters
  //   args
  //     locationId
  //       ObjectId
  //     entryCandidates
  //       array of objects:
  //         username
  //         markdown
  //         filepath
  //           basename is compared
  //   callback
  //     function (err, uniqueEntries)
  //       err
  //       uniqueEntries
  //         subset of given entryCandidates

  exports.getAllOfLocation(args.locationId, function (err, realEntries) {
    if (err) {
      return callback(err);
    }

    var newEntries = args.entryCandidates.filter(function (ec) {
      // Pass only those entry candidates that differ from every current
      // entry. Entry is different if creator, text, OR file basename differs.
      return _.every(realEntries, function isDifferent(re) {
        // Paths are null for descriptions
        var reBase = re.data.filepath ? path.basename(re.data.filepath) : null;
        var ecBase = ec.filepath ? path.basename(ec.filepath) : null;
        return (re.user !== ec.username ||
                re.data.markdown !== ec.markdown ||
                reBase !== ecBase);
      });
    });

    return callback(null, newEntries);

    // asyn.eachSeries(newEntries, function (ne, next) {
    //   exports.createLocationEntry({
    //
    //   }, next);
    // }, function then(errs) {
    //   if (errs) {
    //     return callback(errs);
    //   }
    //
    //   return callback();
    // });
  });
};


exports.getOneRaw = function (entryId, callback) {
  // Find single entry
  //
  // Parameters:
  //   entryId
  //   callback
  //     function (err, entryDoc)
  //
  var coll = db.collection('entries');
  var q = {
    _id: entryId,
  };

  coll.findOne(q, function (err, doc) {
    if (err) {
      return callback(err);
    }

    if (!doc) {
      return callback(null, null);
    }

    return callback(null, doc);
  });
};


exports.getAllOfLocation = function (locationId, callback) {
  // Get all non-deleted entries of a location, most recent first.
  //
  // Parameters
  //   locationId
  //     object id
  //   callback
  //     function (err, entries)

  var coll = db.collection('entries');
  var q = {
    locationId: locationId,
    deleted: false,
  };
  var opt = { sort: { time: -1 } };

  return coll.find(q, opt).toArray(callback);
};


exports.getAllOfUser = function (username, callback) {
  // Return all non-deleted entries created by user,
  // ordered from oldest to newest.
  //
  // Parameters
  //   username
  //     string
  //   callback
  //     function (err, entries)

  var coll = db.collection('entries');
  var q = {
    user: username,
    deleted: false,
  };

  coll.find(q).sort({ time: 1 }).toArray(callback);
};


exports.removeLocationEntry = function (params, callback) {
  // Parameters:
  //   params
  //     entryId
  //     locationId
  //     locationName
  //     username
  //   callback
  //     function (err)
  //
  removeOne(params.entryId, function (err) {
    if (err) {
      return callback(err);
    }
    eventsDal.createLocationEntryRemoved(params, callback);
  });
};


exports.createLocationEntryComment = function (params, callback) {
  // Parameters:
  //   params
  //     locationId
  //     entryId
  //     locationName
  //     username
  //     message: markdown UTF8 string
  //   callback
  //     function (err)

  var time = db.timestamp();
  var rand1 = Math.random().toString().substr(2, 10);
  var rand2 = Math.random().toString().substr(2, 10);
  var commentId = time.substr(0, 4) + rand1 + rand2; // 24 chars

  var sanitizedMessage = purifyMarkdown(params.message).trim();

  var coll = db.collection('entries');
  var filter = { _id: params.entryId };

  var update = {
    $push: {
      comments: {
        id: commentId,
        time: time,
        user: params.username,
        message: sanitizedMessage,
      },
    },
  };

  coll.updateOne(filter, update, function (err) {
    if (err) {
      return callback(err);
    }

    var eventParams = Object.assign({}, params, {
      commentId: commentId,
      time: time,
      message: sanitizedMessage,
    });

    eventsDal.createLocationEntryCommentCreated(eventParams, callback);
  });
};

exports.changeLocationEntryComment = function (params, callback) {
  // Parameters:
  //   params
  //     locationId
  //     locationName
  //     entryId
  //     commentId
  //     username
  //     newMessage: markdown UTF8 string
  //   callback
  //     function (err)

  // Sanitize
  var sanitizedMessage = purifyMarkdown(params.newMessage).trim();

  var coll = db.collection('entries');
  var filter = {
    _id: params.entryId,
    'comments.id': params.commentId,
  };

  var update = {
    $set: {
      'comments.$.message': sanitizedMessage,
    },
  };

  coll.updateOne(filter, update, function (err) {
    if (err) {
      return callback(err);
    }

    var eventParams = Object.assign({}, params, {
      newMessage: sanitizedMessage,
    });

    eventsDal.createLocationEntryCommentChanged(eventParams, callback);
  });
};

exports.removeLocationEntryComment = function (params, callback) {
  // Parameters:
  //   params
  //     username
  //     locationId
  //     locationName
  //     entryId
  //     commentId
  //   callback
  //     function (err)

  var coll = db.collection('entries');
  var filter = { _id: params.entryId };

  var commentId = params.commentId;

  var update = {
    $pull: {
      comments: {
        id: commentId,
      },
    },
  };

  coll.updateOne(filter, update, function (err) {
    if (err) {
      return callback(err);
    }

    var eventParams = params;
    eventsDal.createLocationEntryCommentRemoved(eventParams, callback);
  });
};
