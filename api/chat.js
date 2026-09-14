export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = 'https://tobesttwitter.github.io';
  if (origin === allowed) res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  try {
    const { model, messages } = req.body || {};
    if (!model || !Array.isArray(messages)) return res.status(400).json({ error: 'model and messages are required.' });
    const system = messages.find(m => m.role === 'system')?.content || '';
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content ?? '') }]
    }));
    if (!contents.length) return res.status(400).json({ error: 'At least one user message is required.' });
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json'},
      body: JSON.stringify({contents, ...(system ? {systemInstruction:{parts:[{text:String(system)}]}} : {})})
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json(data);
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({reply});
  } catch (error) {
    return res.status(502).json({error:'Unable to reach Gemini API.',details:error instanceof Error?error.message:String(error)});
  }
}