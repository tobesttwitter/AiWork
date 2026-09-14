export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = 'https://tobesttwitter.github.io';
  if (origin === allowed) res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.KAGGLE_API_KEY) return res.status(500).json({ error: 'KAGGLE_API_KEY not set' });

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages are required.' });

    const upstream = await fetch('https://helping-cycle-admissions-valium.trycloudflare.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KAGGLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'default',
        messages,
        stream: false
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json(data);

    const reply = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(502).json({
      error: 'Unable to reach the API.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}