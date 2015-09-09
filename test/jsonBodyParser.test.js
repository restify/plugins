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


describe('JSON body parser', function () {

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

    it('should parse empty JSON body', function (done) {

        SERVER.use(plugins.jsonBodyParser());

        SERVER.post('/body/:id', function (req, res, next) {
            assert.equal(req.params.id, 'foo');
            assert.deepEqual(req.body, {});
            res.send();
            next();
        });

        CLIENT.post('/body/foo', null, function (err, _, res) {
            assert.notOk(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should parse req.body and req.params independently', function (done) {

        SERVER.use(plugins.jsonBodyParser());

        SERVER.post('/body/:id', function (req, res, next) {
            assert.equal(req.params.id, 'foo');
            assert.equal(req.body.id, 'bar');
            assert.equal(req.body.name, 'alex');
            assert.notDeepEqual(req.body, req.params);
            res.send();
            next();
        });

        CLIENT.post('/body/foo', {
            id: 'bar',
            name: 'alex'
        }, function (err, _, res) {
            assert.notOk(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should fail to map array req.body onto req.params', function (done) {

        SERVER.use(plugins.jsonBodyParser({
            mapParams: true
        }));

        SERVER.post('/body/:id', function (req, res, next) {
            // this handler should never be reached
            res.send();
            next();
        });

        CLIENT.post('/body/foo', [1,2,3], function (err, _, res) {
            assert.ok(err);
            assert.equal(err.name, 'InternalServerError');
            assert.equal(res.statusCode, 500);
            done();
        });
    });

    it('should map req.body onto req.params', function (done) {

        SERVER.use(plugins.jsonBodyParser({
            mapParams: true
        }));

        SERVER.post('/body/:id', function (req, res, next) {
            assert.equal(req.params.id, 'foo');
            assert.equal(req.params.name, 'alex');
            assert.notDeepEqual(req.body, req.params);
            res.send();
            next();
        });

        CLIENT.post('/body/foo', {
            id: 'bar',
            name: 'alex'
        }, function (err, _, res) {
            assert.notOk(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should take req.body and stomp on req.params', function (done) {

        SERVER.use(plugins.jsonBodyParser({
            mapParams: true,
            overrideParams: true
        }));

        SERVER.post('/body/:id', function (req, res, next) {
            assert.equal(req.params.id, 'bar');
            assert.equal(req.params.name, 'alex');
            assert.deepEqual(req.body, req.params);
            res.send();
            next();
        });

        CLIENT.post('/body/foo', {
            id: 'bar',
            name: 'alex'
        }, function (err, _, res) {
            assert.notOk(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should parse JSON body with reviver', function (done) {

        SERVER.use(plugins.jsonBodyParser({
            reviver: function reviver(key, value) {
                if (key === '') {
                    return value;
                }
                return (value + value);
            }
        }));

        SERVER.post('/body/:id', function (req, res, next) {
            assert.equal(req.params.id, 'foo');
            assert.equal(req.body.apple, 'redred');
            assert.equal(req.body.orange, 'orangeorange');
            assert.equal(req.body.banana, 'yellowyellow');
            res.send();
            next();
        });

        CLIENT.post('/body/foo', {
            apple: 'red',
            orange: 'orange',
            banana: 'yellow'
        }, function (err, _, res) {
            assert.notOk(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

});


