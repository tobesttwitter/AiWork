# OpenRouter Chat

A mobile-first chat app using OpenRouter's OpenAI-compatible API through a Vercel serverless proxy. The API key stays server-side and is never exposed to the browser.

## Create an OpenRouter API key

1. Open https://openrouter.ai
2. Sign up or sign in.
3. Create an API key from your OpenRouter account.
4. Keep the key private. Do not put it in `index.html` or commit it to GitHub.

## Configure Vercel

In your Vercel project, open **Settings → Environment Variables** and add:

- **Name:** `OPENROUTER_API_KEY`
- **Value:** your OpenRouter API key
- **Environment:** Production (and Preview if desired)

Redeploy the project after adding or changing the variable.

The Vercel function in `api/chat.js` sends requests to:

`https://openrouter.ai/api/v1/chat/completions`

with `Authorization: Bearer <OPENROUTER_API_KEY>`.

## Free tier limits

OpenRouter's free-model limits currently include **20 requests per minute** and **50 requests per day**. After a one-time **$10 credit purchase**, the daily limit can increase to **1,000 requests/day** for eligible free-model usage. Limits and eligibility can change, so check OpenRouter's current documentation/account page for the latest values.

## Models

The app supports:

- `cognitivecomputations/dolphin-mistral-24b-venice-edition:free` — default
- `cognitivecomputations/dolphin3.0-mistral-24b:free`

## Deployment

Deploy the repository to Vercel so `api/chat.js` is available as the backend. The frontend can remain hosted on GitHub Pages. The API function allows requests from:

`https://tobesttwitter.github.io`
