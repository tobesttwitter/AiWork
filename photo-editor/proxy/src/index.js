require('dotenv').config();

const express = require('express');
const { editImage } = require('./gemini');

const app = express();
const port = Number(process.env.PORT || 8080);
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const requestsByIp = new Map();

app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));

function clientIp(req) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function rateLimit(req, res, next) {
  const ip = clientIp(req);
  const now = Date.now();
  const entry = requestsByIp.get(ip);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    requestsByIp.set(ip, { windowStart: now, count: 1 });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Try again later.', status: 429 });
  }

  entry.count += 1;
  return next();
}

function requireBearerToken(req, res, next) {
  const configured = process.env.PROXY_BEARER_TOKEN;
  if (!configured) return next();

  const authorization = req.get('authorization') || '';
  if (authorization !== `Bearer ${configured}`) {
    return res.status(401).json({ error: 'Unauthorized', status: 401 });
  }
  return next();
}

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/edit', rateLimit, requireBearerToken, async (req, res) => {
  const { prompt, image_base64: imageBase64, mime_type: mimeType } = req.body || {};

  if (
    typeof prompt !== 'string' ||
    !prompt.trim() ||
    typeof imageBase64 !== 'string' ||
    !imageBase64 ||
    typeof mimeType !== 'string' ||
    !/^image\/(jpeg|png|webp)$/i.test(mimeType)
  ) {
    return res.status(400).json({
      error: 'prompt, image_base64, and a supported image mime_type are required',
      status: 400,
    });
  }

  try {
    const result = await editImage({
      prompt: prompt.trim(),
      imageBase64,
      mimeType,
    });

    return res.json({
      image_base64: result.imageBase64,
      mime_type: result.mimeType,
    });
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Upstream request failed';
    return res.status(status).json({ error: message, status });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large', status: 413 });
  }

  console.error('Unhandled server error:', err?.message || err);
  return res.status(500).json({ error: 'Internal server error', status: 500 });
});

app.listen(port, () => {
  console.log(`AI Photo Editor proxy listening on port ${port}`);
});
