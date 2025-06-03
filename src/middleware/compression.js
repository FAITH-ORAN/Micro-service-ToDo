const compression = require('compression')

module.exports = compression({
  threshold: 0, // compress every JSON response, no matter how small
});