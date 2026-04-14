#!/usr/bin/env node
const http = require("http");
const https = require("https");
const net = require("net");
const { URL } = require("url");

const [, , workerUrl, localPort = "8080"] = process.argv;

if (!workerUrl) {
  console.error("Usage: npx wranger <worker-url> [local-port]");
  console.error("  AUTH_TOKEN env var required");
  process.exit(1);
}

const token = process.env.AUTH_TOKEN;
if (!token) {
  console.error("AUTH_TOKEN env var required");
  process.exit(1);
}

const base = new URL(workerUrl);

function forwardRequest(clientReq, clientRes) {
  const target = new URL(clientReq.url, base);
  const mod = target.protocol === "https:" ? https : http;
  const opts = {
    hostname: target.hostname,
    port: target.port || (target.protocol === "https:" ? 443 : 80),
    path: target.pathname + target.search,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: target.host,
      authorization: `Bearer ${token}`,
    },
  };
  const proxy = mod.request(opts, upstream => {
    clientRes.writeHead(upstream.statusCode, upstream.headers);
    upstream.pipe(clientRes);
  });
  proxy.on("error", err => {
    clientRes.writeHead(502);
    clientRes.end(JSON.stringify({ error: err.message }));
  });
  clientReq.pipe(proxy);
}

function forwardTunnel(clientReq, clientSocket, head) {
  const [host, port] = clientReq.url.split(":");
  const upstream = net.connect(Number(port) || 443, host, () => {
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    upstream.write(head);
    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
  });
  upstream.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => upstream.destroy());
}

const server = http.createServer(forwardRequest);
server.on("connect", forwardTunnel);

server.listen(Number(localPort), "127.0.0.1", () => {
  console.log(`wranger proxy listening on 127.0.0.1:${localPort} → ${workerUrl}`);
});
