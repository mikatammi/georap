# tresdb

Esoteric Location CMS built on Express.

## Install

Clone the repository:

    $ git clone https://github.com/axelpale/tresdb.git

Install MongoDB by following [the instructions](https://www.mongodb.org/downloads). For example, on OS X:

    $ brew install mongodb

Install dependencies:

    $ npm install

Rename `config/local-sample.js` to `config/local.js` and rewrite it with your settings.



## Quick start

First, start MongoDB (if it ever refuses to stop, try `killall mongod`):

    $ npm run mongo

Second, start the Node server:

    $ npm start

Finally, browse to [localhost:3000](http://localhost:3000).



## Environments

TresDB's Node server can be started in 3 environments: `development`, `production`, and `test`. The effects of each env is listed below:

- `development`: Client-side JS is bundled but not minified. Webpack server static assets from memory and recompiles the changes automatically without need to restart the server.
- `production`: Client-side JS is bundled and minified once on server start. Static files are served by Express.
- `test`: Same as development but a test MongoDB database is used instead of the main one. The test database is cleared and populated with fixture data before each test.

The environment to use is specified by setting `NODE_ENV`. For example to run server in dev env, use `NODE_ENV=development node server/index.js`. Most `npm run` scripts of TresDB already include this env specification. See `package.json` for details.



## Testing

First, we need to create a database `test` for tests and a database user. See MongoDB instructions below. Second, fire up mongod:

    $ npm run mongod

Third, open new terminal session and fire up the server in test environment:

    $ npm run server:test

Finally, open yet another terminal session and run the full test suite:

    $ npm test

The test suite includes:

- Server API tests powered by **mocha**. Run separately by `$ npm run test:server`.
- Client-side UI tests powered by **casperjs**. Run separately by `$ npm run test:client`.



## Logging

Server logs are stored under `.data/logs/` by default. To change the dir, see `config/local.js`. See `server/services/logs` for how logs are created. Logging is enabled only if `NODE_ENV=production`.



## Migration

During development, the database schema can and will evolve. For each schema evolution step, the major package version is increased. To update old schemas, we implement programmatic migration steps for each version increment and a script to execute them.

You can run the migration by:

    $ npm run migrate

Under the hood, the migration script does the following:

- figures out the current database schema version
- figures out the required database schema version
- deduces required migration steps, specified under `migration/versions/`
- updates the database by executing the steps.



## Database backups

To take a snapshot of the database:

    $ npm run backup

To restore the latest snapshot:

    $ npm run restore

The snapshots are named after their creation time.

To list available snapshots:

    $ npm run backup list

To restore a specific snapshot:

    $ npm run restore 2016-12-31T23-59-59

The backups are stored under `.data/backups` by default. To change this, modify `config.local.mongo.backupDir`. To remove a backup, remove its directory, e.g. `$ rm -rf .data/backups/2016-12-31T23-59-59`.



## Production

Here are some notes and tips for putting a TresDB instance into production.

### Secure MongoDB

Start mongod without authentication:

    $ mongod --dbpath=.data/db

Create an administrator that can add other users. For example, create a database user into `admin` database with `userAdminAnyDatabase` permission:

    $ mongo
    > use admin
    > db.createUser({
      user: 'foodmin',
      pwd: 'barword',
      roles: ['userAdminAnyDatabase']
    })

Next, create a user with permission to access only `tresdb`. Note that this user needs to be created into `tresdb` database instead of `admin`. Thus, authenticate first on `admin`, and then switch to `tresdb` to create.

    > db.auth('foodmin', 'barword')
    > use tresdb
    > db.createUser({
      user: 'foo',
      pwd: 'bar',
      roles: [{ role: 'readWrite', db: 'tresdb' }]
    })

Modify `mongo.url` property in `config/local.js` to include the new credentials of the `tresdb` database user:

    ...
    mongo: {
      url: 'mongodb://foo:bar@localhost:27017/tresdb'
    }
    ...

Now you can and should run mongod with authentication:

    $ mongod --auth --dbpath=.data/db

### Check dependencies for vulnerabilities

    $ npm install nsp -g
    $ nsp check

### Run in production environment

    $ npm run production



## Technology stack

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/)
- [Marked](https://github.com/chjj/marked)
- [Bootstrap](http://getbootstrap.com/)
- [jQuery](https://jquery.com/)
- [Lodash](https://lodash.com/)
- [Webpack](https://webpack.github.io/)
- [Socket.io](http://socket.io/)
- [bcrypt](https://www.npmjs.com/package/bcryptjs)
- [JSON Web Tokens](https://github.com/auth0/node-jsonwebtoken)
- [Express](https://expressjs.com/)
- [Node.js](https://nodejs.org/en/)
- [Monk](https://github.com/Automattic/monk)
- [MongoDB](https://docs.mongodb.com/manual/)

Development tools:

- [ESLint](http://eslint.org/)
- [CasperJS](http://casperjs.org/)
- [Mocha](https://mochajs.org/)
- [Should](http://shouldjs.github.io/)

For production, we recommend:

- [DigitalOcean](https://m.do.co/c/3e63e3de8e31)
- [Nginx](https://www.nginx.com/)
- [Let's Encrypt](https://letsencrypt.org/)


## Versioning

On the master branch, we use the [semantic versioning](http://semver.org/) scheme. The semantic version increments are bound to the operations you need to do when upgrading your TresDB instance:

- MAJOR (+1.0.0) denotes a new incompatible feature. A database migration might be required after upgrade. Hyperlinks of earlier versions might not work.
- MINOR (+0.1.0) denotes a new backwards-compatible feature. Upgrading directly from the Git should not break anything.
- PATCH (+0.0.1) denotes a backwards-compatible bug fix. Upgrading or downgrading directly from the Git should not break anything.


## Issues

Report bugs and features to [GitHub issues](https://github.com/axelpale/tresdb/issues).

The issue labels follow [Drupal's issue priority levels](https://www.drupal.org/core/issue-priority): critical, major, normal, and minor.


## License

MIT
