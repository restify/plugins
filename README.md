# restify-plugins

[![NPM Version](https://img.shields.io/npm/v/plugins.svg)](https://npmjs.org/package/plugins)
[![Build Status](https://travis-ci.org/restify/plugins.svg?branch=master)](https://travis-ci.org/restify/plugins)
[![Coverage Status](https://coveralls.io/repos/restify/plugins/badge.svg?branch=master)](https://coveralls.io/r/restify/plugins?branch=master)
[![Dependency Status](https://david-dm.org/restify/plugins.svg)](https://david-dm.org/restify/plugins)
[![devDependency Status](https://david-dm.org/restify/plugins/dev-status.svg)](https://david-dm.org/restify/plugins#info=devDependencies)
[![bitHound Score](https://www.bithound.io/github/restify/plugins/badges/score.svg)](https://www.bithound.io/github/restify/plugins/master)
[![NSP Status](https://img.shields.io/badge/NSP%20status-vulnerabilities%20found-red.svg)](https://travis-ci.org/restify/plugins)

> A collection of core restify plugins

## Getting Started

Install the module with: `npm install restify-plugins`

## Usage

This is the core set of plugins that restify ships with. These include lots of
header parsing handlers, data parsing handlers, as well as other useful logging/metrics handlers.

This module includes the follow `pre` plugins, which are intended to be used
prior to the routing of a request:

* `sanitizePath()` - cleans up duplicate or trailing / on the URL
* `userAgent(options)` - used to support edge cases for HEAD requests when using curl
  * `options.userAgentRegExp` {RegExp} regexp to capture curl user-agents

This module includes the following header parser plugins:

* `acceptParser(accepts)` - Accept header
  * `accepts` {Array} an array of acceptable types
* `authorizationParser(options)` - Authorization header
  * `options` {Object} options object passed to http-signature module
* `conditionalRequest()` - Conditional headers (If-\*)
* `cors(options)` - CORS headers
  * `options.origins` {Array} array of origins servers
  * `options.credentials` {Boolean} if true, sets `Access-Control-Allow-Credentials` on response
  * `options.headers` {Array} array of headers to set on `Access-Control-Expose-Headers`
* `fullResponse()` - handles disappeared CORS headers

This module includes the following data parsing plugins:

* `auditLogger(options)` - an audit logger for recording all handled requests
  * `options.log` {Object} bunyan logger
  * `options.body` {?}
* `bodyParser(options)` - parses POST bodies to `req.body`. automatically uses one of the following parsers based on content type:
  * `urlEncodedBodyParser(options)` - parses url encoded form bodies
  * `jsonBodyParser(options)` - parses JSON POST bodies
  * `multipartBodyParser(options)` - parses multipart form bodies
  * All bodyParsers support the following options:
    * `options.mapParams` - default false. copies parsed post body values onto req.params
    * `options.overrideParams` - default false. only applies when if mapParams true. when true, will stomp on req.params value when existing value is found.
* `jsonp()` - parses JSONP callback
* `queryParser()` - parses URL query paramters
  * `options.mapParams` - default false. copies parsed post body values onto req.params
  * `options.overrideParams` - default false. only applies when if mapParams true. when true, will stomp on req.params value when existing value is found.
* `requestLogger(options)` - adds timers for each handler in your request chain
  * `options.properties` {Object} properties to pass to bunyan's `log.child()` method

The module includes the following response plugins:

* `dateParser(delta)` - expires requests based on current time + delta
  * `delta` {Number} age in seconds
* `gzip(options)` - gzips the response if client accepts it
  * `options` {Object} options to pass to zlib
* `serveStatic()` - used to serve static files
* `throttle(options)` - throttles responses
  * `options.burst` {Number}
  * `options.rate` {Number}
  * `options.ip` {Boolean}
  * `options.username` {Boolean}
  * `options.xff` {Boolean}
  * `options.overrides` {Object}
* `requestExpiry(options)` - expires requests based on absolute time since epoch
  * `options.header` {String} name of header to check


## Contributing

Add unit tests for any new or changed functionality. Ensure that lint and style
checks pass.

To start contributing, install the git pre-push hooks:

```sh
make githooks
```

Before committing, run the prepush hook:

```sh
make prepush
```

If you have style errors, you can auto fix whitespace issues by running:

```sh
make codestyle-fix
```

## License

Copyright (c) 2015 Alex Liu

Licensed under the MIT license.
