const crypto = require('crypto');
const COOKIE='cnipms_session';
const ALLOWED_ACTIONS=new Set(['listGenerics','getGeneric','addGeneric','addBrand','listBrands']);
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer'); res.setHeader('X-Frame-Options','DENY');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});}
  const gasUrl=process.env.CNIPMS_GAS_URL, gasToken=process.env.CNIPMS_API_TOKEN, sessionSecret=process.env.CNIPMS_SESSION_SECRET;
  if(!gasUrl||!gasToken||!sessionSecret)return res.status(500).json({ok:false,error:'SERVER_CONFIGURATION_MISSING'});
  const session=readSession(req,sessionSecret); if(!session)return res.status(401).json({ok:false,error:'UNAUTHENTICATED'});
  const {action,data={}}=req.body||{};
  if(!ALLOWED_ACTIONS.has(action))return res.status(400).json({ok:false,error:'INVALID_ACTION'});
  if(!data||typeof data!=='object'||Array.isArray(data))return res.status(400).json({ok:false,error:'INVALID_DATA'});
  if(['addGeneric','addBrand'].includes(action)&&session.role!=='ADMIN')return res.status(403).json({ok:false,error:'FORBIDDEN'});
  try{
    const upstream=await fetch(gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,data,token:gasToken,actor:{id:session.sub,role:session.role}}),redirect:'follow'});
    const text=await upstream.text();let payload;try{payload=JSON.parse(text)}catch{return res.status(502).json({ok:false,error:'INVALID_GAS_RESPONSE'});}
    return res.status(upstream.ok?200:502).json(payload);
  }catch(e){return res.status(502).json({ok:false,error:'GAS_UNAVAILABLE'});}
};
function readSession(req,secret){const item=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));if(!item)return null;const parts=item.slice(COOKIE.length+1).split('.');if(parts.length!==2)return null;const sig=crypto.createHmac('sha256',secret).update(parts[0]).digest('base64url');if(!safeEqual(sig,parts[1]))return null;try{const p=JSON.parse(Buffer.from(parts[0],'base64url').toString());return p.exp>Date.now()?p:null}catch{return null}}
function safeEqual(a,b){const x=Buffer.from(String(a));const y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
