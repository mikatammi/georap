
const templates = require('./templates');
const locationDal = require('./dal');
const loggers = require('../../../services/logs/loggers');
const config = require('tresdb-config');
const status = require('http-status-codes');
const sanitizeFilename = require('sanitize-filename');
const slugify = require('slugify');

exports.changeGeom = function (req, res, next) {

  const loc = req.location;

  if (typeof req.body.lat !== 'number' ||
      typeof req.body.lng !== 'number') {
    return res.sendStatus(status.BAD_REQUEST);
  }

  const lat = req.body.lat;
  const lng = req.body.lng;
  const u = req.user.name;

  locationDal.changeGeom({
    locationId: loc._id,
    locationName: loc.name,
    locationGeom: loc.geom,
    locationLayer: loc.layer,
    username: u,
    latitude: lat,
    longitude: lng,
  }, (err) => {
    if (err) {
      return next(err);
    }

    return res.sendStatus(status.OK);
  });
};

exports.changeName = function (req, res, next) {

  let newLocName = req.body.newName;

  if (typeof newLocName !== 'string') {
    return res.status(status.BAD_REQUEST).send('Invalid name');
  }

  // Remove excess whitespaces and prevent only-whitespace names.
  newLocName = newLocName.trim();

  const minNameLen = 2;
  const maxNameLen = 120;
  if (newLocName.length < minNameLen || newLocName.length > maxNameLen) {
    return res.status(status.BAD_REQUEST).send('Too short or too long name');
  }

  const params = {
    locationId: req.location._id,
    locationName: req.location.name,
    newName: req.body.newName,
    username: req.user.name,
  };

  locationDal.changeName(params, (err) => {
    if (err) {
      return next(err);
    }

    return res.sendStatus(status.OK);
  });
};

exports.changeTags = function (req, res) {
  // TODO Remove at some point
  const msg = 'Tags API is not available anymore. Update your client.';
  return res.status(status.GONE).send(msg);
};

exports.changeStatus = function (req, res, next) {
  // Validate status
  if (typeof req.body.status === 'string') {
    if (config.locationStatuses.indexOf(req.body.status) < 0) {
      const msg = 'Invalid location status: ' + req.body.status;
      return res.status(status.BAD_REQUEST).send(msg);
    }
  } else {
    return res.sendStatus(status.BAD_REQUEST);
  }

  // If no change, everything ok already
  const oldStatus = req.location.status;
  const newStatus = req.body.status;
  if (oldStatus === newStatus) {
    return res.status(status.OK).send('Status not changed. Same already.');
  }

  locationDal.changeStatus({
    locationId: req.location._id,
    locationName: req.location.name,
    locationStatus: oldStatus,
    username: req.user.name,
    status: newStatus,
  }, (err) => {
    if (err) {
      return next(err);
    }

    return res.sendStatus(status.OK);
  });
};

exports.changeType = function (req, res, next) {
  // Validate type
  if (typeof req.body.type === 'string') {
    if (config.locationTypes.indexOf(req.body.type) < 0) {
      const msg = 'Invalid location type: ' + req.body.type;
      return res.status(status.BAD_REQUEST).send(msg);
    }
  } else {
    return res.status(status.BAD_REQUEST).send('Invalid location type');
  }

  // If no change, everything ok already
  const oldType = req.location.type;
  const newType = req.body.type;
  if (oldType === newType) {
    return res.status(status.OK).send('Type not changed. Same already.');
  }

  locationDal.changeType({
    locationId: req.location._id,
    locationName: req.location.name,
    locationType: oldType,
    username: req.user.name,
    type: newType,
  }, (err) => {
    if (err) {
      return next(err);
    }

    return res.sendStatus(status.OK);
  });
};

exports.changeThumbnail = (req, res, next) => {
  // Validate thumbnail key
  const newKey = req.body.attachmentKey;
  if (typeof newKey !== 'string' || newKey.length < 1) {
    return res.status(status.BAD_REQUEST).send('Invalid thumbnail key');
  }

  // If no change, everything ok already
  const oldKey = req.location.thumbnail;
  if (oldKey === newKey) {
    return res.status(status.OK).send('Same thumbnail already selected.');
  }

  locationDal.changeThumbnail({
    username: req.user.name,
    locationId: req.location._id,
    locationName: req.location.name,
    newThumbnail: newKey,
    oldThumbnail: oldKey,
  }, (err) => {
    if (err) {
      return next(err);
    }

    return res.sendStatus(status.OK);
  });
};

exports.getOne = function (req, res, next) {
  // Fetch single location with entries and events

  // eslint-disable-next-line max-statements
  locationDal.getOneComplete(req.location._id, (err, rawLoc) => {
    if (err) {
      return next(err);
    }

    if (!rawLoc) {
      return res.sendStatus(status.NOT_FOUND);
    }

    let responseStr, filename, mime;
    let format = req.query.format;

    if (typeof format === 'string') {
      format = format.toLowerCase();

      if (format === 'geojson') {
        responseStr = templates.geojson(rawLoc, true);
        mime = 'application/vnd.geo+json';
      }

      if (format === 'gpx') {
        responseStr = templates.gpx(rawLoc);
        mime = 'application/gpx+xml';
      }

      if (format === 'kml') {
        responseStr = templates.kml(rawLoc);
        mime = 'application/vnd.google-earth.kml+xml';
      }

      if (typeof mime !== 'string') {
        // This mime type is not found
        return res.sendStatus(status.NOT_FOUND);
      }

      // Name of the file to download.
      // Slugification is needed after sanitizeFilename because
      // http headers do not handle non-ascii and non-alpha-numerics well.
      // See https://stackoverflow.com/q/93551/638546
      filename = slugify(sanitizeFilename(rawLoc.name)) + '.' + format;

      // Set headers
      res.set('Content-Type', mime);
      res.set('Content-Disposition', 'attachment; filename=' + filename);

      return res.send(responseStr);
    }  // else

    // Log that user has viewed a location.
    loggers.log(req.user.name + ' viewed location ' + rawLoc.name + '.');

    return res.json(rawLoc);
  });
};

exports.removeOne = function (req, res, next) {
  // Delete single location

  locationDal.removeOne(req.location._id, req.user.name, (err) => {
    if (err) {
      return next(err);
    }

    return res.sendStatus(status.OK);
  });
};
