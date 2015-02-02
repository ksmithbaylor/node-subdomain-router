'use strict';

/**
 * sendResponse
 *
 * Returns a message to the user as plain text
 *
 * Parameters:
 *   res     - The node response object to send to
 *   code    - The desired status code
 *   message - The desired message to send (without a newline)
 */
exports.sendResponse = function (res, code, message) {
  res.writeHead(400, {'Content-Type': 'text/plain'});
  res.end(message + '\n');
};

/**
 * parseSubdomain
 *
 * Returns the subdomain if there is one, empty string if not
 *
 * Parameters:
 *   domain   - The domain to get subdomains from (example.com)
 *   fullHost - The full host with subdomains to parse (abc.example.com)
 */
exports.parseSubdomain = function (domain, fullHost) {
  return fullHost.split(domain)[0].slice(0, -1);
};
