/* eslint-disable max-statements */
var template = require('./template.ejs');
var CommentView = require('./Comment');
var updateHint = require('./updateHint');
var ui = require('tresdb-ui');

var account = tresdb.stores.account;
var MIN_LEN = tresdb.config.comments.minMessageLength;
var MAX_LEN = tresdb.config.comments.maxMessageLength;

// Temporary storage for unfinished comments.
// Remembers input even if user closes the location card.
// A mapping from entry id to { message, username }
var commentInputSaver = {};

module.exports = function (entry) {
  // Parameters:
  //   entry
  //     Entry model.

  var _commentViewsMap = {};
  var $els = [];
  var entryId = entry.getId();
  var username = account.getName(); // prevent frequent decoding

  // Helper methods

  var generateComment = function (comment) {
    // Generate comment view and element for a comment object.
    var commentId = comment.id;
    var v = new CommentView(entry, comment);

    _commentViewsMap[commentId] = v;

    var commentEl = document.createElement('div');
    commentEl.id = 'comment-' + commentId;

    var $commentEl = $(commentEl);
    v.bind($commentEl);

    return $commentEl;
  };

  // Public methods

  this.bind = function ($mount) {
    var comments = entry.getComments();

    $mount.html(template({
      entryId: entryId,
      MIN_LEN: MIN_LEN,
    }));

    var $commentsEl = $mount.find('#entry-' + entryId + '-comments');
    var $container = $mount.find('.entry-comment-form-container');
    var $commentForm = $mount.find('.entry-comment-form');
    var $commentProgress = $mount.find('#entry-comment-progress');
    var $entryFooter = $('#entry-' + entryId + '-footer');
    var $error = $mount.find('#entry-' + entryId + '-comment-error');
    var $messageInput = $mount.find('#entry-' + entryId + '-comment-input');
    var $success = $mount.find('#entry-' + entryId + '-comment-success');
    var $messageHint = $mount.find('#entry-' + entryId + '-comment-hint');
    var $openCommentForm = $('#entry-' + entryId + '-open-comment-form');
    var $cancel = $mount.find('#entry-' + entryId + '-comment-cancel-btn');

    comments.forEach(function (comment) {
      var $commentEl = generateComment(comment);
      $commentsEl.append($commentEl);
    });

    $openCommentForm.click(function (ev) {
      ev.preventDefault();

      // Show the form container; Hide the footer
      ui.show($container);
      ui.hide($entryFooter);

      // Ensure visibility of the form inside the container.
      // Maybe hidden by previous success.
      ui.show($commentForm);

      // Prefill with possibly previously saved message
      var savedInput = commentInputSaver[entryId];
      if (savedInput) {
        // Ensure that the user is the same. It could be possible
        // for a user to log out and then another user to log in.
        if (savedInput.username === username) {
          $messageInput.val(savedInput.message);
        }
      }

      // Focus to message input
      $messageInput.focus();

      // Hide possible previous infos
      ui.hide($success);

      // Update possibly previously changed hint
      var len = $messageInput.val().length;
      updateHint($messageHint, len);
    });

    $cancel.click(function (ev) {
      ev.preventDefault();

      // Hide the form container; Show the footer
      ui.hide($container);
      ui.show($entryFooter);
    });

    $messageInput.on('input', function () {
      var msg = $messageInput.val();

      // Save unfinished comment
      commentInputSaver[entryId] = {
        message: msg,
        username: username,
      };

      // Message hint
      // Validate message on comment input. Max length etc.
      var len = msg.length;
      updateHint($messageHint, len);
    });

    $commentForm.submit(function (ev) {
      ev.preventDefault();

      var message = $messageInput.val();
      var len = message.length;

      if (len < MIN_LEN || len > MAX_LEN) {
        // Do not submit. Emphasize message hint.
        $messageHint.addClass('text-danger');
        $messageHint.removeClass('text-info');
        return;
      }

      // Purge cache for unfinished comment.
      commentInputSaver[entryId] = null;

      // Hide form but not container.
      ui.hide($commentForm);
      ui.show($commentProgress);
      // Hide possible previous messages
      ui.hide($error);

      entry.createComment(message, function (err) {
        if (err) {
          // Show form
          ui.show($commentForm);
          // Hide progress
          ui.hide($commentProgress);
          // Display error message
          ui.show($error);
          $error.html(err.message);
        } else {
          // Success //
          // Hide progress
          ui.hide($commentProgress);
          // Show entry footer
          ui.show($entryFooter);
          // Hide form container but reveal the form for next comment.
          ui.hide($container);
          ui.show($commentForm);
          // Empty the successfully posted message input
          $messageInput.val('');
        }
      });
    });

    entry.on('location_entry_comment_created', function (ev) {
      // The server sent a new comment.
      var comment = {
        id: ev.data.commentId,
        user: ev.user,
        time: ev.time,
        message: ev.data.message,
      };
      // Append to the list of comments.
      var $commentEl = generateComment(comment);
      $commentsEl.append($commentEl);
      // Flash in green; Override list item styles.
      var $listItem = $commentEl.find('.list-group-item');
      ui.flash($listItem);
    });

    entry.on('location_entry_comment_changed', function (ev) {
      // Shortcut id
      var commentId = ev.data.commentId;
      // Find comment in the _commentViewsMap
      var cv = _commentViewsMap[commentId];
      // Update message
      cv.comment.message = ev.data.newMessage;
      // Find element
      var elemId = 'comment-' + commentId;
      var $messageEl = $mount.find('#' + elemId + ' span.comment-message');
      // Update message element (if exists)
      $messageEl.html(ui.markdownToHtml(ev.data.newMessage));
    });

    entry.on('location_entry_comment_removed', function (ev) {
      // Shortcut id
      var commentId = ev.data.commentId;
      // Find comment in the _commentViewsMap
      var cv = _commentViewsMap[commentId];
      if (cv) {
        // Remove comment view component.
        cv.unbind();
        delete _commentViewsMap[commentId];
      }
      // Find element
      var elemId = 'comment-' + commentId;
      var $commentEl = $mount.find('#' + elemId);
      if ($commentEl.length !== 0) {
        // Remove element if exists.
        $commentEl.remove();
      }
    });

    $els = [
      $openCommentForm,
      $cancel,
      $commentForm,
      $messageInput,
    ];
  };

  this.unbind = function () {
    // Unbind each child
    Object.keys(_commentViewsMap).forEach(function (k) {
      _commentViewsMap[k].unbind();
    });

    $els.forEach(function ($el) {
      $el.off();
    });
    $els = [];

    entry.off('location_entry_comment_created');
    entry.off('location_entry_comment_changed');
    entry.off('location_entry_comment_removed');
  };
};
