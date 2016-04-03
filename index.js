'use strict';

var http = require('http');
var util = require('./util');

var DEFAULT_HOME_MESSAGE    = 'This is the home page.';
var DEFAULT_DOWN_MESSAGE    = 'There is usually something here, but it is down right now.';
var DEFAULT_INVALID_MESSAGE = 'There is nothing running here.';
var DEFAULT_ERROR_MESSAGE   = 'Server error.';

/**
 * generateServer
 *
 * Takes in a configuration object and returns a reverse proxy server
 *   that passes all traffic to and from a local port based on the
 *   subdomain of the request
 *
 * Parameters:
 *   config - A configuration object with the options described below
 *
 * Configuration options:
 *   host (required): The host the server is running on
 *   messages (optional): {
 *     home: The text returned if no home page port is specified
 *     invalid: The text returned for a request to an unknown subdomain
 *     down: The text returned for a request that is to a known subdomain,
 *           but the port it directs to is not accepting connections
 *     error: The text returned for a server error from a service
 *   }
 *   subdomains (optional): An object mapping subdomains to ports. Use ''
 *                          to indicate the home page port.
 *   fallbackPort (optional): If specified, requests targeting a subdomain
 *                            not present in the domain mapping will be
 *                            routed to the fallback port.
 */
module.exports = function generateServer(config) {

  config.subdomains       = config.subdomains       || {};
  config.messages         = config.messages         || {};
  config.messages.home    = config.messages.home    || DEFAULT_HOME_MESSAGE;
  config.messages.invalid = config.messages.invalid || DEFAULT_INVALID_MESSAGE;
  config.messages.down    = config.messages.down    || DEFAULT_DOWN_MESSAGE;
  config.messages.error   = config.messages.error   || DEFAULT_ERROR_MESSAGE;

  var requestHandler = function (req, res) {
    // Figure out where the request should go
    var subdomain = util.parseSubdomain(config.host, req.headers.host || '');
    var targetPort = config.subdomains[subdomain];

    // Handle edge cases
    if (!targetPort) { // If there is no target port
      if(typeof config.fallbackPort === "number") {
        targetPort = config.fallbackPort; // ...we have a fallback port
      }
      else {
        if (subdomain === '') { // ...and the user requested the home page
          util.sendResponse(res, 200, config.messages.home);
        } else { // ...and the user requested an invalid subdomain
          util.sendResponse(res, 400, config.messages.invalid);
        }

        return;
      }
    }

    // Craft the request to the actual service
    var proxyRequest = http.request({
      port:    targetPort,
      method:  req.method,
      path:    req.url,
      headers: req.headers
    });

    // When the request returns an error, send a 'down' message if the
    // service is down, otherwise send a 500 response
    proxyRequest.on('error', function(e) {
      if (e.code === 'ECONNREFUSED') {
        util.sendResponse(res, 503, config.messages.down);
      } else {
        util.sendResponse(res, 500, config.messages.error);
      }
    });

    // When the request returns a response, pipe it to the user
    proxyRequest.on('response', function(proxyResponse) {
      res.writeHead(proxyResponse.statusCode, proxyResponse.headers);
      proxyResponse.pipe(res);
    });


    // propagate request cancellation
    res.on('close', function() {
      proxyRequest.abort();
    });

    // Open the floodgates!
    req.pipe(proxyRequest);
  };

  return http.createServer(requestHandler);
};
