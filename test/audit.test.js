'use strict';

// external requires
var assert = require('chai').assert;
var bunyan = require('bunyan');
var restify = require('restify');
var restifyClients = require('restify-clients');

// local files
var helper = require('./lib/helper');
var plugins = require('../lib');

// local globals
var SERVER;
var CLIENT;
var PORT;

describe('audit logger', function () {

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
                retry: false
            });

            done();
        });
    });

    afterEach(function (done) {
        CLIENT.close();
        SERVER.close(done);
    });


    it('should log handler timers', function (done) {
        // Dirty hack to capture the log record using a ring buffer.
        var ringbuffer = new bunyan.RingBuffer({ limit: 1 });

        SERVER.once('after', plugins.auditLogger({
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
            // this really should be 1000 but make it 1100 so that the tests
            // don't sporadically fail due to timing issues.
        });

        CLIENT.get('/audit', function (err, req, res) {
            assert.ifError(err);

            var record = ringbuffer.records && ringbuffer.records[0];

            // check timers
            assert.ok(record, 'no log records');
            assert.equal(
                ringbuffer.records.length, 1,
                'should only have 1 log record'
            );
            assert.ok(
                record.req.timers.aTestHandler > 1000000,
                'atestHandler should be > 1000000'
            );
            assert.ok(
                record.req.timers['aTestHandler-audit-sub'] > 1000000,
                'aTestHandler-audit-sub should be > 1000000'
            );

            var handlers = Object.keys(record.req.timers);
            assert.equal(
                handlers[handlers.length - 2],
                'aTestHandler-audit-sub',
                'sub handler timer not in order'
            );
            assert.equal(
                handlers[handlers.length - 1],
                'aTestHandler',
                'aTestHandler not last'
            );
            done();
        });
    });


    it('should log anonymous handler timers', function (done) {
        this.timeout(5000);

        // Dirty hack to capture the log record using a ring buffer.
        var ringbuffer = new bunyan.RingBuffer({ limit: 1 });

        SERVER.once('after', plugins.auditLogger({
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
            assert.ifError(err);

            // check timers
            var record = ringbuffer.records && ringbuffer.records[0];
            assert.ok(record, 'no log records');
            assert.equal(
                ringbuffer.records.length, 1,
                'should only have 1 log record'
            );
            assert.ok(
                record.req.timers['handler-0'] > 1000000,
                'handler-0 should be > 1000000'
            );
            assert.ok(
                record.req.timers['handler-1'] > 1000000,
                'handler-1 should be > 1000000'
            );
            assert.ok(
                record.req.timers['handler-1-audit-sub'] > 1000000,
                'handler-0-audit-sub should be > 1000000'
            );

            var handlers = Object.keys(record.req.timers);
            assert.equal(handlers[handlers.length - 2], 'handler-1-audit-sub',
                    'sub handler timer not in order');
            assert.equal(handlers[handlers.length - 1], 'handler-1',
                    'handler-1 not last');
            done();
        });
    });


    it('restify-GH-812 audit logger has query params string', function (done) {

        // Dirty hack to capture the log record using a ring buffer.
        var ringbuffer = new bunyan.RingBuffer({ limit: 1 });

        SERVER.once('after', plugins.auditLogger({
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
            assert.ifError(err);

            // check timers
            assert.ok(ringbuffer.records[0], 'no log records');
            assert.equal(
                ringbuffer.records.length, 1,
                'should only have 1 log record'
            );
            assert.ok(ringbuffer.records[0].req.query, 'a=1&b=2');
            done();
        });
    });


    it('restify-GH-812 audit logger has query params obj', function (done) {

        // Dirty hack to capture the log record using a ring buffer.
        var ringbuffer = new bunyan.RingBuffer({ limit: 1 });

        SERVER.once('after', plugins.auditLogger({
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
            plugins.queryParser(),
            function (req, res, next) {
                res.send();
                next();
            }
        ]);

        CLIENT.get('/audit?a=1&b=2', function (err, req, res) {
            assert.ifError(err);

            // check timers
            assert.ok(ringbuffer.records[0], 'no log records');
            assert.equal(
                ringbuffer.records.length, 1,
                'should only have 1 log record'
            );
            assert.deepEqual(
                ringbuffer.records[0].req.query,
                { a: '1', b: '2'}
            );
            done();
        });
    });

});
