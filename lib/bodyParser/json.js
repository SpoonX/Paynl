/**
 * json.
 *
 * @author RWOverdijk
 * @license MIT
 */
module.exports = {
  parse: function(data, callback) {
    callback(JSON.parse(data));
  }
};
