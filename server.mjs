/**
 * Production server for CreazaApp on Railway
 * Replaces Wrangler (Cloudflare) with a standard Node.js HTTP server
 */
import { createRequestHandler } from '@remix-run/node';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = parseInt(process.env.PORT || '5173', 10);
const BUILD_DIR = './build';

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

// Load Remix server build
const build = await import('./build/server/index.js');
const handler = createRequestHandler(build, process.env.NODE_ENV);

const server = createServer(async (req, res) => {
  // WebContainers require cross-origin isolation on ALL responses
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Serve static files from build/client
  const staticPath = join(BUILD_DIR, 'client', url.pathname);

  if (url.pathname !== '/' && existsSync(staticPath)) {
    try {
      const ext = extname(staticPath);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const content = readFileSync(staticPath);

      // Cache static assets
      if (url.pathname.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }

      res.writeHead(200, {
        'Content-Type': mime,
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      });
      res.end(content);
      return;
    } catch {
      // Fall through to Remix handler
    }
  }

  // Convert Node.js request to Web Request for Remix
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  let body = null;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve) => {
      const chunks = [];

      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  const webRequest = new Request(url.toString(), {
    method: req.method,
    headers,
    body,
  });

  try {
    const webResponse = await handler(webRequest);

    // Copy response headers
    const responseHeaders = {};

    webResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Add COEP/COOP headers
    responseHeaders['Cross-Origin-Embedder-Policy'] = 'require-corp';
    responseHeaders['Cross-Origin-Opener-Policy'] = 'same-origin';

    res.writeHead(webResponse.status, responseHeaders);

    if (webResponse.body) {
      const reader = webResponse.body.getReader();

      const pump = async () => {
        const { done, value } = await reader.read();

        if (done) {
          res.end();
          return;
        }

        res.write(value);
        await pump();
      };

      await pump();
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Request handler error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CreazaApp running on http://0.0.0.0:${PORT}`);
});
