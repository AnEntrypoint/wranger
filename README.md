# @lanmower/wranger

Cloudflare Worker proxy — routes HTTP/WS traffic with CORS and bearer auth.

## Live

`https://wranger.almagestfraternite.workers.dev`

## Proxy Modes

### 1. URL-as-path forward proxy

```
GET /https://example.com/path?q=1
Authorization: Bearer <token>
```

### 2. Route-prefix reverse proxy

Configure `ROUTES` env var as JSON:

```json
[{"prefix": "/api", "target": "https://upstream.example.com"}]
```

```
GET /api/endpoint
Authorization: Bearer <token>
```

### 3. WebSocket proxy

Same as route-prefix with `Upgrade: websocket` header.

## Endpoints

| Path | Auth | Description |
|------|------|-------------|
| `/proxy.pac` | No | PAC file pointing to this worker |
| `/debug/routes` | Yes | Inspect configured routes and worker info |
| `/<url>` | Yes | Forward proxy to full URL |
| `/<prefix>/...` | Yes | Reverse proxy via ROUTES config |

## Environment Variables

| Var | Required | Description |
|-----|----------|-------------|
| `AUTH_TOKEN` | Yes | Bearer token for all authenticated endpoints |
| `ROUTES` | No | JSON array of `{prefix, target}` route objects |
| `ALLOWED_ORIGINS` | No | Comma-separated allowed origins, or `*` (default) |

## Deploy

```
npx wrangler deploy
```

## Dev

```
npx wrangler dev
```
