const path = require('path');

/**
 * CommonJS Next config to ensure Turbopack root is picked up by the
 * runtime loader regardless of TypeScript compilation quirks.
 */
module.exports = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};
