// Displays outcome of a batch import.
// - the number of imported and skipped locations
// - the number of overlapping entries and number of merged entries.
// - list of created or modified locations

var messageTemplate = require('./message.ejs');
var listTemplate = require('./list.ejs');
var template = require('./template.ejs');
var emitter = require('component-emitter');
var ui = require('tresdb-ui');

module.exports = function (batchId) {
  // Parameters
  //   batchId
  //     string

  // Init
  var self = this;
  emitter(self);

  // Public methods

  this.bind = function ($mount) {
    $mount.html(template({
      batchId: batchId,
    }));

    var $progress = $('#tresdb-outcome-progress');
    var $list = $('#tresdb-outcome-list');
    var $msg = $('#tresdb-outcome-message');

    tresdb.stores.locations.getOutcome(batchId, function (err, result) {
      // Progress bar is visible by default
      ui.hide($progress);

      if (err) {
        console.error(err);
        return;
      }

      // Message about the results
      $msg.html(messageTemplate({
        createdLocs: result.created,
        modifiedLocs: result.modified,
        skippedLocs: result.skipped,
      }));

      $list.html(listTemplate({
        createdLocs: result.created,
        modifiedLocs: result.modified,
        skippedLocs: result.skipped,
      }));

      ui.show($list);
    });
  };

  this.unbind = function () {
  };

};
