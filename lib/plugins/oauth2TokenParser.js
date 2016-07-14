'use strict';

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
            return next();
        }

        if (req.body && req.body.access_token) {
            req.oauth2.accessToken = req.body.access_token;
            return next();
        }

        if (req.query && req.query.access_token) {
            req.oauth2.accessToken = req.query.access_token;
            return next();
        }

        return (next());
    }

    return (parseOauth2Token);
}

module.exports = oauth2TokenParser;
