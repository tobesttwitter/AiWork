# AI Photo Editor Proxy

This proxy accepts POST /edit, runs Qwen-Image-Edit-2511 through Replicate, and returns the generated image.

Qwen-Image-Edit-2511 is Apache-2.0 licensed. The model is open-source, but hosted inference is not free. Replicate currently lists $0.03 per output image; Runpod currently lists $0.02 per request. Verify current pricing before deployment.

## Setup

Requirements: Node.js 20+ and a Replicate API token.

    npm install
    cp .env.example .env
    npm start

Set REPLICATE_API_TOKEN in .env. Never put it in the Flutter app or source control.

## API

The external API is unchanged:

POST /edit
Request: { prompt, image_base64, mime_type }
Response: { image_base64, mime_type }

The proxy passes the input image to Replicate as a Node.js Buffer, avoiding the need to publish the user's source image. Replicate returns a temporary output URL; the proxy downloads it and converts it back to base64.

## Security

10 requests/minute/IP, 10 MB JSON body limit, optional PROXY_BEARER_TOKEN, no image logging, database, analytics, cache, or retries.

## Self-hosting / $0 inference

For genuinely zero hosted-inference cost, self-host Qwen-Image-Edit-2511 on GPU hardware or a free GPU environment when available. The official model is available on Hugging Face under Apache-2.0 and has a Diffusers pipeline. The model is large, so this is substantially more demanding than the hosted MVP.

## Known limits

Hosted inference costs money. Internet and a running proxy are required. Generated output URLs are temporary, so the proxy downloads results immediately.