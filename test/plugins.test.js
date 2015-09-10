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

    describe('request logger', function () {

        it('tests the requestLoggers extra header properties', function (done) {
            var key = 'x-request-uuid';
            var badKey = 'x-foo-bar';
            var getPath = '/requestLogger/extraHeaders';
            var headers = [key, badKey];

            SERVER.use(plugins.requestLogger({headers: headers}));
            SERVER.get(getPath, function (req, res, next) {
                assert.equal(req.log.fields[key], 'foo-for-eva');
                assert.equal(req.log.fields.hasOwnProperty(badKey), false);
                res.send();
                next();
            });

            var obj = {
                path: getPath,
                headers: { }
            };
            obj.headers[key] = 'foo-for-eva';
            CLIENT.get(obj, function (err, _, res) {
                assert.equal(res.statusCode, 200);
                assert.ifError(err);
                done();
            });
        });

    });

});

