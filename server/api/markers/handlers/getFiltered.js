var dal = require('../dal');
var status = require('http-status-codes');
var Ajv = require('ajv');
var loggers = require('../../../services/logs/loggers');

// Schema validator
var ajv = new Ajv({
  coerceTypes: true,
  useDefaults: true,
});

// Schema for getFiltered query
var querySchema = {
  type: 'object',
  properties: {
    creator: {
      type: 'string',
      minLength: 1,
    },
    deleted: {
      type: 'boolean',
      default: false,
    },
    limit: {
      type: 'integer',
      default: 100,
    },
    order: {
      type: 'string',
      enum: ['rel', 'az', 'za', 'newest', 'oldest'],
      default: 'rel',
    },
    skip: {
      type: 'integer',
      default: 0,
    },
    text: {
      type: 'string',
      minLength: 1,
    },
  },
  additionalProperties: false,
};
var validateQuery = ajv.compile(querySchema);

module.exports = function (req, res, next) {
  // Parameters:
  //   req.query
  //     see dal.getFiltered for params
  //
  // Response on success:
  //   JSON array of markers

  // Data types are coerced, thus req.query is modified.
  // validateQuery returns bool to inform if validation was successful
  if (!validateQuery(req.query)) {
    // To output validation erros.
    // console.log('ERROR', validateQuery.errors);
    return res.sendStatus(status.BAD_REQUEST);
  }

  dal.getFiltered(req.query, function (err, markers) {
    if (err) {
      return next(err);
    }

    // Search successful
    if (req.query.text) {
      loggers.log(req.user.name + ' searched for "' + req.query.text + '".');
    } else {
      loggers.log(req.user.name + ' searched without keywords.');
    }

    return res.json(markers);
  });
};
