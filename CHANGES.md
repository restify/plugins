# 1.3.0

- NEW: unified CORS plugin for both preflight and regular requests
  - allow customization of allowed/exposed headers
  - use matched origin for non-credential requests
  - various new options (see README.md)
- BREAKING: remove all CORS access-control-* headers from the fullResponse plugin

# 1.2.0

Add request context plugin.

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
