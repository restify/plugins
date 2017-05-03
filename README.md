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
* `context()` - Provide req.set(key, val) and req.get(key) methods for setting and retrieving context to a specific request.
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

* `bodyParser(options)` - parses POST bodies to `req.body`. automatically uses one of the following parsers based on content type:
  * `urlEncodedBodyParser(options)` - parses url encoded form bodies
  * `jsonBodyParser(options)` - parses JSON POST bodies
  * `multipartBodyParser(options)` - parses multipart form bodies
  * All bodyParsers support the following options:
    * `options.mapParams` - default false. copies parsed post body values onto req.params
    * `options.overrideParams` - default false. only applies when if mapParams true. when true, will stomp on req.params value when existing value is found.
* `jsonp()` - parses JSONP callback
* `queryParser()` - Parses URL query paramters into `req.query`. Many options
  correspond directly to option defined for the underlying
  [`qs.parse`](https://github.com/ljharb/qs).
  * `options.mapParams` - Default false. Copies parsed query parameters into
    `req.params`.
  * `options.overrideParams` - Default false. Only applies when if mapParams
    true. When true, will stomp on req.params field when existing value is
    found.
  * `options.allowDots` - Default false. Transform `?foo.bar=baz` to a nested
    object: `{foo: {bar: 'baz'}}`.
  * `options.arrayLimit` - Default 20. Only transform `?a[$index]=b` to an array
    if `$index` is less than `arrayLimit`.
  * `options.depth` - Default 5. The depth limit for parsing nested objects,
    e.g. `?a[b][c][d][e][f][g][h][i]=j`.
  * `options.parameterLimit` - Default 1000. Maximum number of query params
    parsed. Additional params are silently dropped.
  * `options.parseArrays` - Default true. Whether to parse `?a[]=b&a[1]=c` to an
    array, e.g. `{a: ['b', 'c']}`.
  * `options.plainObjects` - Default false. Whether `req.query` is a "plain"
    object -- does not inherit from `Object`. This can be used to allow query
    params whose names collide with Object methods, e.g. `?hasOwnProperty=blah`.
  * `options.strictNullHandling` - Default false. If true, `?a&b=` results in
    `{a: null, b: ''}`. Otherwise, `{a: '', b: ''}`.
* `requestLogger(options)` - adds timers for each handler in your request chain
  * `options.properties` {Object} properties to pass to bunyan's `log.child()` method

The module includes the following request plugins:

* `reqIdHeaders(options)` - a plugin that lets you use incoming request header
  values to set the request id (5.x compatible only)
  * `options.headers` {Array} an array of header names to use. lookup
    precedence is left to right (lowest index first)

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

The module includes the following plugins to be used with restify's after
event, e.g., `server.on('after', plugins.auditLogger());`:

* `auditLogger(options)` - an audit logger for recording all handled requests
  * `options.log` {Object} bunyan logger
  * `[options.server]` {Object} restify server. if passed in, causes server to
     emit 'auditlog' event after audit logs are flushed
  * `[options.logBuffer]` {Object} optional ringbuffer which is written to if
     passed in
  * `[options.printLog]` {Boolean} when true, prints audit logs. default true.
* `metrics(callback)` - a metrics plugin which will invoke callback with the
  the following parameters (5.x compatible only):
  * `err` {Object} an error if the request had an error
  * `metrics` {Object} - metrics about the request
  * `metrics.statusCode` {Number} status code of the response. can be undefined
    in the case of an uncaughtException
  * `metrics.method` {String} http request verb
  * `metrics.latency` {Number} request latency
  * `metrics.path` {String} req.path() value
  * `metrics.inflightRequests` {Number} Number of inflight requests pending in restify.
  * `metrics.unifinishedRequests` {Number} Same as `inflightRequests`
  * `metrics.connectionState` {String} can be either 'close', 'aborted', or
    undefined. If this value is set, err will be a corresponding
    `RequestCloseError` or `RequestAbortedError`. If connectionState is either
    'close' or 'aborted', then the statusCode is not applicable since the
    connection was severed before a response was written.
  * `req` {Object} the request obj
  * `res` {Object} the response obj
  * `route` {Object} the route obj that serviced the request


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
