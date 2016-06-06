'use strict';

// core requires
var fs = require('fs');
var path = require('path');

// external requires
var assert = require('chai').assert;
var mkdirp = require('mkdirp');
var restify = require('restify');
var restifyClients = require('restify-clients');
var rimraf = require('rimraf');

// local files
var helper = require('./lib/helper');
var plugins = require('../lib');

// local globals
var SERVER;
var CLIENT;
var PORT;
var FILES_TO_DELETE = [];
var DIRS_TO_DELETE = [];



describe('static resource plugin', function () {

    beforeEach(function (done) {
        SERVER = restify.createServer({
            dtrace: helper.dtrace,
            log: helper.getLog('server')
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

    afterEach(function (done) {
        var i;

        for (i = 0; i < FILES_TO_DELETE.length; ++i) {
            try {
                fs.unlinkSync(FILES_TO_DELETE[i]);
            }
            catch (err) {
                /* normal */
            }
        }

        for (i = 0; i < DIRS_TO_DELETE.length; ++i) {
            try {
                rimraf.sync(DIRS_TO_DELETE[i]);
            }
            catch (err) {
                /* normal */
            }
        }

        CLIENT.close();
        SERVER.close(done);
    });


    function serveStaticTest(done, testDefault, tmpDir, regex, staticFile) {
        var staticContent = '{"content": "abcdefg"}';
        var staticObj = JSON.parse(staticContent);
        var testDir = 'public';
        var testFileName = 'index.json';
        var routeName = 'GET wildcard';
        var tmpPath = path.join(__dirname, '../', tmpDir);

        mkdirp(tmpPath, function (err) {
            assert.ifError(err);
            DIRS_TO_DELETE.push(tmpPath);
            var folderPath = path.join(tmpPath, testDir);

            mkdirp(folderPath, function (err2) {
                assert.ifError(err2);

                DIRS_TO_DELETE.push(folderPath);
                var file = path.join(folderPath, testFileName);

                fs.writeFile(file, staticContent, function (err3) {
                    assert.ifError(err3);
                    FILES_TO_DELETE.push(file);
                    var p = '/' + testDir + '/' + testFileName;
                    var opts = { directory: tmpPath };

                    if (staticFile) {
                        opts.file = p;
                    }

                    if (testDefault) {
                        opts.defaultFile = testFileName;
                        routeName += ' with default';
                    }
                    var re = regex ||
                        new RegExp('/' + testDir + '/?.*');

                    SERVER.get({
                        path: re,
                        name: routeName
                    }, plugins.serveStatic(opts));

                    CLIENT.get(p, function (err4, req, res, obj) {
                        assert.ifError(err4);
                        assert.equal(res.headers['cache-control'],
                            'public, max-age=3600');
                        assert.deepEqual(obj, staticObj);
                        done();
                    });
                });
            });
        });

    }

    it('static serves static files', function (done) {
        serveStaticTest(done, false, '.tmp');
    });


    it('static serves static files in nested folders', function (done) {
        serveStaticTest(done, false, '.tmp/folder');
    });


    it('static serves static files in with a root regex', function (done) {
        serveStaticTest(done, false, '.tmp', new RegExp('/.*'));
    });


    it('static serves static files with a root, !greedy, regex',
    function (done) {
        serveStaticTest(done, false, '.tmp', new RegExp('/?.*'));
    });


    it('static serves default file', function (done) {
        serveStaticTest(done, true, '.tmp');
    });


    it('restify-GH-379 static serves file with parentheses in path',
    function (done) {
        serveStaticTest(done, false, '.(tmp)');
    });


    it('restify-GH-719 serve a specific static file', function (done) {
        // serve the same default file .tmp/public/index.json
        // but get it from opts.file
        serveStaticTest(done, false, '.tmp', null, true);
    });

});
