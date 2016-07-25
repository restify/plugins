'use strict';

var errors = require('restify-errors');
var querystring = require('qs');
/*

  Parses the header for the authorization: bearer

*/
function parseHeader(req) {

    if (req.headers && req.headers.authorization) {

        var credentialsIndex = 1;
        var parts = req.headers.authorization.split(' ');
        var partsExpectedLength = 2;
        var schemeIndex = 0;

        if (parts.length === partsExpectedLength) {

            var credentials = parts[credentialsIndex];
            var scheme = parts[schemeIndex];

            if (/^Bearer$/i.test(scheme)) {
                return credentials;
            }

        }

    }

    return null;

}


/**
 * Returns a plugin that will parse the client's request for an OAUTH2
   access token
 *
 * Subsequent handlers will see `req.oauth2`, which looks like:
 *
 * {
 *   oauth2: {
        accessToken: 'mF_9.B5f-4.1JqM&p=q'
    }
 * }
 *
 *
 * @public
 * @function oauth2TokenParser
 * @throws   {InvalidArgumentError}
 * @param    {Object} options an options object
 * @returns  {Function}
 */
function oauth2TokenParser(options) {

    function parseOauth2Token(req, res, next) {
        req.oauth2 = { accessToken: null};

        var tokenFromHeader = parseHeader(req);

        if (tokenFromHeader) {

            req.oauth2.accessToken = tokenFromHeader;
        }

        try {

            var params = querystring.parse(req.body);

            if (params) {
                var tokenFromBody = params.access_token;
                // more than one method to transmit the token in each request
                // is not allowed - return 400
                if (tokenFromBody && tokenFromHeader) {
                    throw new errors.makeErrFromCode(400);
                }

                if (tokenFromBody && req.contentType().toLowerCase()
                    === 'application/x-www-form-urlencoded') {
                    req.oauth2.accessToken = tokenFromBody;
                }
            }
        }
        catch (e) {
            return (next(e));
        }

        return (next());
    }

    return (parseOauth2Token);
}

module.exports = oauth2TokenParser;
