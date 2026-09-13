# AI Photo Editor Proxy

Minimal Node.js/Express server that accepts an image + editing prompt, calls Google's Gemini image model, and returns the generated image.

## Why a proxy?

The Gemini API key must remain server-side. A Flutter APK/IPA cannot safely hide a secret key. The mobile app therefore knows only the proxy URL.

## Requirements

- Node.js 20+
- A Gemini API key from Google AI Studio.
- A deployed HTTPS URL if the mobile app is used outside the local network.

Google's current Gemini documentation lists `gemini-2.5-flash-image` as a stable image model for image/text input and image/text output. The current pricing page lists this model without a free tier, so verify current pricing before use.

## Local setup

```bash
npm install
cp .env.example .env
# Edit .env and set GEMINI_API_KEY.
npm start
```

The server listens on `PORT` (default `8080`).

## API

### POST /edit

Request:

```json
{
  "prompt": "Remove the background and replace it with a beach.",
  "image_base64": "<base64>",
  "mime_type": "image/jpeg"
}
```

Successful response:

```json
{
  "image_base64": "<base64>",
  "mime_type": "image/png"
}
```

The implementation uses the current Gemini REST field names (`inlineData`, `mimeType`) and requests image-only output. The response parser accepts both camelCase and legacy snake_case variants so a harmless API representation change is less likely to break the MVP.

## Security behavior

- API key is read only from `GEMINI_API_KEY`.
- `.env` and `node_modules` are ignored.
- Request bodies are never logged.
- Per-IP in-memory limit: 10 requests/minute.
- JSON body limit: 10 MB.
- Optional `PROXY_BEARER_TOKEN` can protect the endpoint.
- No database, accounts, analytics, caching, retries, or image persistence.

The in-memory rate limit resets when the process restarts and is not suitable as the only production abuse control.

## Deployment

Deploy this directory as a Node.js web service on a platform that supports Node 20+, such as Render or Fly.io. Availability and pricing of free tiers change, so check the provider's current plan.

Set:
- `GEMINI_API_KEY`
- optionally `PROXY_BEARER_TOKEN`
- optionally `PORT` (most hosts provide their own port)

Then point the Flutter app's `PROXY_URL` at the deployed HTTPS service, for example `https://your-service.example.com`.

## Manual test

Edit `test.http` with a real base64 image and run it with an HTTP client, or use curl:

```bash
curl -X POST http://localhost:8080/edit \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Make the sky a dramatic sunset.","image_base64":"...","mime_type":"image/jpeg"}'
```
