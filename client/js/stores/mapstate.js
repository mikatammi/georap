// This Store takes care of reading and storing a map viewport state
// to a given storage, e.g. localStorage.

var createStore = require('./lib/createStore');
var storage = require('../connection/storage');

var DEFAULT_STATE = tresdb.config.defaultMapState;

module.exports = createStore(storage, 'tresdb-geo-location', DEFAULT_STATE);
