'use strict';

// external requires
var assert = require('chai').assert;
var restify = require('restify');
var restifyClients = require('restify-clients');

// local files
var helper = require('./lib/helper');
var plugins = require('../lib');

// local globals
var SERVER;
var CLIENT;
var PORT;

describe('request expiry parser', function () {

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


    it('should timeout due to request expiry', function (done) {
        var key = 'x-request-expiry';
        var getPath = '/request/expiry';
        var called = false;

        SERVER.use(plugins.requestExpiry({ header: key }));
        SERVER.get(getPath, function (req, res, next) {
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
            assert.ok(err);
            assert.equal(res.statusCode, 504);
            assert.equal(called, false);
            done();
        });
    });


    it('should not timeout due to request expiry', function (done) {
        var key = 'x-request-expiry';
        var getPath = '/request/expiry';
        var called = false;

        SERVER.use(plugins.requestExpiry({ header: key }));
        SERVER.get(getPath, function (req, res, next) {
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
            assert.equal(res.statusCode, 200);
            assert.equal(called, true);
            assert.ifError(err);
            done();
        });
    });


    it('should be ok even with request expiry header', function (done) {
        var key = 'x-request-expiry';
        var getPath = '/request/expiry';
        var called = false;

        SERVER.use(plugins.requestExpiry({ header: key }));
        SERVER.get(getPath, function (req, res, next) {
            called = true;
            res.send();
            next();
        });

        var obj = {
            path: getPath,
            headers: { }
        };

        CLIENT.get(obj, function (err, _, res) {
            assert.equal(res.statusCode, 200);
            assert.equal(called, true);
            assert.ifError(err);
            done();
        });
    });

});
