import { createReadStream, promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";

const argv = process.argv.slice(2);

function readArg(flag) {
  const index = argv.indexOf(flag);
  if (index === -1) return undefined;
  return argv[index + 1];
}

const port = Number(readArg("--port") ?? process.env.PORT ?? 3000);
const host = readArg("--host") ?? process.env.HOST ?? "127.0.0.1";
const dir = readArg("--dir") ?? process.env.STATIC_DIR ?? "out";

const rootDir = path.resolve(process.cwd(), dir);

const MIME_BY_EXTENSION = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
};

function resolveFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = path.posix.normalize(decoded);
  const relative = normalized.replace(/^\/+/, "");
  const resolved = path.resolve(rootDir, relative);

  if (resolved !== rootDir && !resolved.startsWith(rootDir + path.sep)) {
    return null;
  }

  return resolved;
}

async function statMaybe(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
  res.statusCode = 200;
  res.setHeader("Content-Type", mime);
  createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const method = req.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const requestUrl = req.url ?? "/";
  const url = new URL(requestUrl, `http://${host}:${port}`);

  let pathname = url.pathname;
  if (pathname.endsWith("/")) pathname += "index.html";

  const candidate = resolveFilePath(pathname);
  if (!candidate) {
    res.statusCode = 400;
    res.end("Bad Request");
    return;
  }

  let targetPath = candidate;
  const targetStat = await statMaybe(targetPath);

  if (targetStat?.isDirectory()) {
    targetPath = path.join(targetPath, "index.html");
  }

  const fileStat = await statMaybe(targetPath);
  if (!fileStat?.isFile()) {
    res.statusCode = 404;
    const notFound = path.join(rootDir, "_not-found", "index.html");
    const notFoundStat = await statMaybe(notFound);
    if (notFoundStat?.isFile()) {
      if (method === "HEAD") {
        res.end();
        return;
      }
      await sendFile(res, notFound);
      return;
    }
    res.end("Not Found");
    return;
  }

  if (method === "HEAD") {
    res.statusCode = 200;
    res.end();
    return;
  }

  await sendFile(res, targetPath);
});

server.listen(port, host, async () => {
  const exists = await statMaybe(rootDir);
  if (!exists?.isDirectory()) {
    // eslint-disable-next-line no-console
    console.warn(`Warning: static directory not found: ${rootDir}`);
  }
  // eslint-disable-next-line no-console
  console.log(`Serving ${rootDir} at http://${host}:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
