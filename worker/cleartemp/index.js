var config = require('tresdb-config');
var tempdirs = require('../../server/services/tempdirs');

exports.run = function (callback) {

  var tempRoot = config.tempUploadDir;
  var ttlSeconds = config.tempUploadTimeToLive;

  tempdirs.removeOlderThan(tempRoot, ttlSeconds, function (err, names) {
    if (err) {
      if (err.code === 'ENOENT') {
        // Temporary dir does not exist.
        names = [];
      } else {
        console.log('cleartemp: ERROR in removeOlderThan');
        return callback(err);
      }
    }

    var n = names.length;
    console.log('cleartemp: removed ' + n + ' temporary directories.');
    names.forEach(function (name, index) {
      console.log('  (' + index + ') ' + name);
    });

    return callback(); // success
  });

};
