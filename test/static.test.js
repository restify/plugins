'use strict';

// core requires
var fs = require('fs');
var path = require('path');

// external requires
var assert = require('chai').assert;
var mkdirp = require('mkdirp');
var restify = require('restify');
var restifyClients = require('restify-clients');

// local files
var helper = require('./lib/helper');
var plugins = require('../lib');

// local globals
var SERVER;
var CLIENT;
var PORT = 3000;


describe('static resource plugin', function () {

    beforeEach(function (done) {
        SERVER = restify.createServer({
            dtrace: helper.dtrace,
            log: helper.getLog('server')
        });

        SERVER.pre(plugins.serveStatic({
            root: __dirname,
            restifyServer: SERVER
        }));

        SERVER.listen(PORT, '127.0.0.1', function () {
            PORT = SERVER.address().port;
            CLIENT = restifyClients.createStringClient({
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


    it('should serve files', function (done) {

        CLIENT.get('/static.test.js', function(err, req, res, data) {
            assert.ifError(err);
            assert.ok(data);
            assert.isString(data);
            assert.equal(res.headers['content-type'],
						 'application/javascript; charset=utf-8');
			done();
        });
    });

    it('should serve static files in nested folders', function (done) {

        CLIENT.get('/files/data-csv.txt', function(err, req, res, data) {
            assert.ifError(err);
            assert.ok(data);
            assert.isString(data);
            assert.equal(res.headers['content-type'],
                         'text/plain; charset=UTF-8');
			done();
        });
    });

    it('should fire ResourceNotFound for file not found', function (done) {

        var afterFired = 0;

        SERVER.on('after', function(req, res, route, err) {
            afterFired++;
            assert.ok(err);
        });

        CLIENT.get('/idontexist.js', function(err, req, res, data) {
            // arbitrary delay to ensure both events have fired
            setTimeout(function() {
                assert.ok(err);
                assert.equal(afterFired, 1);
                done();
            }, 100);
        });

	});

    it('should emit server\'s after event', function (done) {

        var afterFired = false;

        SERVER.on('after', function(req, res, route, err) {
            afterFired = true;
            assert.ifError(err);
            assert.isObject(req);
            assert.isObject(res);
            assert.isObject(route);
            assert.equal(route.path, '/static.test.js');
        });

        CLIENT.get('/static.test.js', function(err, req, res, data) {
            setTimeout(function() {
                assert.ifError(err);
                assert.ok(data);
                assert.isString(data);
                assert.equal(res.headers['content-type'],
                             'application/javascript; charset=utf-8');
                assert.isTrue(afterFired);
                done();
            }, 100);
        });

    });


    it('should emit error and stop p rocessing for client terminated request',
    function (done) {

    });
});
