// This Store takes care of reading and storing a map viewport state
// to a given storage, e.g. localStorage.

var GEO_KEY = 'tresdb-geo-location';
var emitter = require('component-emitter');
var storage = require('../connection/storage');

var DEFAULT_STATE = {
  // Default map state
  lat: 61.0,
  lng: 24.0,
  zoom: 6,
  // 'hybrid' is darker and more practical than 'roadmap'
  mapTypeId: 'hybrid',
};

var MapStateStore = function (initState) {
  emitter(this);

  var _state;

  var storedState = storage.getItem(GEO_KEY);
  if (storedState) {
    _state = JSON.parse(storedState);
  } else if (initState) {
    _state = initState;
  } else {
    _state = DEFAULT_STATE;
  }

  this.update = function (newState, opts) {
    // Parameters:
    //   newState
    //     object with optional keys:
    //       lat
    //         number
    //       lng
    //         number
    //       zoom
    //         number
    //       mapTypeId
    //         string
    //  opts
    //    optional object with optional keys
    //      silent
    //        set true to prevent 'update' event emission
    //
    if (typeof newState !== 'object') {
      throw new Error('Invalid parameter newState');
    }

    if (typeof newState.lat === 'number') {
      _state.lat = newState.lat;
    }

    if (typeof newState.lng === 'number') {
      _state.lng = newState.lng;
    }

    if (typeof newState.zoom === 'number') {
      _state.zoom = newState.zoom;
    }

    if (typeof newState.mapTypeId === 'string') {
      _state.mapTypeId = newState.mapTypeId;
    }

    if (!opts) {
      opts = {};
    }
    opts.silent = typeof opts.silent === 'boolean' ? opts.silent : false;

    // Build the string to store
    var s = JSON.stringify(_state);

    // Store the string
    storage.setItem(GEO_KEY, s);

    if (!opts.silent) {
      this.emit('updated', _state);
    }
  };

  this.isEmpty = function () {
    // Return
    //   false if there is a viewport stored, other than default
    //   true otherwise
    if (storage.getItem(GEO_KEY)) {
      return false;
    }  // else

    return true;
  };

  this.get = function () {
    // Get the stored viewport state
    // If there is no state stored, returns the default state.
    //
    // Return:
    // {
    //   lat: <number>,
    //   lng: <number>,
    //   zoom: <number>,
    //   mapTypeId: <string>
    // }
    //
    if (_state !== DEFAULT_STATE) {
      return _state;
    }

    var s = storage.getItem(GEO_KEY);

    if (s) {
      return JSON.parse(s);
    }  // else

    return DEFAULT_STATE;
  };
};

// Singleton
module.exports = new MapStateStore(DEFAULT_STATE);
