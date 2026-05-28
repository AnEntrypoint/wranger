# @lanmower/wranger

Cloudflare Worker proxy — routes HTTP/WS traffic with CORS and bearer auth.

## Live

`https://wranger.almagestfraternite.workers.dev`

## Proxy Modes

### 1. Generic CORS-removing proxy (open, no auth)

Three equivalent URL shapes — all unauthenticated, CORS-permissive:

```
GET /https://example.com/path?q=1
GET /?url=https%3A%2F%2Fexample.com%2Fpath
GET /?quest=https://example.com/path
```

Upstream CORS headers are stripped and replaced. OPTIONS preflight reflects the
caller's `Access-Control-Request-Headers`. Shape-compatible with
allorigins / codetabs / corsproxy.io.

### 2. Route-prefix reverse proxy (bearer auth)

Configure `ROUTES` env var as JSON:

```json
[{"prefix": "/api", "target": "https://upstream.example.com"}]
```

```
GET /api/endpoint
Authorization: Bearer <token>
```

### 3. WebSocket proxy (bearer auth)

Same as route-prefix with `Upgrade: websocket` header.

## Endpoints

| Path | Auth | Description |
|------|------|-------------|
| `/proxy.pac` | No | PAC file pointing to this worker |
| `/<url>` | No | Generic CORS-removing forward proxy |
| `/?url=<url>` | No | Same, query-param shape |
| `/?quest=<url>` | No | Same, query-param shape (raw URL) |
| `/debug/routes` | Yes | Inspect configured routes and worker info |
| `/<prefix>/...` | Yes | Reverse proxy via ROUTES config |

## Local proxy (bunx)

```
WRANGER_URL=https://wranger.almagestfraternite.workers.dev \
WRANGER_TOKEN=<token> \
bunx @lanmower/wranger [local-port]
```

Starts an HTTP proxy on `127.0.0.1:8080` (or `local-port`) that forwards all requests to the worker with bearer auth injected.

## Worker Environment Variables

| Var | Required | Description |
|-----|----------|-------------|
| `AUTH_TOKEN` | Yes | Bearer token for all authenticated endpoints |
| `ROUTES` | No | JSON array of `{prefix, target}` route objects |
| `ALLOWED_ORIGINS` | No | Comma-separated allowed origins, or `*` (default) |

## Local Proxy Environment Variables

| Var | Description |
|-----|-------------|
| `WRANGER_URL` | Worker base URL (or pass as first CLI arg) |
| `WRANGER_TOKEN` | Bearer token sent to the worker |

## Deploy

```
npx wrangler deploy
```

## Dev

```
npx wrangler dev
```
