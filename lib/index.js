// Copyright 2012 Mark Cavage, Inc.  All rights reserved.

'use strict';

///--- Exports

module.exports = {
    acceptParser: require('./accept'),
    auditLogger: require('./audit'),
    authorizationParser: require('./authorization'),
    bodyParser: require('./bodyParser'),
    conditionalRequest: require('./conditionalRequest'),
    dateParser: require('./date'),
    jsonp: require('./jsonp'),
    urlEncodedBodyParser: require('./formBodyParser'),
    requestLogger: require('./bunyan'),
    gzipResponse: require('./gzip'),
    fullResponse: require('./fullResponse'),
    jsonBodyParser: require('./jsonBodyParser'),
    multipartBodyParser: require('./multipartBodyParser'),
    queryParser: require('./query'),
    requestExpiry: require('./requestExpiry'),
    serveStatic: require('./static'),
    throttle: require('./throttle'),

    pre: {
        pause: require('./pre/pause'),
        sanitizePath: require('./pre/prePath'),
        userAgentConnection: require('./pre/userAgent')
    }
};
