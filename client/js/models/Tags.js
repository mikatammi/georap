// Model for all tags. Maybe data comes from server in the future.

module.exports = function () {

  var tags = [
    'active',
    'agricultural',
    'aviation',
    'buried',
    'campfire',
    'demolished',
    'freak',
    'factory',
    'guarded',
    'hospital',
    'infrastructure',
    'lighthouse',
    'leisure',
    'locked',
    'marine',
    'military',
    'mining',
    'natural',
    'railway',
    'residental',
    'sawmill',
    'shop',
    'spiritual',
    'town',
    'underground',
    'vehicle',
    'walk-in',
  ];

  var notIn = function (list) {
    // Create a function to test if an item is not in the list.
    return function (item) {
      if (list.indexOf(item) > -1) {
        // Item found in list
        return false;
      }
      return true;
    };
  };

  // Public methods

  this.getAllTags = function () {
    return tags;
  };

  this.getTagsNotIn = function (blacklist) {
    // Get all tags, except the ones on the blacklist.
    return tags.filter(notIn(blacklist));
  };

  this.isValidTag = function (tag) {
    // Return
    //   true
    //     if tag is known
    //   false
    //     otherwise
    return (tags.indexOf(tag) > -1);
  };
};
