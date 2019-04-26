
var users = require('../../stores/users');
var template = require('./template.ejs');
var listTemplate = require('./list.ejs');
var emitter = require('component-emitter');

module.exports = function () {

  // Init
  emitter(this);

  // Public methods

  this.bind = function ($mount) {

    $mount.html(template());

    // Fetch users and include to page.
    users.getAll(function (err, rawUsers) {
      // Hide loading bar
      $('#tresdb-users-loading').addClass('hidden');

      if (err) {
        console.error(err);
        return;
      }

      // Backward compatibility 8.3.3 -> 8.3.4
      rawUsers = rawUsers.map(function (u) {
        return Object.assign({}, u, {
          points7days: u.points7days ? u.points7days : 0,
          points30days: u.points30days ? u.points30days : 0,
        });
      });

      var activeUsers = rawUsers.filter(function (u) {
        return u.status === 'active';
      });
      var passiveUsers = rawUsers.filter(function (u) {
        return u.status === 'deactivated';
      });

      // Order by points
      var bestUsersAllTime = activeUsers.sort(function (ua, ub) {
        return ub.points - ua.points;
      });
      var bestUsersOf30days = activeUsers.sort(function (ua, ub) {
        return ub.points30days - ua.points30days;
      }).slice(0, 5);
      var bestUsersOf7days = activeUsers.sort(function (ua, ub) {
        return ub.points7days - ua.points7days;
      }).slice(0, 5);

      // Reveal list
      $('#tresdb-users-alltime').html(listTemplate({
        users: bestUsersAllTime,
      }));

      $('#tresdb-users-30days').html(listTemplate({
        users: bestUsersOf30days.map(function (u) {
          // Template uses u.points
          return Object.assign({}, u, { points: u.points30days });
        }),
        prefix: '+',
      }));

      $('#tresdb-users-7days').html(listTemplate({
        users: bestUsersOf7days.map(function (u) {
          // Template uses u.points
          return Object.assign({}, u, { points: u.points7days });
        }),
        prefix: '+',
      }));

      $('#tresdb-deactivated-users').html(listTemplate({
        users: passiveUsers,
      }));

    });
  };

  this.unbind = function () {
    // noop
  };

};
