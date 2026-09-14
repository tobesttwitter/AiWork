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
    const { model, messages, stream = true } = req.body || {};
    if (!model || !Array.isArray(messages)) return res.status(400).json({ error: 'model and messages are required.' });
    const system = messages.find(m => m.role === 'system')?.content || '';
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content ?? '') }]
    }));
    if (!contents.length) return res.status(400).json({ error: 'At least one user message is required.' });
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${stream ? 'streamGenerateContent' : 'generateContent'}`;
    const upstream = await fetch(endpoint, {
      method:'POST',
      headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({contents,...(system ? {systemInstruction:{parts:[{text:String(system)}]}} : {})})
    });
    if (!stream) return res.status(upstream.status).json(await upstream.json());
    res.statusCode=upstream.status;
    res.setHeader('Content-Type','application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control','no-cache, no-transform');
    res.setHeader('Connection','keep-alive');
    if(!upstream.body)return res.end();
    const reader=upstream.body.getReader(),decoder=new TextDecoder();let buffer='';
    const emit=line=>{
      line=line.trim();if(!line||line.startsWith(':'))return;
      const s=line.startsWith('data:')?line.slice(5).trim():line;if(s==='[DONE]')return;
      try{res.write(JSON.stringify(JSON.parse(s))+'\n')}catch(_){}
    };
    try{while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split(/\r?\n/);buffer=lines.pop()||'';for(const line of lines)emit(line)}buffer+=decoder.decode();if(buffer.trim())emit(buffer)}finally{reader.releaseLock()}
    res.end();
  } catch(error) { res.status(502).json({error:'Unable to reach Gemini API.',details:error instanceof Error?error.message:String(error)}); }
}