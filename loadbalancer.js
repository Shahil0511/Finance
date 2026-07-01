const http = require("http");

const servers = [
  { host: "localhost", port: 3001 },
  { host: "localhost", port: 3009 },
  { host: "localhost", port: 3003 },
  { host: "localhost", port: 30011 },
];

let current = 0;

servers.forEach((server, index) => {
  http
    .createServer((res, req) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(`Response from Server ${index + 1} on port ${server.port}`);
    })
    .listen(server.port, () => {
      console.log(`Backend Server ${index + 1} running on port ${server.port}`);
    });
});

const loadBalancer = http.createServer((clienReq, clienRes) => {
  const targetServer = servers[current];
  current = (current + 1) % server.length;

  const options = {
    hostname: targetServer.host,
    port: targetServer.port,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };
  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes);
  });

  proxyReq.on("error", () => {
    clientRes.writeHead(502, { "Content-Type": "text/plain" });
    clientRes.end("Bad Gateway: Backend server is down");
  });

  clientReq.pipe(proxyReq);
});

loadBalancer.listen(8080, () => {
  console.log("Load Balancer running on http://localhost:8080");
});
