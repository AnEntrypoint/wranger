# Changelog

## [Unreleased]

### Changed
- `bin/wranger.js` reads `WRANGER_URL` and `WRANGER_TOKEN` env vars (falls back to CLI arg / `AUTH_TOKEN` for compatibility)
- `bunx @lanmower/wranger` works with only env vars set, no CLI args required


## [1.0.3] - 2026-04-14

### Added
- URL-as-path forward proxy: `GET /https://example.com/path` proxies directly to target URL
- `/proxy.pac` endpoint serving a Proxy Auto-Config file
- `AUTH_TOKEN` secret configured on live worker

## [1.0.2] - previous

- Initial release with route-prefix reverse proxy and WebSocket support
