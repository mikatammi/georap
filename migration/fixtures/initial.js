/* eslint-disable no-magic-numbers, no-sync, max-lines */

const config = require('tresdb-config');
const db = require('tresdb-db');
const bcrypt = require('bcryptjs');

const admin = config.admin.username;

module.exports = {
  collections: {
    config: [
      {
        _id: db.id('58092312bbba430a35fb4139'),
        key: 'schemaVersion',
        value: 9,
      },
    ],
    attachments: [],
    entries: [],
    events: [],
    locations: [],
    users: [
      {
        _id: db.id('5867bdf00a5a9e18d7755e4f'),
        admin: true,
        email: config.admin.email,
        hash: bcrypt.hashSync(config.admin.password, config.bcrypt.rounds),
        name: admin,
        points: 0, // points are updated by worker
        status: 'active',
      },
    ],
  },
  indices: db.INDICES,
};
