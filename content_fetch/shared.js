const buildFileName = require("../utils/buildFileName");

// Use native fetch from global
const fetch = globalThis.fetch;

module.exports = {
  fetch,
  buildFileName
};
