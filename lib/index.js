// Copyright 2012 Mark Cavage, Inc.  All rights reserved.

'use strict';

///--- Exports

module.exports = {
    acceptParser: require('./plugins/accept'),
    auditLogger: require('./plugins/audit'),
    authorizationParser: require('./plugins/authorization'),
    bodyReader: require('./plugins/bodyReader'),
    bodyParser: require('./plugins/bodyParser'),
    conditionalRequest: require('./plugins/conditionalRequest'),
    cors: require('./plugins/cors'),
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
    oauth2TokenParser: require('./plugins/oauth2TokenParser'),

    pre: {
        context: require('./pre/context'),
        dedupeSlashes: require('./pre/dedupeSlashes'),
        pause: require('./pre/pause'),
        sanitizePath: require('./pre/prePath'),
        strictQueryParams: require('./pre/strictQueryParams'),
        userAgentConnection: require('./pre/userAgent')
    }
};
