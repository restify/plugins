# 1.5.1

- FIX: staticServe plugin should not assume `req.connectionState()` method since
  it's 5.x restify only.

# 1.5.0

- #81: move `reqIdHeaders` option from restify 5.x core into the plugin repo.
  Requires 5.x restify to work properly.

# 1.4.1
- #82: fix bug in context plugin where context bucket was shared between
  requests.

# 1.4.0
- #79: audit log now uses `req.connectionState()` instead of `req.clientClosed`
  field. Compatible only with restify@5.0.0-beta-3.0 or newer.
- #78: new metrics plugin for use with `server.on('after',...` event.

# 1.3.0
- Add assertions to context plugin.

# 1.2.0
- #73 Add request context plugin.

# 1.0.2

- merges [commit](https://github.com/restify/node-restify/commit/fbd56f5751f82031c8b0e677f0bdd677c7b95892)
  from restify core that fixes errors for static plugin

# 1.0.1

- audit log now has a `clientClosed` attribute that denotes whether or not the
  req was closed/terminated by the client

# 1.0.0

### Internal changes
- move unit migrated to mocha
- unit tests separated into their own files

### Breaking changes
- plugins moved into their own repository
- `sanitizePath` now available only on the `pre` export
- `allowDots: false` and `plainObjects: false` are new defaults for
  `queryParser`.
- `mapParams: false` is now the default setting for both the queryParser and
  bodyParser plugins
- request expiration plugin now has two options, absolute time and timeout, the
  signature of the options has changed.
- Add printLog flag to audit logger to optionally print log, by default is true.
- Server emit auditlog event with log obj. Optionally store logs in ringbuffer.
- `bodyParser` plugin now saves the raw unparsed body on req.rawBody
