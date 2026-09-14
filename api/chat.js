export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = 'https://tobesttwitter.github.io';
  if (origin === allowed) res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN is not configured on the server.' });
  try {
    const { model, messages, stream = true } = req.body || {};
    if (!model || !Array.isArray(messages)) return res.status(400).json({ error: 'model and messages are required.' });
    const upstream = await fetch('https://models.github.ai/inference/chat/completions', {
      method:'POST',
      headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,'Content-Type':'application/json'},
      body:JSON.stringify({model,messages,stream:Boolean(stream)})
    });
    if (!stream) return res.status(upstream.status).json(await upstream.json());
    res.statusCode=upstream.status;
    const type=upstream.headers.get('content-type'); if(type) res.setHeader('Content-Type',type);
    res.setHeader('Cache-Control','no-cache, no-transform');
    if(!upstream.body)return res.end();
    const reader=upstream.body.getReader();
    try{while(true){const {value,done}=await reader.read();if(done)break;res.write(Buffer.from(value))}}finally{reader.releaseLock()}
    res.end();
  } catch(error) { res.status(502).json({error:'Unable to reach GitHub Models.',details:error instanceof Error?error.message:String(error)}); }
}