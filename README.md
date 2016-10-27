# restify-plugins

[![NPM Version](https://img.shields.io/npm/v/restify-plugins.svg)](https://npmjs.org/package/restify-plugins)
[![Build Status](https://travis-ci.org/restify/plugins.svg?branch=master)](https://travis-ci.org/restify/plugins)
[![Coverage Status](https://coveralls.io/repos/restify/plugins/badge.svg?branch=master)](https://coveralls.io/r/restify/plugins?branch=master)
[![Dependency Status](https://david-dm.org/restify/plugins.svg)](https://david-dm.org/restify/plugins)
[![devDependency Status](https://david-dm.org/restify/plugins/dev-status.svg)](https://david-dm.org/restify/plugins#info=devDependencies)
[![bitHound Score](https://www.bithound.io/github/restify/plugins/badges/score.svg)](https://www.bithound.io/github/restify/plugins/master)
[![NSP Status](https://img.shields.io/badge/NSP%20status-no%20vulnerabilities-green.svg)](https://travis-ci.org/restify/plugins)

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
* `strictQueryParams()` - checks req.urls query params with strict key/val format and rejects non-strict requests with status code 400.
  * `options.message` {String} response body message string

This module includes the following header parser plugins:

* `acceptParser(accepts)` - Accept header
  * `accepts` {Array} an array of acceptable types
* `authorizationParser(options)` - Authorization header
  * `options` {Object} options object passed to http-signature module
* `conditionalRequest()` - Conditional headers (If-\*)
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
* `requestExpiry(options)` - A request expiry will use headers to tell if the incoming request has expired or not. There are two options for this plugin:
  1. Absolute Time
     * Time in Milliseconds since the Epoch when this request should be
       considered expired
  2. Timeout
     * The request start time is supplied
     * A timeout, in milliseconds, is given
     * The timeout is added to the request start time to arrive at the
       absolute time in which the request is considered expires

  * `options.absoluteHeader` {String} header name of the absolute time for request expiration
  * `options.startHeader` {String} header name for the start time of the request
  * `options.timeoutHeader` {String}  The header name for the time in milliseconds that should ellapse before the request is considered expired.



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
