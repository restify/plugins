// Copyright 2012 Mark Cavage, Inc.  All rights reserved.

'use strict';

///--- Exports

module.exports = {
    acceptParser: require('./plugins/accept'),
    auditLogger: require('./plugins/audit'),
    authorizationParser: require('./plugins/authorization'),
    bodyParser: require('./plugins/bodyParser'),
    conditionalRequest: require('./plugins/conditionalRequest'),
    dateParser: require('./plugins/date'),
    jsonp: require('./plugins/jsonp'),
    urlEncodedBodyParser: require('./plugins/formBodyParser'),
    requestLogger: require('./plugins/bunyan'),
    gzipResponse: require('./plugins/gzip'),
    fullResponse: require('./plugins/fullResponse'),
    jsonBodyParser: require('./plugins/jsonBodyParser'),
    multipartBodyParser: require('./plugins/multipartBodyParser'),
    queryParser: require('./plugins/query'),
    requestExpiry: require('./plugins/requestExpiry'),
    serveStatic: require('./plugins/static'),
    throttle: require('./plugins/throttle'),

    pre: {
        pause: require('./pre/pause'),
        sanitizePath: require('./pre/prePath'),
        userAgentConnection: require('./pre/userAgent')
    }
};
