# AI Photo Editor

A thin-client Flutter photo editor backed by a small Node.js proxy. The Flutter app never receives the Gemini API key.

## Layout

- `app/` — Flutter Android-first client.
- `proxy/` — Node.js/Express Gemini proxy.

This directory is intentionally isolated from the rest of the repository.

## Current API note

The proxy targets `gemini-2.5-flash-image` and uses the current Gemini REST field names (`inlineData`/`mimeType`) and image response modality. Google documents this model as supporting image + text input and image + text output, including conversational image editing. The current pricing page lists **no free tier for Gemini 2.5 Flash Image**, so do not assume the model is free; check current Google pricing before deploying.

## Quick start

1. Configure and run the proxy:
   ```bash
   cd photo-editor/proxy
   cp .env.example .env
   # edit .env and add GEMINI_API_KEY
   npm install
   npm start
   ```

2. Configure the Flutter app:
   ```bash
   cd ../app
   cp .env.example .env
   # edit PROXY_URL, or use --dart-define=PROXY_URL=...
   flutter pub get
   flutter run
   ```

If `android/` and `ios/` have not been generated locally, run:
```bash
flutter create --platforms=android,ios .
```
This is the standard Flutter project bootstrap step.

## Security

The Gemini key belongs only in the proxy's server-side environment. Never put it in the Flutter app, `.env.example`, source control, or logs.

The proxy has a small in-memory per-IP rate limiter (10 requests/minute) and a 10 MB JSON body limit. It intentionally has no database, accounts, analytics, image logging, or cache.

## Deployment

A Node.js service can be deployed to a managed platform such as Render or Fly.io, subject to the provider's current free-tier/plan availability. Configure `GEMINI_API_KEY` as a server-side secret and use the resulting HTTPS service URL as the Flutter `PROXY_URL`.

For production, add HTTPS, authentication (the optional bearer token in the proxy is a starting point), stronger rate limiting, and usage/billing controls.

## Known limitations

- Requires internet access.
- Gemini 2.5 Flash Image pricing/free-tier availability can change; the current Google pricing page lists it as paid-only.
- The proxy does not cache results.
- Large images increase request size and latency. The MVP sends the selected image bytes as-is.
- This MVP does not preserve EXIF metadata.
