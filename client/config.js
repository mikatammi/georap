/* eslint-disable no-magic-numbers */

// This config files exposes local configurations to a client without
// exposing secrets and other stuff.
//
// Downside: some values are duplicates to config/local.js

module.exports = {
  // Url prefix for uploaded files.
  // If you change this, edit also config/local.js
  uploadUrl: '/uploads',
  // Upload file size limit in bytes.
  uploadSizeLimit: 20 * 1024 * 1024,
};
