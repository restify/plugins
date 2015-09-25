# 1.0.0

### Internal changes
- move unit migrated to mocha
- unit tests separated into their own files

### Breaking changes
- plugins moved into their own repository
- `sanitizePath` now available only on the `pre` export
- `mapParams: false` is now the default setting for both the queryParser and
  bodyParser plugins
