// Copyright 2016 Brian Aabel, Inc.  All rights reserved.

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
                Authorization : 'Bearer cn389ncoiwuencr'
            }
        };
        SERVER.get('/query/:id', function (req, res, next) {
            assert.isNotNull(req.oauth2.accessToken);
            assert.equal(req.oauth2.accessToken, 'cn389ncoiwuencr');
            res.send();
            next();
        });
        CLIENT.get(opts, function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });



    });

    it('should parse oauth2 token from query string', function (done) {
        var opts = {
            path: '/?access_token=cn389ncoiwuencr'

        };
        SERVER.get(opts, function (req, res, next) {
            assert.isNotNull(req.oauth2.accessToken);
            assert.equal(req.oauth2.accessToken, 'cn389ncoiwuencr');
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

    it('should parse oauth2 token from request body', function (done) {


        SERVER.post('/', function (req, res, next) {
            assert.isNotNull(req.oauth2.accessToken);
            assert.equal(req.oauth2.accessToken, 'cn389ncoiwuencr');
            res.send();
            next();
        });
        CLIENT.post('/', {access_token: 'cn389ncoiwuencr'},
            function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });

    });


});

