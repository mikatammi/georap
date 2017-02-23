/* eslint-disable max-statements */
// View for location

var emitter = require('component-emitter');

var locations = require('../../stores/locations');

//var getEntryView = require('./lib/getEntryView');
var NameView = require('./parts/Name');
var GeomView = require('./parts/Geom');
var TagsView = require('./parts/Tags');
var FormsView = require('./parts/Forms');
var RemoveView = require('./parts/Remove');
var EntriesView = require('./Entries');
var EventsView = require('./Events');

// Templates
var locationTemplate = require('./template.ejs');

module.exports = function (id) {
  // Parameters
  //   id
  //     location id
  //
  // Emits
  //   removed
  //     when model emits "removed"

  // Init
  emitter(this);
  var self = this;

  // State
  var location;
  var nameView, geomView, tagsView, formsView;
  var entriesView, eventsView, removeView;


  // Public methods

  this.bind = function ($mount) {

    // Loading
    $mount.html(locationTemplate());

    var $loading = $('#tresdb-location-loading');

    // Fetch location before rendering.
    locations.get(id, function (err, loc) {

      $loading.addClass('hidden');

      if (err) {
        console.error(err);
        return;
      }

      // Set state
      location = loc;

      nameView = new NameView(location);
      geomView = new GeomView(location);
      tagsView = new TagsView(location);
      formsView = new FormsView(location);
      entriesView = new EntriesView(location);
      eventsView = new EventsView(location);
      removeView = new RemoveView(location);

      nameView.bind($('#tresdb-location-name'));
      geomView.bind($('#tresdb-location-geom'));
      tagsView.bind($('#tresdb-location-tags'));
      formsView.bind($('#tresdb-location-forms'));
      entriesView.bind($('#tresdb-location-entries'));
      eventsView.bind($('#tresdb-location-events'));
      removeView.bind($('#tresdb-location-remove'));


      // Listen possible changes in the location.

      // location.on('entry_added', function (ev) {
      //   // Get entry model
      //   var entry = location.getEntry(ev.entryId);
      //   // Create entry view
      //   var entryView = getEntryView(entry);
      //   // Render, attach to dom and bind handlers
      //   var html = entryView.render();
      //   $('#tresdb-location-content-entries').prepend(html);
      //   entryView.bind();
      // });
      //
      // location.on('entry_removed', function (ev) {
      //   $('#' + ev.entryId).remove();
      // });

      location.on('removed', function () {
        self.emit('removed');
      });

      // Enable tooltips. See http://getbootstrap.com/javascript/#tooltips
      $('[data-toggle="tooltip"]').tooltip();

    });
  };  // end bind

  this.unbind = function () {

    if (location) {
      nameView.unbind();
      geomView.unbind();
      tagsView.unbind();
      formsView.unbind();
      entriesView.unbind();
      eventsView.unbind();
      removeView.unbind();
      location.off();
    }
  };

};
