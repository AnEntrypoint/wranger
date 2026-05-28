# Changelog

## [Unreleased]

## [1.1.0] - 2026-05-28

### Changed
- Generic CORS-removing proxy is now **unauthenticated**: `/<url>`, `/?url=<url>`, `/?quest=<url>` are open
- OPTIONS preflight reflects `Access-Control-Request-Headers` back in `Access-Control-Allow-Headers`
- Upstream CORS headers (`Access-Control-*`, `Vary`) are stripped and replaced by the worker
- Hop-by-hop headers and `Host` are no longer forwarded; `Authorization` is stripped on generic forwards
- `Access-Control-Allow-Credentials: true` set only when origin is echoed (never with `*`)

### Auth model
- Bearer `AUTH_TOKEN` still required for `/debug/routes` and ROUTES reverse-proxy
- `/proxy.pac` still public

### Earlier (1.0.5)
- `bin/wranger.js` reads `WRANGER_URL` and `WRANGER_TOKEN` env vars (falls back to CLI arg / `AUTH_TOKEN` for compatibility)
- `bunx @lanmower/wranger` works with only env vars set, no CLI args required


## [1.0.3] - 2026-04-14

### Added
- URL-as-path forward proxy: `GET /https://example.com/path` proxies directly to target URL
- `/proxy.pac` endpoint serving a Proxy Auto-Config file
- `AUTH_TOKEN` secret configured on live worker

## [1.0.2] - previous

- Initial release with route-prefix reverse proxy and WebSocket support
