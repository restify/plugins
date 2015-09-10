// Copyright 2012 Mark Cavage, Inc.  All rights reserved.

'use strict';

// external requires
var assert = require('chai').assert;
var restify = require('restify');
var restifyClients = require('restify-clients');

// local files
var plugins = require('../lib');
var helper = require('./lib/helper');

// local globals
var PORT = process.env.UNIT_TEST_PORT || 0;
var CLIENT;
var SERVER;


describe('all other plugins', function () {

    beforeEach(function (done) {
        SERVER = restify.createServer({
            dtrace: helper.dtrace,
            log: helper.getLog('server')
        });

        SERVER.listen(PORT, '127.0.0.1', function () {
            PORT = SERVER.address().port;
            CLIENT = restifyClients.createJsonClient({
                url: 'http://127.0.0.1:' + PORT,
                dtrace: helper.dtrace,
                retry: false,
                agent: false
            });

            done();
        });
    });


    afterEach(function (done) {
        SERVER.close(done);
    });


    describe('date parser', function () {

        it('should reject expired request', function (done) {
            SERVER.use(plugins.dateParser());

            SERVER.get('/', function respond(req, res, next) {
                res.send();
                next();
            });

            var opts = {
                path: '/',
                headers: {
                    date: 'Tue, 15 Nov 1994 08:12:31 GMT'
                }
            };

            CLIENT.get(opts, function (err, _, res) {
                assert.ok(err);
                assert.ok(/Date header .+ is too old/.test(err.message));
                assert.equal(res.statusCode, 400);
                done();
            });
        });
    });



});

/*










test('static serves static files', function (t) {
    serveStaticTest(t, false, '.tmp');
});


test('static serves static files in nested folders', function (t) {
    serveStaticTest(t, false, '.tmp/folder');
});


test('static serves static files in with a root regex', function (t) {
    serveStaticTest(t, false, '.tmp', new RegExp('/.*'));
});


test('static serves static files with a root, !greedy, regex', function (t) {
    serveStaticTest(t, false, '.tmp', new RegExp('/?.*'));
});


test('static serves default file', function (t) {
    serveStaticTest(t, true, '.tmp');
});


test('GH-379 static serves file with parentheses in path', function (t) {
    serveStaticTest(t, false, '.(tmp)');
});


test('GH-719 serve a specific static file', function (t) {
    // serve the same default file .tmp/public/index.json
    // but get it from opts.file
    serveStaticTest(t, false, '.tmp', null, true);
});


test('audit logger timer test', function (t) {
    // Dirty hack to capture the log record using a ring buffer.
    var ringbuffer = new bunyan.RingBuffer({ limit: 1 });

    SERVER.once('after', restify.auditLogger({
        log: bunyan.createLogger({
            name: 'audit',
            streams:[ {
                level: 'info',
                type: 'raw',
                stream: ringbuffer
            }]
        })
    }));

    SERVER.get('/audit', function aTestHandler(req, res, next) {
        req.startHandlerTimer('audit-sub');

        setTimeout(function () {
            req.endHandlerTimer('audit-sub');
            res.send('');
            return (next());
        }, 1100);
        // this really should be 1000 but make it 1100 so that the tests don't
        // sporadically fail due to timing issues.
    });

    CLIENT.get('/audit', function (err, req, res) {
        t.ifError(err);

        // check timers
        t.ok(ringbuffer.records[0], 'no log records');
        t.equal(ringbuffer.records.length, 1, 'should only have 1 log record');
        t.ok(ringbuffer.records[0].req.timers.aTestHandler > 1000000,
             'atestHandler should be > 1000000');
        t.ok(ringbuffer.records[0].req.timers['aTestHandler-audit-sub'] >
             1000000, 'aTestHandler-audit-sub should be > 1000000');
        var handlers = Object.keys(ringbuffer.records[0].req.timers);
        t.equal(handlers[handlers.length - 2], 'aTestHandler-audit-sub',
                'sub handler timer not in order');
        t.equal(handlers[handlers.length - 1], 'aTestHandler',
                'aTestHandler not last');
        t.end();
    });
});


test('audit logger anonymous timer test', function (t) {
    // Dirty hack to capture the log record using a ring buffer.
    var ringbuffer = new bunyan.RingBuffer({ limit: 1 });

    SERVER.once('after', restify.auditLogger({
        log: bunyan.createLogger({
            name: 'audit',
            streams:[ {
                level: 'info',
                type: 'raw',
                stream: ringbuffer
            }]
        })
    }));

    SERVER.get('/audit', function (req, res, next) {
        setTimeout(function () {
            return (next());
        }, 1000);
    }, function (req, res, next) {
        req.startHandlerTimer('audit-sub');

        setTimeout(function () {
            req.endHandlerTimer('audit-sub');
            res.send('');
            return (next());
        }, 1000);
    });

    CLIENT.get('/audit', function (err, req, res) {
        t.ifError(err);

        // check timers
        t.ok(ringbuffer.records[0], 'no log records');
        t.equal(ringbuffer.records.length, 1, 'should only have 1 log record');
        t.ok(ringbuffer.records[0].req.timers['handler-0'] > 1000000,
             'handler-0 should be > 1000000');
        t.ok(ringbuffer.records[0].req.timers['handler-1'] > 1000000,
             'handler-1 should be > 1000000');
        t.ok(ringbuffer.records[0].req.timers['handler-1-audit-sub'] >
             1000000, 'handler-0-audit-sub should be > 1000000');
        var handlers = Object.keys(ringbuffer.records[0].req.timers);
        t.equal(handlers[handlers.length - 2], 'handler-1-audit-sub',
                'sub handler timer not in order');
        t.equal(handlers[handlers.length - 1], 'handler-1',
                'handler-1 not last');
        t.end();
    });
});


test('GH-812 audit logger has query params string', function (t) {

    // Dirty hack to capture the log record using a ring buffer.
    var ringbuffer = new bunyan.RingBuffer({ limit: 1 });

    SERVER.once('after', restify.auditLogger({
        log: bunyan.createLogger({
            name: 'audit',
            streams:[ {
                level: 'info',
                type: 'raw',
                stream: ringbuffer
            }]
        })
    }));

    SERVER.get('/audit', function (req, res, next) {
        res.send();
        next();
    });

    CLIENT.get('/audit?a=1&b=2', function (err, req, res) {
        t.ifError(err);

        // check timers
        t.ok(ringbuffer.records[0], 'no log records');
        t.equal(ringbuffer.records.length, 1, 'should only have 1 log record');
        t.ok(ringbuffer.records[0].req.query, 'a=1&b=2');
        t.end();
    });
});


test('GH-812 audit logger has query params obj', function (t) {

    // Dirty hack to capture the log record using a ring buffer.
    var ringbuffer = new bunyan.RingBuffer({ limit: 1 });

    SERVER.once('after', restify.auditLogger({
        log: bunyan.createLogger({
            name: 'audit',
            streams:[ {
                level: 'info',
                type: 'raw',
                stream: ringbuffer
            }]
        })
    }));

    SERVER.get('/audit', [
        restify.queryParser(),
        function (req, res, next) {
            res.send();
            next();
        }
    ]);

    CLIENT.get('/audit?a=1&b=2', function (err, req, res) {
        t.ifError(err);

        // check timers
        t.ok(ringbuffer.records[0], 'no log records');
        t.equal(ringbuffer.records.length, 1, 'should only have 1 log record');
        t.deepEqual(ringbuffer.records[0].req.query, { a: 1, b: 2});
        t.end();
    });
});


test('GH-774 utf8 corruption in body parser', function (t) {
    var slen = 100000;

    SERVER.post('/utf8',
        restify.bodyParser({ mapParams: false }),
        function (req, res, next) {
            t.notOk(/\ufffd/.test(req.body.text));
            t.equal(req.body.text.length, slen);
            res.send({ len: req.body.text.length });
            next();
        });

    // create a long string of unicode characters
    var tx = '';

    for (var i = 0; i < slen; ++i) {
        tx += '\u2661';
    }

    CLIENT.post('/utf8', { text: tx }, function (err, _, res) {
        t.ifError(err);
        t.equal(res.statusCode, 200);
        t.end();
    });
});


test('request expiry testing to ensure that invalid ' +
     'requests will error.', function (t) {
    var key = 'x-request-expiry';
    var getPath = '/request/expiry';
    var called = false;
    var expires = restify.requestExpiry({ header: key });
    SERVER.get(
        getPath,
        expires,
        function (req, res, next) {
            called = true;
            res.send();
            next();
        });

    var obj = {
        path: getPath,
        headers: {
            'x-request-expiry': Date.now() - 100
        }
    };
    CLIENT.get(obj, function (err, _, res) {
        t.equal(res.statusCode, 504);
        t.equal(called, false);
        t.end();
    });
});


test('request expiry testing to ensure that valid ' +
     'requests will succeed.', function (t) {
    var key = 'x-request-expiry';
    var getPath = '/request/expiry';
    var called = false;
    var expires = restify.requestExpiry({ header: key });
    SERVER.get(
        getPath,
        expires,
        function (req, res, next) {
            called = true;
            res.send();
            next();
        });

    var obj = {
        path: getPath,
        headers: {
            'x-request-expiry': Date.now() + 100
        }
    };
    CLIENT.get(obj, function (err, _, res) {
        t.equal(res.statusCode, 200);
        t.equal(called, true);
        t.ifError(err);
        t.end();
    });
});


test('request expiry testing to ensure that valid ' +
     'requests without headers will succeed.', function (t) {
    var key = 'x-request-expiry';
    var getPath = '/request/expiry';
    var called = false;
    var expires = restify.requestExpiry({ header: key });
    SERVER.get(
        getPath,
        expires,
        function (req, res, next) {
            called = true;
            res.send();
            next();
        });

    var obj = {
        path: getPath,
        headers: { }
    };
    CLIENT.get(obj, function (err, _, res) {
        t.equal(res.statusCode, 200);
        t.equal(called, true);
        t.ifError(err);
        t.end();
    });
});

test('tests the requestLoggers extra header properties', function (t) {
    var key = 'x-request-uuid';
    var badKey = 'x-foo-bar';
    var getPath = '/requestLogger/extraHeaders';
    var headers = [key, badKey];
    SERVER.get(
        getPath,
        restify.requestLogger({headers: headers}),
        function (req, res, next) {
            t.equal(req.log.fields[key], 'foo-for-eva');
            t.equal(req.log.fields.hasOwnProperty(badKey), false);
            res.send();
            next();
        });

    var obj = {
        path: getPath,
        headers: { }
    };
    obj.headers[key] = 'foo-for-eva';
    CLIENT.get(obj, function (err, _, res) {
        t.equal(res.statusCode, 200);
        t.ifError(err);
        t.end();
    });
});


*/
