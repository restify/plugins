'use strict';

// external modules
var assert = require('chai').assert;
var restify = require('restify');
var restifyClients = require('restify-clients');

// local files
var plugins = require('../lib');
var helper = require('./lib/helper');

// local globals
var PORT = 3000;
var CLIENT;
var SERVER;
var AC_ALLOW_CREDS = 'access-control-allow-credentials';
var AC_ALLOW_ORIGIN = 'access-control-allow-origin';
var AC_MAX_AGE = 'access-control-max-age';



function setupCors(options) {

    if (!options.preflightStrategy) {
        options.preflightStrategy = SERVER;
    }

    var cors = plugins.cors(options);
    SERVER.pre(cors.preflight);
    SERVER.use(cors.headers);
}


function preflight(options, callback) {

    var opts = {
        path: options.path || '/foo/bar',
        headers: options.headers
    };

    CLIENT = restifyClients.createJsonClient({
        url: 'http://127.0.0.1:' + PORT,
        dtrace: helper.dtrace,
        retry: false,
        headers: opts.headers
    });

    CLIENT.opts(opts.path, callback);
}


describe('CORS', function () {

    beforeEach(function (done) {
        SERVER = restify.createServer({
            dtrace: helper.dtrace,
            log: helper.getLog('server')
        });
        SERVER.post('/foo/:id', function tester (req, res, next) {});
        SERVER.listen(PORT, function () {
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
            }, function (err, req, res, data) {
                assert.ifError(err);
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
            }, function (err, req, res, data) {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers[AC_ALLOW_ORIGIN], '*');
                assert.equal(res.headers[AC_ALLOW_CREDS], undefined);
                done();
            });
        });

        it('should return 400 for non matching origin', function (done) {

            setupCors({
                origins: [ 'http://somesite.local' ]
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://anysite.local'
                }
            }, function (err, req, res, data) {
                assert.ok(err);
                assert.equal(res.statusCode, 400);
                assert.equal(res.headers[AC_ALLOW_ORIGIN], undefined);
                assert.equal(res.headers[AC_ALLOW_CREDS], undefined);
                done();
            });
        });

        it('should return 400 for unsupported resource', function (done) {

            setupCors({
                credentials: true,
                origins: [ 'http://somesite.local' ]
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'GET',
                    Origin: 'http://somesite.local'
                },
                path: '/bar/baz'
            }, function (err, req, res, data) {
                assert.ok(err);
                assert.equal(res.statusCode, 400);
                assert.equal(res.headers[AC_ALLOW_ORIGIN], undefined);
                assert.equal(res.headers[AC_ALLOW_CREDS], undefined);
                done();
            });
        });

        it('should return 405 for unsupported method', function (done) {

            setupCors({
                credentials: true,
                origins: [ 'http://somesite.local' ]
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'GET',
                    Origin: 'http://somesite.local'
                }
            }, function (err, req, res, data) {
                assert.ok(err);
                assert.equal(res.statusCode, 405);
                assert.equal(res.headers[AC_ALLOW_ORIGIN], undefined);
                assert.equal(res.headers[AC_ALLOW_CREDS], undefined);
                done();
            });
        });

        it('should not return * for credentialed request', function (done) {

            setupCors({
                origins: [ 'http://somesite.local' ],
                credentials: true
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (err, req, res, data) {
                assert.ifError(err);
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
            }, function (err, req, res, data) {
                assert.ok(err);
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
                allowHeaders: ['x-foobar']
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type,' +
                                                      ' x-foobar',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (err, req, res, data) {
                assert.ifError(err);
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
            }, function (err, req, res, data) {
                assert.ifError(err);
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
                preflightMaxAge: 1000
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (err, req, res, data) {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers[AC_ALLOW_ORIGIN],
                             'http://somesite.local');
                assert.equal(res.headers[AC_MAX_AGE], 1000);
                done();
            });
        });

        it('should not continue after preflight handler', function (done) {

            setupCors({
                origins: [ 'somesite.local' ]
            });

            SERVER.use(function foo(req, res, next) {
                res.send('foo');
                return next();
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (err, req, res, data) {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                assert.notEqual(data, 'foo');
                done();
            });

        });
    });

    describe('regexp matching', function () {

        it('should allow any protocol for origin', function (done) {

            setupCors({
                origins: [ 'somesite.local' ]
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://somesite.local'
                }
            }, function (err, req, res, data) {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers['access-control-allow-origin'],
                    'http://somesite.local');
                done();
            });
        });

        it('should allow any subdomain for origin', function (done) {

            setupCors({
                origins: [ 'http://*.somesite.local' ]
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'http://test.somesite.local'
                }
            }, function (err, req, res, data) {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers['access-control-allow-origin'],
                    'http://test.somesite.local');
                done();
            });
        });

        it('should allow any subdomain, any protocol', function (done) {

            setupCors({
                origins: [ '*.somesite.local' ]
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'https://test.somesite.local'
                }
            }, function (err, req, res, data) {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers['access-control-allow-origin'],
                    'https://test.somesite.local');
                done();
            });
        });

        it('should allow regular expression', function (done) {
            setupCors({
                origins: [ /^https?:\/\/test[0-9]+\.somesite\.local$/ ]
            });

            preflight({
                headers: {
                    'Access-Control-Request-Headers': 'accept, content-type',
                    'Access-Control-Request-Method': 'POST',
                    Origin: 'https://test1.somesite.local'
                }
            }, function (err, req, res, data) {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers['access-control-allow-origin'],
                    'https://test1.somesite.local');
                done();
            });
        });
    });


    describe('cors headers', function () {



    });
});
