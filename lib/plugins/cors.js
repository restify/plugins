// Copyright 2013 Mark Cavage, Inc.  All rights reserved.

'use strict';

///--- external modules
var assert = require('assert-plus');
var errs = require('restify-errors');


///--- local globals

var ALLOW_HEADERS = [
    'accept',
    'accept-version',
    'content-type',
    'request-id',
    'origin',
    'x-api-version',
    'x-request-id'
];

var EXPOSE_HEADERS = [
    'api-version',
    'content-length',
    'content-md5',
    'content-type',
    'date',
    'request-id',
    'response-time'
];

var AC_REQ_METHOD = 'access-control-request-method';
var AC_REQ_HEADERS = 'access-control-request-headers';
var AC_ALLOW_CREDS = 'access-control-allow-credentials';
var AC_ALLOW_ORIGIN = 'access-control-allow-origin';
var AC_ALLOW_HEADERS = 'access-control-allow-headers';
var AC_ALLOW_METHODS = 'access-control-allow-methods';
var AC_EXPOSE_HEADERS = 'access-control-expose-headers';
var AC_MAX_AGE = 'access-control-max-age';
var AC_MAX_AGE_MS = 3600;
var STR_VARY = 'vary';
var STR_ORIGIN = 'origin';


///--- Internal Functions

/**
 * find a possible match given an incoming origin header against an array of
 * known whitelisted origins.
 * @private
 * @function matchOrigin
 * @param {String} incomingOrigin the incoming origin header
 * @param {Array} origins an array of origin strings
 * @returns {String | Boolean}
 */
function matchOrigin(incomingOrigin, origins) {

    var matched = false;

    if (incomingOrigin) {
        origins.some(function belong(o) {
            if (o === incomingOrigin || o === '*') {
                matched = o;
                return true;
            }
            return false;
        });
    }

    return matched;
}


///--- API

/**
 * From http://www.w3.org/TR/cors/#resource-processing-model
 *
 * If "simple" request (paraphrased):
 *
 * 1. If the Origin header is not set, or if the value of Origin is not a
 *    case-sensitive match to any values listed in `opts.origins`, do not
 *    send any CORS headers
 *
 * 2. If the resource supports credentials add a single
 *    'Access-Control-Allow-Credentials' header with the value as "true", and
 *    ensure 'AC-Allow-Origin' is not '*', but is the request header value,
 *    otherwise add a single Access-Control-Allow-Origin header, with either the
 *    value of the Origin header or the string "*" as value
 *
 * 3. Add Access-Control-Expose-Headers as appropriate
 *
 * Pre-flight requests are handled by the router internally
 *
 * @public
 * @function createCorsContext
 * @param    {Object} options an options object
 * @param    {Array} [options.origins] an array of whitelisted origins
 * @param    {Boolean} [options.credentials] if true, uses creds
 * @param    {Array} [options.allowHeaders] user defined headers to allow
 * @param    {Array} [options.exposeHeaders] user defined headers to expose
 * @param    {Array} [options.preflightMaxAge] ms to cache preflight requests
 * @param    {Object | Function | Boolean} [options.preflightStrategy]
 * customize preflight request handling
 * @returns  {Object} returns an object with a handler and preflight handler
 */
function createCorsContext(options) {

    assert.object(options, 'options');
    assert.optionalArrayOfString(options.origins, 'options.origins');
    assert.optionalBool(options.credentials, 'options.credentials');
    assert.optionalArrayOfString(options.exposeHeaders,
                                 'options.exposeHeaders');
    assert.optionalArrayOfString(options.allowHeaders, 'options.allowHeaders');
    assert.optionalNumber(options.preflightMaxAge, 'options.preflightMaxAge');

    var opts = options || {};
    var credentials = opts.credentials || false;
    var origins = opts.origins || ['*'];
    var allowHeaders = opts.allowHeaders || [];
    var exposeHeaders = opts.exposeHeaders || [];
    var preflightMaxAge = opts.preflightMaxAge || AC_MAX_AGE_MS;
    var preflightStrategy = opts.preflightStrategy;

    // concat customized headers to the default list
    EXPOSE_HEADERS.forEach(function (h) {
        if (exposeHeaders.indexOf(h) === -1) {
            exposeHeaders.push(h);
        }
    });

    ALLOW_HEADERS.forEach(function (h) {
        if (allowHeaders.indexOf(h) === -1) {
            allowHeaders.push(h);
        }
    });


    // use the preflight spec from w3
    // http://www.w3.org/TR/cors/#access-control-request-headers-request-header
    function preflight(req, res, next) {

        // 1) if not an options request, move on.
        if (req.method !== 'OPTIONS') {
            return next();
        }

        // now check the preflight requirements are all available. if anything
        // is missing, or the resource requested for is missing, returna 400.
        var reqOrigin = req.headers.origin;
        var reqMethod = req.headers[AC_REQ_METHOD];
        var reqHeaders = req.headers[AC_REQ_HEADERS];
        var errMsg = 'invalid preflight request';
        var errMsg2 = 'unsupported method';

        // 2) check that the incoming preflight headers are ok
        if (!reqOrigin || !reqMethod || !reqHeaders) {
            return next(new errs.BadRequestError(errMsg));
        }

        // 3.1) check if origin is valid and matched
        var matchedOrigin = matchOrigin(reqOrigin, origins);
        // 3.2) make sure headers are all allowed
        var splitHeaders = reqHeaders.split(/\s*,\s*/);
        var validHeaders = splitHeaders.every(function headerOk(h) {
            return (allowHeaders.indexOf(h) !== -1);
        });

        // if either 3.1 or 3.2 failed, return 400.
        if (!matchedOrigin || !validHeaders) {
            return next(new errs.BadRequestError(errMsg));
        }

        // 3.4) check that the requested resource and method are valid. couple
        // ways we can do this. user passes in an option that can either be:
        //
        //  - a restify server instance:
        //      in this scenario, we use the router to 'simulate' a routing
        //      request, which will populate res.methods with the supported
        //      methods for that resource. this is an easy way to
        //      automatically get full support without having to implement
        //      server.opts on every single cors resource.
        //
        //      on a successful 'route', the router will populate
        //      res.methods with the list of supported methods, and also
        //      likely return a 405, but that's expected. iif router returns
        //      a 404, that means the resource doesn't even exist, so we
        //      need to send a 400 back.
        //
        //  - a function, that given req/res, returns an array of methods
        //      a user provided function that will return an array of supported
        //      methods given a req and res object.
        //
        //  - a value of false
        //      don't do anything, user will manually implement server.opts for
        //      every single resource.

        var findMethodsFn;

        if (typeof preflightStrategy === 'function') {
            findMethodsFn = preflightStrategy;
        } else if (typeof preflightStrategy === 'object' &&
                   preflightStrategy.router &&
                   preflightStrategy.router.find) {

            var server = preflightStrategy;
            findMethodsFn = function findMethods() {
                // anonymouns fn to avoid bind here
                var args = [].slice.apply(arguments);
                server.router.find.apply(server.router, args);
            };
        } else {
            findMethodsFn = function noop(_, _2, cb) {
                return cb();
            };
        }

        // restify router has a sig of function found(err, route, context) {
        // but we don't use route or context in this case. for simplicity
        // sake, the user facing preflightStrategy should just return an
        // array of methods as the second param.
        findMethodsFn(req, res, function found(err, resMethods) {

            if (err) {
                if (err instanceof errs.ResourceNotFoundError ||
                    err.restCode === 'ResourceNotFound') {
                    return next(new errs.BadRequestError(errMsg));
                }
            }

            // look for it first on res, then on the returned value, then
            // finally fall back to empty array
            var supportedMethods = res.methods || resMethods || [];

            // ensure the requested method is within this list of supported
            // methods.
            if (supportedMethods.indexOf(reqMethod) === -1) {
                return next(new errs.MethodNotAllowedError(errMsg2));
            }

            // the request looks good. set headers and we're good to go.
            setCommonHeaders(res, reqOrigin, matchedOrigin);
            res.setHeader(AC_ALLOW_HEADERS, allowHeaders.join(', '));
            res.setHeader(AC_ALLOW_METHODS, supportedMethods);
            res.setHeader(AC_MAX_AGE, preflightMaxAge);

            // end the request, return false so restify will stop processing
            // the request.
            res.writeHead(200);
            res.end();
            return next(false);
        });
    }



    // sets headers for use in CORS requests
    function headers(req, res, next) {

        // 1) if no origin header incoming request, move on, set no headers.
        var reqOrigin = req.headers.origin;

        if (!reqOrigin) {
            return next();
        }

        // 2) if no matched origin found, move on, set no headers.
        var matchedOrigin = matchOrigin(reqOrigin, origins);

        if (!matchedOrigin) {
            return next();
        }

        // if match was found, let's set some headers.
        setCommonHeaders(res, reqOrigin, matchedOrigin);
        res.setHeader(AC_EXPOSE_HEADERS, exposeHeaders.join(', '));

        return next();
    }


    // set common cors headers
    function setCommonHeaders(res, reqOrigin, matchedOrigin) {
        if (credentials === true) {
            // when credentials are used, not allowed to use *!
            res.setHeader(AC_ALLOW_ORIGIN, reqOrigin);
            res.setHeader(AC_ALLOW_CREDS, 'true');
            res.setHeader(STR_VARY, STR_ORIGIN);
        } else {
            // for non credentialed requests
            if (matchedOrigin === '*') {
                res.setHeader(AC_ALLOW_ORIGIN, '*');
            } else {
                res.setHeader(AC_ALLOW_ORIGIN, matchedOrigin);
                res.setHeader(STR_VARY, STR_ORIGIN);
            }
        }
    }


    // finally, export the payload
    var payload = {
        headers: headers
    };

    // only add a preflight function to the exports if a strategy was provided.
    if (preflightStrategy) {
        payload.preflight = preflight;
    }

    return payload;
}


///--- Exports

module.exports = createCorsContext;
