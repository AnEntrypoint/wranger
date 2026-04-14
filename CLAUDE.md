# CLAUDE.md

## Architecture

Single Cloudflare Worker (`src/index.ts`) handles all proxy modes in one fetch handler.

Auth check runs before all routes except `/proxy.pac` (public) and OPTIONS (CORS preflight).

URL-as-path match uses regex `/^\/(https?:\/\/.+)/` — match group 1 is the full target URL.

Route-prefix match walks `ROUTES` JSON env var; first prefix match wins.

## Non-obvious Caveats

- `/proxy.pac` is unauthenticated by design — browsers fetch PAC files before they can inject auth headers
- WebSocket proxying requires Cloudflare's `WebSocketPair` and `webSocket` field on `ResponseInit` — not standard fetch API
- `AUTH_TOKEN` must be set as a wrangler secret (not a plain env var) to persist across deployments
- URL-as-path regex must not be greedy on query strings — target URL's own search params take priority over the worker URL's search
