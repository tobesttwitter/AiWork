# AI Photo Editor

Flutter client plus Node.js proxy for prompt-based image editing.

The proxy now uses Qwen-Image-Edit-2511 instead of Gemini. Qwen-Image-Edit-2511 is Apache-2.0 licensed. Hosted inference is paid; Replicate currently lists $0.03/output image and Runpod $0.02/request.

The Flutter API contract is unchanged, so no Flutter changes are required for the model swap.

Quick start: run photo-editor/proxy with REPLICATE_API_TOKEN, then configure photo-editor/app with PROXY_URL and run Flutter.

For a truly $0 inference setup, self-host the Qwen model on available GPU hardware. The model is large and self-hosting is not an always-on free production service.