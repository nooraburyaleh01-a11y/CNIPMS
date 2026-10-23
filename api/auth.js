const crypto = require('crypto');
const COOKIE = 'cnipms_session';
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  if (req.method !== 'POST' && req.method !== 'GET') { res.setHeader('Allow','GET, POST'); return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'}); }
  const secret = process.env.CNIPMS_SESSION_SECRET;
  if (!secret || !process.env.CNIPMS_ADMIN_PASSWORD) return res.status(500).json({ok:false,error:'AUTH_CONFIGURATION_MISSING'});
  if (req.method === 'POST') {
    const body = req.body || {};
    if (body.action === 'logout') { res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`); return res.status(200).json({ok:true}); }
    if (body.action !== 'login' || !safeEqual(String(body.password || ''), process.env.CNIPMS_ADMIN_PASSWORD)) return res.status(401).json({ok:false,error:'INVALID_CREDENTIALS'});
    const payload = Buffer.from(JSON.stringify({sub:'admin',role:'ADMIN',iat:Date.now(),exp:Date.now()+8*60*60*1000})).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    res.setHeader('Set-Cookie', `${COOKIE}=${payload}.${sig}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);
    return res.status(200).json({ok:true,user:{id:'admin',role:'ADMIN',name:'CNIPMS Administrator'}});
  }
  const session = readSession(req, secret);
  if (!session) return res.status(401).json({ok:false,error:'UNAUTHENTICATED'});
  return res.status(200).json({ok:true,user:{id:session.sub,role:session.role,name:'CNIPMS Administrator'}});
};
function readSession(req, secret) {
  const cookies = String(req.headers.cookie || '').split(';').map(x=>x.trim());
  const item = cookies.find(x=>x.startsWith(COOKIE+'=')); if(!item) return null;
  const raw=item.slice(COOKIE.length+1), parts=raw.split('.'); if(parts.length!==2) return null;
  const sig=crypto.createHmac('sha256',secret).update(parts[0]).digest('base64url');
  if(!safeEqual(sig,parts[1])) return null;
  try { const p=JSON.parse(Buffer.from(parts[0],'base64url').toString()); return p.exp>Date.now()?p:null; } catch { return null; }
}
function safeEqual(a,b){const x=Buffer.from(String(a));const y=Buffer.from(String(b));return x.length===y.length && crypto.timingSafeEqual(x,y);}
