// Copyright 2016 Brian Aabel, Inc.  All rights reserved.

'use strict';


// core requires
var http = require('http');
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
var TEST_TOKEN = '18926970-A-nMnSHDqg8Fsunm6Qx1cF1APp';

describe('oauth2 token parser', function () {

    before(function (done) {
        SERVER = restify.createServer({
            dtrace: helper.dtrace,
            log: helper.getLog('server')
        });

        SERVER.use(plugins.jsonBodyParser());
        SERVER.use(plugins.oauth2TokenParser());

        SERVER.get('/', function respond(req, res, next) {

            res.send();
            next();
        });

        SERVER.listen(0, '127.0.0.1', function () {
            PORT = SERVER.address().port;
            CLIENT = restifyClients.createJsonClient({
                url: 'http://127.0.0.1:' + PORT,
                dtrace: helper.dtrace,
                retry: false
            });

            done();
        });
    });

    after(function (done) {
        CLIENT.close();
        SERVER.close(done);
    });


    it('should parse oauth2 token from authorization header', function (done) {
        var opts = {
            path: '/',
            headers: {
                Authorization : 'Bearer ' + TEST_TOKEN
            }
        };
        SERVER.get('/query/:id', function (req, res, next) {
            assert.isNotNull(req.oauth2.accessToken);
            assert.equal(req.oauth2.accessToken, TEST_TOKEN);
            res.send();
            next();
        });
        CLIENT.get(opts, function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });



    });

    it('should do nothing (token is null) if there is no oauth2 token set', function (done) {
        var opts = {
            path: '/test'

        };
        SERVER.get(opts, function (req, res, next) {
            assert.isNull(req.oauth2.accessToken);
            assert.equal(res.statusCode, 200);
            res.send();
            next();
        });
        CLIENT.get(opts, function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });

    });

    it('should parse oauth2 token from request body when content type is application/x-www-form-urlencoded', function (done) {


        SERVER.post('/', function (req, res, next) {
            assert.isNotNull(req.oauth2.accessToken);
            assert.equal(req.oauth2.accessToken, TEST_TOKEN);
            res.send();
            next();
        });

        var opts = {
            path: '/',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }

        CLIENT.post('/', {access_token: TEST_TOKEN},
            function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });

    });

    it('should parse oauth2 token from request body when content type is APPLICATION/x-www-form-urlencoded (case-insensitive)', function (done) {


        SERVER.post('/', function (req, res, next) {
            assert.isNotNull(req.oauth2.accessToken);
            assert.equal(req.oauth2.accessToken, TEST_TOKEN);
            res.send();
            next();
        });

        var opts = {
            path: '/',
            headers: {
                'Content-Type': 'APPLICATION/x-www-form-urlencoded'
            }
        }

        CLIENT.post('/', {access_token: TEST_TOKEN},
            function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });

    });

    it('should ignore token from request body if content type is NOT application/x-www-form-urlencoded', function (done) {


        SERVER.post('/', function (req, res, next) {
            assert.isNull(req.oauth2.accessToken);
            res.send();
            next();
        });

        CLIENT.post('/', {access_token: TEST_TOKEN},
            function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });

    });


    it('should fail if more than one method is used to set the oauth2 token', function (done) {


        SERVER.post('/', function (req, res, next) {
            assert.isNull(req.oauth2.accessToken);
            res.send();
            next();
        });
        var opts = {
            path: '/',
            headers: {
                Authorization : 'Bearer ' + TEST_TOKEN,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }

        CLIENT.post(opts, {access_token: TEST_TOKEN},
            function (err, _, res) {
                assert.ok(err);
                assert.equal(res.statusCode, 400);
                done();
        });

    });


});

