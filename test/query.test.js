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


describe('query parser', function () {

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


    it('GH-124 should return empty query', function (done) {
        SERVER.use(plugins.queryParser());

        SERVER.get('/query/:id', function (req, res, next) {
            assert.equal(req.getQuery(), '');
            assert.deepEqual(req.query, {});
            res.send();
            next();
        });

        CLIENT.get('/query/foo', function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should parse req.query and req.params independently', function (done) {
        SERVER.use(plugins.queryParser());

        SERVER.get('/query/:id', function (req, res, next) {
            assert.equal(req.query.id, 'bar');
            assert.equal(req.query.name, 'markc');
            assert.equal(req.params.id, 'foo');
            assert.notDeepEqual(req.query, req.params);
            res.send();
            next();
        });

        CLIENT.get('/query/foo?id=bar&name=markc', function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should map req.query onto req.params', function (done) {
        SERVER.use(plugins.queryParser({
            mapParams: true
        }));

        SERVER.get('/query/:id', function (req, res, next) {
            assert.equal(req.params.id, 'foo');
            assert.equal(req.params.name, 'markc');
            res.send();
            next();
        });

        CLIENT.get('/query/foo?id=bar&name=markc', function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should take req.query and stomp on req.params', function (done) {
        SERVER.use(plugins.queryParser({
            mapParams: true,
            overrideParams: true
        }));

        SERVER.get('/query/:id', function (req, res, next) {
            assert.equal(req.params.id, 'bar');
            assert.equal(req.params.name, 'markc');
            assert.deepEqual(req.query, req.params);
            res.send();
            next();
        });

        CLIENT.get('/query/foo?id=bar&name=markc', function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should parse associative array syntax', function (done) {
        SERVER.use(plugins.queryParser());

        SERVER.get('/query/:id', function (req, res, next) {
            assert.equal(req.params.id, 'foo');
            assert.isObject(req.query.name);
            assert.equal(req.query.name.first, 'mark');
            assert.equal(req.query.name.last, 'cavage');
            res.send();
            next();
        });

        var p = '/query/foo?name[first]=mark&name[last]=cavage';
        CLIENT.get(p, function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should parse array syntax', function (done) {
        SERVER.use(plugins.queryParser());

        SERVER.get('/query/:id', function (req, res, next) {
            assert.equal(req.params.id, 'foo');
            assert.isArray(req.query.char);
            assert.deepEqual(req.query.char, ['a', 'b', 'c']);
            res.send();
            next();
        });

        var p = '/query/foo?char[]=a&char[]=b&char[]=c';
        CLIENT.get(p, function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should parse nested array syntax', function (done) {
        SERVER.use(plugins.queryParser());

        SERVER.get('/query/:id', function (req, res, next) {
            assert.equal(req.params.id, 'foo');
            assert.isObject(req.query.pizza);
            assert.isArray(req.query.pizza.left);
            assert.isArray(req.query.pizza.right);
            assert.deepEqual(req.query.pizza.left, ['ham', 'bacon']);
            assert.deepEqual(req.query.pizza.right, ['pineapple']);
            res.send();
            next();
        });

        var p = '/query/foo?pizza[left][]=ham&pizza[left][]=bacon&' +
                'pizza[right][]=pineapple';
        CLIENT.get(p, function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });
});


