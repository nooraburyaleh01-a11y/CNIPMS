const config = require("../config/google-apps-script");
module.exports = async function(req,res){
  res.setHeader("Cache-Control","no-store");
  if(!["GET","POST"].includes(req.method))return res.status(405).json({ok:false,error:"METHOD_NOT_ALLOWED"});
  const gasUrl=config.GAS_URL;
  if(!gasUrl)return res.status(500).json({ok:false,error:"MISSING_WEB_APP_URL"});
  const action=req.method==="GET"?String(req.query.action||""):String((req.body||{}).action||"");
  const allowed=["listGenerics","getGeneric","addGeneric","addBrand","listBrands","listInventory","listMovements","listLocations","listReorderLevels","setReorderLevel","receiveStock","transferStock","adjustStock"];
  if(!allowed.includes(action))return res.status(400).json({ok:false,error:"UNKNOWN_ACTION"});
  try{
    const data=req.method==="GET"?Object.fromEntries(Object.entries(req.query||{}).filter(([k])=>k!=="action")):((req.body||{}).data||{});
    const r=await fetch(gasUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,data}),redirect:"follow"});
    const raw=await r.text();let j;
    try{j=JSON.parse(raw)}catch{return res.status(502).json({ok:false,error:"INVALID_WEB_APP_RESPONSE",message:"Google Apps Script did not return JSON."})}
    if(!r.ok||j.ok===false)return res.status(502).json({ok:false,error:j.error||"UPSTREAM_ERROR",message:j.message||"Apps Script rejected this action."});
    return res.status(200).json(j);
  }catch(e){return res.status(502).json({ok:false,error:"UPSTREAM_ERROR",message:"Unable to reach Google Apps Script."})}
};
