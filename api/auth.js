const crypto = require("crypto");
function safeEqual(a,b){const x=Buffer.from(String(a||""));const y=Buffer.from(String(b||""));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function sign(value,secret){return crypto.createHmac("sha256",secret).update(value).digest("base64url")}
module.exports=async function(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method==="GET"){
    const raw=(req.headers.cookie||"").split(";").map(s=>s.trim()).find(s=>s.startsWith("cnipms_session="));
    if(!raw)return res.status(401).json({ok:false,error:"UNAUTHENTICATED"});
    const token=decodeURIComponent(raw.split("=").slice(1).join("="));
    const parts=token.split(".");
    if(parts.length!==2)return res.status(401).json({ok:false,error:"UNAUTHENTICATED"});
    const expected=sign(parts[0],process.env.CNIPMS_SESSION_SECRET||"");
    if(!process.env.CNIPMS_SESSION_SECRET||!safeEqual(parts[1],expected))return res.status(401).json({ok:false,error:"UNAUTHENTICATED"});
    let payload;try{payload=JSON.parse(Buffer.from(parts[0],"base64url").toString())}catch{return res.status(401).json({ok:false,error:"UNAUTHENTICATED"})}
    if(payload.exp<Date.now())return res.status(401).json({ok:false,error:"UNAUTHENTICATED"});
    return res.status(200).json({ok:true,user:{role:"ADMIN"}});
  }
  if(req.method==="DELETE"){res.setHeader("Set-Cookie","cnipms_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");return res.status(200).json({ok:true})}
  if(req.method!=="POST")return res.status(405).json({ok:false,error:"METHOD_NOT_ALLOWED"});
  const password=process.env.CNIPMS_ADMIN_PASSWORD,secret=process.env.CNIPMS_SESSION_SECRET;
  if(!password||!secret)return res.status(500).json({ok:false,error:"CONFIG_MISSING"});
  if(!safeEqual(req.body&&req.body.password,password))return res.status(401).json({ok:false,error:"UNAUTHORIZED"});
  const payload=Buffer.from(JSON.stringify({role:"ADMIN",exp:Date.now()+8*60*60*1000,nonce:crypto.randomBytes(16).toString("hex")})).toString("base64url");
  const token=payload+"."+sign(payload,secret);
  res.setHeader("Set-Cookie",`cnipms_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);
  return res.status(200).json({ok:true});
};