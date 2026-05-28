# CLAUDE.md

## Architecture

Single Cloudflare Worker (`src/index.ts`) handles all proxy modes in one fetch handler.

Generic CORS-removing proxy is **open** (no auth) and matches three URL shapes:
URL-as-path (`/https://...`), `?url=`, and `?quest=`. Auth (Bearer `AUTH_TOKEN`)
is required only for `/debug/routes` and the ROUTES reverse-proxy. `/proxy.pac`
is public. OPTIONS preflight is always public and reflects ACRH back.

URL-as-path match uses regex `/^\/(https?:\/\/.+)/` — match group 1 is the full target URL.
Query-param shape reads `?url=` then `?quest=` from `searchParams`.

Route-prefix match walks `ROUTES` JSON env var; first prefix match wins.

On generic forward: hop-by-hop headers + `Host` + caller `Authorization` are
stripped; upstream `Access-Control-*` and `Vary` are deleted then replaced by
the worker's CORS headers (`Access-Control-Allow-Credentials: true` only when
origin is echoed, never with `*`).

## Non-obvious Caveats

- `/proxy.pac` is unauthenticated by design — browsers fetch PAC files before they can inject auth headers
- Generic proxy is unauthenticated by design — it is a public CORS-removing relay (allorigins/codetabs-shape)
- WebSocket proxying requires Cloudflare's `WebSocketPair` and `webSocket` field on `ResponseInit` — not standard fetch API
- `AUTH_TOKEN` must be set as a wrangler secret (not a plain env var) to persist across deployments
- URL-as-path regex must not be greedy on query strings — target URL's own search params take priority over the worker URL's search
- Caller `Authorization` is stripped on generic forward so the worker token never leaks upstream
- `Access-Control-Allow-Credentials` is incompatible with `Access-Control-Allow-Origin: *` — the worker sets credentials only when echoing a concrete origin

## Deploy

Live deploy runs in `.github/workflows/publish.yml` via `wrangler deploy`,
gated on the `CLOUDFLARE_API_TOKEN` repo secret. Local `wrangler deploy`
requires that token in the environment.
