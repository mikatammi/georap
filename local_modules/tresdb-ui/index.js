var marked = require('marked');
var timestamp = require('timestamp');

// Setup
marked.setOptions({ breaks: true });

exports.isHidden = function ($el) {
  return $el.hasClass('hidden');
};

exports.show = function ($el) {
  $el.removeClass('hidden');
};

exports.hide = function ($el) {
  $el.addClass('hidden');
};

exports.toggleHidden = function ($el) {
  $el.toggleClass('hidden');
};

exports.flash = function ($el) {
  // Change element background color temporarily.
  // Useful to highlight things.
  //
  // Parameters:
  //   $el: jQuery element
  //
  var DURATION = 2;
  var DELAY = 2;
  var SECOND = 1000;
  $el.css('transition', 'background-color ' + DURATION + 's');
  $el.addClass('tresdb-flash');
  window.setTimeout(function () {
    $el.removeClass('tresdb-flash');
  }, DELAY * SECOND);
  window.setTimeout(function () {
    $el.css('transition', 'unset');
  }, (DURATION + DELAY) * SECOND);
};

exports.markdownToHtml = function (markdown) {
  return marked(markdown);
};

exports.timestamp = function (time) {
  return timestamp(time);
};

exports.flagstamp = function (flags) {
  // Convert an array of flags to string
  //
  if (flags && flags.length > 0) {
    return 'a <strong>' + flags.join(' ') + '</strong> ';
  }
  return '';
};

exports.pointstamp = function (points) {
  var p = points;
  var h = '<span class="glyphicon glyphicon-star" aria-hidden="true"></span>';

  if (p > 0) {
    // Plus sign
    h += ' <span>+' + p + '</span>';
  } else if (p < 0) {
    // Special, wide minus sign
    h += ' <span>–' + Math.abs(p) + '</span>';
  } else {
    return ''; // No points
  }

  return h;
};

exports.markdownSyntax = function () {
  return '<strong>Syntax:</strong>' +
    '<p>' +
    '**bold** = <strong>bold</strong><br>' +
    '*emphasize* = <em>emphasize</em><br>' +
    '[this is a link](http://example.com) =' +
    ' <a href="http://example.com">this is a link</a><br>' +
    '<a href="https://en.support.wordpress.com/markdown-quick-reference/"' +
    ' target="_blank">See more...</a>' +
    '</p>';
};

exports.offAll = function (obj) {
  Object.keys(obj).forEach(function (k) {
    obj[k].off();
  });
};

exports.unbindAll = function (obj) {
  Object.keys(obj).forEach(function (k) {
    obj[k].unbind();
  });
};

exports.isAdvancedUpload = function () {
  // Drag-n-drop feature support recognition.
  // See https://css-tricks.com/drag-and-drop-file-uploading/
  var div = document.createElement('div');
  return (
    ('draggable' in div) ||
    ('ondragstart' in div && 'ondrop' in div)
  ) && 'FormData' in window && 'FileReader' in window;
};
