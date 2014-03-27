/**
 * Paynl.
 *
 * @author RWOverdijk
 * @license MIT
 */

/**
 * Required modules for Paynl.
 * @type {exports}
 */
var ip            = require('ip')
  , Q             = require('q')
  , extend        = require('extend')
  , url           = require('url')
  , request       = require('request')
  , crypto        = require('crypto')
  , shasum        = crypto.createHash('sha1')
  , handshake     = false
  , handshakeTime = 0;

/**
 * Paynl class.
 *
 * @param {{}} config
 * @constructor
 */
function Paynl(config) {
  this.configure(config);
}

/**
 * Paynl prototype.
 * @type {{configure: configure, invoke: invoke}}
 */
Paynl.prototype = {

  /**
   * Config options for the Paynl instance.
   */
  config: {
    apiUrl          : 'rest-api.pay.nl',
    handshakeUser   : 'handshake',
    apiProtocol     : 'https',
    handshakeTimeout: 3600, // Create a new handshake every hour.
    responseFormat  : 'json'
  },

  /**
   * Configure this instance of Paynl.
   *
   * @param {{}} config
   */
  configure: function(config) {
    extend(this.config, config);
  },

  /**
   * Invoke an API call.
   *
   * @param {String}  method  The method to call. Formatted as "namespace/method/version".
   *                          Example: Enduser/export/v3
   * @param {{}}      params  The parameters to send along with this API call.
   */
  invoke: function(method, params) {
    // Define variables used in this scope.
    var parts, namespace, action, version, urlObject, requiresHandshake, deferred;

    // Normalize input, and extract the command-parts.
    parts = method.replace(/(^\/|\/$)/g, '').split('/');

    // Create the deferred instance
    deferred = Q.defer();

    // Validate we got all parts we need.
    if (parts.length < 3) {

      // We don't. Reject on next tick.
      process.nextTick(function invalidMethod() {
        deferred.reject(new Error('Expected a "namespace/method/version" syntax.'));
      });

      return deferred.promise;
    }

    requiresHandshake = true;
    namespace         = parts[0];
    action            = parts[1];
    version           = parts[2];
    urlObject         = {
      protocol: this.config.apiProtocol,
      hostname: this.config.apiUrl,
      pathname: [version, namespace, action, this.config.responseFormat].join('/')
    };

    // Check if we have params
    if (typeof params === 'object') {
      urlObject.query = params;
    }

    // Check if we've configured handshake options for this request.
    try {
      requiresHandshake = require('./lib/api/' + namespace)[[action, version].join('/')];
    } catch (error) {
      // It looks like the API file doesn't exist.
    }

    // We do need a handshake! let's get one,
    if (requiresHandshake) {
      this.handshake().then(function(credentials) {
        urlObject.auth = credentials;

        this.request(urlObject).then(deferred.resolve, deferred.reject);
      }.bind(this), deferred.reject);
    } else {
      this.request(urlObject).then(deferred.resolve, deferred.reject);
    }

    return deferred.promise;
  },

  /**
   * Send a request to the backend.
   *
   * @param urlObject
   * @returns {Q.promise}
   */
  request: function(urlObject) {
    // Define variables used in this scope.
    var requestUrl, deferred, bodyParser;

    bodyParser = require('./lib/bodyParser/' + this.config.responseFormat);
    requestUrl = url.format(urlObject);
    deferred   = Q.defer();

    request(requestUrl, function sendRequest(error, response, body) {
      if (error) {
        return deferred.reject(error);
      }

      return bodyParser.parse(body, deferred.resolve);
    });

    return deferred.promise;
  },

  /**
   * Get a handshake from Pay.
   *
   * @returns {Q.promise}
   */
  handshake: function() {
    // Define variables used in this scope.
    var method, config, params, version, deferred, now, authString;

    // Just to make it easier and shorter to use.
    config = this.config;

    // Already set the user for the handshake auth string.
    authString = config.handshakeUser + ':';

    // We'll be using the current timestamp quite a bit, so set it in a variable.
    now = Date.now();

    // Create a new deferred instance.
    deferred = Q.defer();

    if (handshake && handshakeTime + config.handshakeTimeout > now) {
      process.nextTick(function() {
        deferred.resolve(authString + handshake);
      });

      return deferred.promise;
    }

    // Delay execution so we can reject the promise (if needed).
    process.nextTick(function getHandshake() {
      // Check if we're logging in by token, or credentials.
      if (config.accountId && config.token) {
        method  = 'loginByToken';
        version = 'v2';
        params  = {
          accountId: config.accountId,
          token    : shasum.update(config.token + Math.floor(now / 1000), 'utf8').digest('hex')
        };
      } else if (config.username && config.password && config.companyId) {
        method  = 'login';
        version = 'v2';
        params  = {
          username : config.username,
          password : config.password,
          companyId: config.companyId
        };
      } else {
        return deferred.reject(new Error('Can\'t create handshake without credentials.'));
      }

      params.ipAddress = ip.address();

      // Call Pay, and ask for a handshake key.
      return this.invoke(['Authentication', method, version].join('/'), params).then(function(response) {
        if (response.result) {
          handshake     = response.result;
          handshakeTime = Date.now();

          deferred.resolve(authString + handshake);
        } else {
          deferred.reject(response);
        }
      }, deferred.reject);
    }.bind(this));

    return deferred.promise;
  }
};

module.exports = Paynl;
