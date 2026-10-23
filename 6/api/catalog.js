const crypto = require("crypto");
function timingEqual(a,b){const x=Buffer.from(String(a||""));const y=Buffer.from(String(b||""));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function sign(value,secret){return crypto.createHmac("sha256",secret).update(value).digest("base64url")}
function session(req){
  const raw=(req.headers.cookie||"").split(";").map(s=>s.trim()).find(s=>s.startsWith("cnipms_session="));
  if(!raw)return false;
  try{
    const token=decodeURIComponent(raw.split("=").slice(1).join("=")), p=token.split(".");
    if(p.length!==2||!timingEqual(p[1],sign(p[0],process.env.CNIPMS_SESSION_SECRET||"")))return false;
    const d=JSON.parse(Buffer.from(p[0],"base64url").toString());
    return d.exp>Date.now()&&d.role==="ADMIN";
  }catch{return false}
}
module.exports=async function(req,res){
  res.setHeader("Cache-Control","no-store");
  if(!session(req))return res.status(401).json({ok:false,error:"UNAUTHENTICATED"});
  const gasConfig = require("../config/google-apps-script");
  const gasUrl = process.env.CNIPMS_GAS_URL || gasConfig.GAS_URL;
  if(!gasUrl||!process.env.CNIPMS_API_TOKEN)
    return res.status(500).json({ok:false,error:"CONFIG_MISSING",message:"Google Apps Script URL is missing or CNIPMS_API_TOKEN is missing in Vercel."});
  const action=req.method==="GET"?String(req.query.action||""):String((req.body||{}).action||"");
  const allowed=["listGenerics","getGeneric","addGeneric","addBrand","listBrands","listInventory","listMovements","listLocations","listReorderLevels","setReorderLevel","receiveStock","transferStock","adjustStock"];
  if(!allowed.includes(action))return res.status(400).json({ok:false,error:"UNKNOWN_ACTION"});
  if(!["GET","POST"].includes(req.method))return res.status(405).json({ok:false,error:"METHOD_NOT_ALLOWED"});
  try{
    const data=req.method==="GET"?{generic_code:req.query.generic_code,location_id:req.query.location_id,brand_code:req.query.brand_code}:{...((req.body||{}).data||{})};
    const payload={action,data,token:process.env.CNIPMS_API_TOKEN};
    const upstream=await fetch(gasUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload),redirect:"follow"});
    const raw=await upstream.text();let result;
    try{result=JSON.parse(raw)}catch{return res.status(502).json({ok:false,error:"INVALID_UPSTREAM_RESPONSE",message:"Google Apps Script returned a non-JSON response."})}
    if(!upstream.ok||result.ok===false){
      const unsupported=/unknown action|unsupported action|invalid action/i.test(String(result.error||result.message||""));
      return res.status(502).json({ok:false,error:unsupported?"BACKEND_ACTION_NOT_DEPLOYED":(result.error||"UPSTREAM_ERROR"),message:unsupported?"The currently deployed Apps Script does not implement this inventory action yet. GitHub files alone cannot add backend actions to a deployed Apps Script.":undefined});
    }
    return res.status(200).json(result);
  }catch(e){return res.status(502).json({ok:false,error:"UPSTREAM_ERROR",message:"Could not reach the Google Apps Script endpoint."})}
};
