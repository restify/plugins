// Copyright 2016 Restify. All rights reserved.

'use strict';


///--- API

/**
 * Provides req.set() and req.get() methods for handlers to share context
 * across the lifetime of a request.
 *
 * @returns {Function}
 */
function ctx() {
    var data = {};
    return function context(req, res, next) {
        req.set = function set(key, value) {
            data[key] = value;
        };
        req.get = function get(key) {
            return data[key];
        };

        return next();
    };
}


///--- Exports

module.exports = ctx;
