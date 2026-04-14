export interface Env {
    AUTH_TOKEN: string;
    ALLOWED_ORIGINS: string;
    ROUTES: string;
}

interface Route {
    prefix: string;
    target: string;
}

function corsHeaders(origin: string, allowed: string): Record<string, string> {
    const allow = allowed === "*" || allowed.split(",").map(s => s.trim()).includes(origin) ? origin : allowed.split(",")[0].trim();
    return {
        "Access-Control-Allow-Origin": allow,
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization,Content-Type,X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
    };
}

function addCors(res: Response, origin: string, allowed: string): Response {
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders(origin, allowed))) headers.set(k, v);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function matchRoute(routes: Route[], url: URL): Route | undefined {
    return routes.find(r => url.pathname === r.prefix || url.pathname.startsWith(r.prefix + "/"));
}

async function proxyHttp(request: Request, target: string, url: URL, route: Route): Promise<Response> {
    const upstream = new URL(url.pathname.slice(route.prefix.length) || "/", target);
    upstream.search = url.search;
    return fetch(new Request(upstream.toString(), request));
}

async function proxyWs(request: Request, target: string, url: URL, route: Route): Promise<Response> {
    const upstream = new URL(url.pathname.slice(route.prefix.length) || "/", target.replace(/^http/, "ws"));
    upstream.search = url.search;
    const [client, worker] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    const upReq = new Request(upstream.toString(), { headers: request.headers });
    const upRes = await fetch(upReq, { headers: { Upgrade: "websocket" } } as RequestInit);
    const up = (upRes as unknown as { webSocket: WebSocket }).webSocket;
    if (!up) return new Response("upstream WS failed", { status: 502 });
    worker.accept();
    up.accept();
    worker.addEventListener("message", e => up.send(e.data));
    up.addEventListener("message", e => worker.send(e.data));
    worker.addEventListener("close", e => up.close(e.code, e.reason));
    up.addEventListener("close", e => worker.close(e.code, e.reason));
    return new Response(null, { status: 101, webSocket: client } as ResponseInit);
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const origin = request.headers.get("Origin") ?? "*";
        const allowed = env.ALLOWED_ORIGINS ?? "*";

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders(origin, allowed) });
        }

        if (url.pathname === "/proxy.pac") {
            const pac = `function FindProxyForURL(url, host) { return "PROXY ${url.host}"; }`;
            return new Response(pac, {
                headers: { "Content-Type": "application/x-ns-proxy-autoconfig" },
            });
        }

        const auth = request.headers.get("Authorization");
        if (!auth || auth !== `Bearer ${env.AUTH_TOKEN}`) {
            return addCors(new Response(JSON.stringify({ error: "unauthorized" }), {
                status: 401, headers: { "Content-Type": "application/json" }
            }), origin, allowed);
        }

        if (url.pathname === "/debug/routes") {
            const routes: Route[] = JSON.parse(env.ROUTES ?? "[]");
            const body = JSON.stringify({
                routes,
                tokenPresent: !!env.AUTH_TOKEN,
                colo: (request as unknown as { cf?: { colo?: string } }).cf?.colo ?? "unknown",
                worker: "wranger",
            });
            return addCors(new Response(body, { headers: { "Content-Type": "application/json" } }), origin, allowed);
        }

        const fwd = url.pathname.match(/^\/(https?:\/\/.+)/);
        if (fwd) {
            const target = new URL(fwd[1]);
            if (!target.search) target.search = url.search;
            const res = await fetch(new Request(target.toString(), request));
            return addCors(res, origin, allowed);
        }

        const routes: Route[] = JSON.parse(env.ROUTES ?? "[]");
        const route = matchRoute(routes, url);

        if (!route) {
            return addCors(new Response(JSON.stringify({ error: "no route" }), {
                status: 404, headers: { "Content-Type": "application/json" }
            }), origin, allowed);
        }

        const isWs = request.headers.get("Upgrade")?.toLowerCase() === "websocket";
        const res = isWs
            ? await proxyWs(request, route.target, url, route)
            : await proxyHttp(request, route.target, url, route);

        return isWs ? res : addCors(res, origin, allowed);
    }
};
