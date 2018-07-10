/**
 * json.
 *
 * @author RWOverdijk
 * @license MIT
 */
module.exports = {
  parse : function(data, callback) {
    callback(data ? JSON.parse(data) : '');
  }
};
