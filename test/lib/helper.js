'use strict';

var bunyan = require('bunyan');
var restify = require('restify');

var dtp;

try {
    var d = require('dtrace-provider');
    dtp = d.createDTraceProvider('restifyUnitTest');
} catch (e) {
    dtp = null;
}


module.exports = {
    getLog: function (name, stream, level) {
        return bunyan.createLogger({
            level: (process.env.LOG_LEVEL || level || 'fatal'),
            name: name || process.argv[1],
            stream: stream || process.stdout,
            src: true,
            serializers: restify.bunyan.serializers
        });
    },
    dtrace: dtp
};
