'use strict';

/**
 * The Request-URI is transmitted in the format specified in section 3.2.1.
 * If the Request-URI is encoded using the "% HEX HEX" encoding [42],
 * the origin server MUST decode the Request-URI
 * in order to properly interpret the request.
 * Servers SHOULD respond to invalid Request-URIs
 * with an appropriate status code.
 * ------------------------------------------------------------------------
 * part of Hypertext Transfer Protocol -- HTTP/1.1 | 5.1.2 Request-URI
 * RFC 2616 Fielding, et al.
 */

var BadRequestError = require('restify-errors').BadRequestError;

///--- Helpers

/**
 * [validate description]
 * @private
 * @function validate
 * @param  {String} path a url path to validate URI components
 * @returns {Boolean}
 */
function validate(path) {
    return !/(\&(?!(\w+=\w+)))/.test(path);

}


/**
 * @public
 * @function reqUrlValidator
 * @param    {Object}   options an options object
 * @returns  {Function}
 */
function reqUrlValidator(options) {

    function _reqUrlValidator(req, res, next) {

        if (!validate(req.url)) {
            res.send(new BadRequestError(options.message));
        }

        next();
    }

    return (_reqUrlValidator);
}


///--- Exports

module.exports = reqUrlValidator;
