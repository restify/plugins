'use strict';

// core modules
var http = require('http');

// external modules
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
var AC_ALLOW_CREDS = 'access-control-allow-credentials';
var AC_ALLOW_ORIGIN = 'access-control-allow-origin';
var AC_MAX_AGE = 'access-control-max-age';



function setupCors(options) {
    var cors = plugins.cors(options);
    SERVER.pre(cors.preflight);
    SERVER.use(cors.headers);
}


function preflight(options, callback) {

    var opts = {
        hostname: '127.0.0.1',
        port: PORT,
        path: options.path || '/foo/bar',
        method: 'OPTIONS',
        agent: false,
        headers: options.headers
    };

    http.request(opts, callback).end();
}


describe('CORS', function () {

    beforeEach(function (done) {
        SERVER = restify.createServer({
            dtrace: helper.dtrace,
            log: helper.getLog('server'),
            version: ['2.0.0', '0.5.4', '1.4.3']
        });
        SERVER.post('/foo/:id', function tester (req, res, next) {});
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


    describe('preflight', function () {

        it('should return host for matching origin', function (done) {

            setupCors({
                origins: [ 'http://somesite.local' ],
                preflightStrategy: SERVER
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (res) {
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers[AC_ALLOW_ORIGIN],
                             'http://somesite.local');
                assert.equal(res.headers[AC_ALLOW_CREDS], undefined);
                done();
            });
        });

        it('should return * for any origin', function (done) {

            setupCors({
                origins: [ 'http://somesite.local', '*' ],
                preflightStrategy: SERVER
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://anysite.local'
                }
            }, function (res) {
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers[AC_ALLOW_ORIGIN], '*');
                assert.equal(res.headers[AC_ALLOW_CREDS], undefined);
                done();
            });
        });

        it('should return 400 for non matching origin', function (done) {

            setupCors({
                origins: [ 'http://somesite.local' ],
                preflightStrategy: SERVER
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://anysite.local'
                }
            }, function (res) {
                assert.equal(res.statusCode, 400);
                assert.equal(res.headers[AC_ALLOW_ORIGIN], undefined);
                assert.equal(res.headers[AC_ALLOW_CREDS], undefined);
                done();
            });
        });

        it('should return 400 for unsupported resource', function (done) {

            setupCors({
                credentials: true,
                origins: [ 'http://somesite.local' ],
                preflightStrategy: SERVER
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'GET',
                    Origin: 'http://somesite.local'
                },
                path: '/bar/baz'
            }, function (res) {
                assert.equal(res.statusCode, 400);
                assert.equal(res.headers[AC_ALLOW_ORIGIN], undefined);
                assert.equal(res.headers[AC_ALLOW_CREDS], undefined);
                done();
            });
        });

        it('should return 405 for unsupported method', function (done) {

            setupCors({
                credentials: true,
                origins: [ 'http://somesite.local' ],
                preflightStrategy: SERVER
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'GET',
                    Origin: 'http://somesite.local'
                }
            }, function (res) {
                assert.equal(res.statusCode, 405);
                assert.equal(res.headers[AC_ALLOW_ORIGIN], undefined);
                assert.equal(res.headers[AC_ALLOW_CREDS], undefined);
                done();
            });
        });

        it('should not return * for credentialed request', function (done) {

            setupCors({
                origins: [ 'http://somesite.local' ],
                credentials: true,
                preflightStrategy: SERVER
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (res) {
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers[AC_ALLOW_ORIGIN],
                             'http://somesite.local');
                assert.equal(res.headers[AC_ALLOW_CREDS], 'true');
                done();
            });

        });

        it('should return 400 for headers not in whitelist', function (done) {

            setupCors({
                origins: [ 'http://somesite.local' ],
                credentials: true,
                preflightStrategy: SERVER
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type,' +
                                                      ' x-foobar',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (res) {
                assert.equal(res.statusCode, 400);
                assert.equal(res.headers[AC_ALLOW_ORIGIN], undefined);
                assert.equal(res.headers[AC_ALLOW_CREDS], undefined);
                done();
            });
        });

        it('should return 200 for headers in whitelist', function (done) {

            setupCors({
                origins: [ 'http://somesite.local' ],
                credentials: true,
                preflightStrategy: SERVER,
                allowHeaders: ['x-foobar']
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type,' +
                                                      ' x-foobar',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (res) {
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers[AC_ALLOW_ORIGIN],
                             'http://somesite.local');
                assert.equal(res.headers[AC_ALLOW_CREDS], 'true');
                done();
            });
        });

        it('should default to 5 min preflight cache timeout', function (done) {

            setupCors({
                origins: [ 'http://somesite.local' ],
                preflightStrategy: SERVER
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (res) {
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers[AC_ALLOW_ORIGIN],
                             'http://somesite.local');
                assert.equal(res.headers[AC_MAX_AGE], 3600);
                done();
            });
        });

        it('should set custom preflight cache timeout', function (done) {

            setupCors({
                origins: [ 'http://somesite.local' ],
                preflightMaxAge: 1000,
                preflightStrategy: SERVER
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (res) {
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers[AC_ALLOW_ORIGIN],
                             'http://somesite.local');
                assert.equal(res.headers[AC_MAX_AGE], 1000);
                done();
            });
        });
    });


    describe('cors headers', function () {





    });
});
