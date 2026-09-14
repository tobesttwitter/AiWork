# Gemini Chat

A mobile-first chat app using Google's Gemini API through its OpenAI-compatible endpoint. The browser talks to the Vercel serverless proxy, so the Gemini API key stays server-side.

## Get a free Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Create an API key in the API key section.
4. Keep the key private. Do not put it in `index.html` or commit it to GitHub.

Google's OpenAI-compatible Gemini endpoint is:

`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`

## Configure Vercel

In your Vercel project, open **Settings → Environment Variables** and add:

- **Name:** `GEMINI_API_KEY`
- **Value:** your Google AI Studio API key
- **Environment:** Production (and Preview if desired)

Redeploy the project after adding or changing the variable.

The Vercel function in `api/chat.js` reads `GEMINI_API_KEY` and sends the key to Gemini server-side. It is never exposed to the browser.

## Models

The app supports:

- `gemini-2.5-flash` — default
- `gemini-2.5-pro`
- `gemini-2.0-flash`

## Deployment

Deploy the repository to Vercel so `api/chat.js` is available as the backend. The frontend can remain hosted on GitHub Pages. The API function allows requests from:

`https://tobesttwitter.github.io`

