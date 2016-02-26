'use strict';

// external modules
var assert = require('assert-plus');
var ecstatic = require('ecstatic');


/**
 * thin wrapper around ecstatic.
 * @public
 * @function createServeStatic
 * @param {Object} options an options object for ecstatic
 * @returns {Function}
 */
function createServeStatic(options) {
    assert.object(options, 'options');
    assert.object(options.restifyServer,
                  'options.restifyServer',
                  'must pass restify server');

    // always call next
    options.invokeNext = true;

    var server = options.restifyServer;

    return [
        ecstatic(options),
        function ecsDone(req, res, next) {

            if (res.statusCode < 400) {
                server.emit('after', req, res, {
                    path: req.href(),
                    type: 'staticServe'
                });

                return next(false);
            }

            return next();
        }
    ];
}


module.exports = createServeStatic;
