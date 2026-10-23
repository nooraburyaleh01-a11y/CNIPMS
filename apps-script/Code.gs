/**
 * CNIPMS Apps Script API
 * Set Script Property CNIPMS_API_TOKEN to a long random secret.
 * Bind this script to the CNIPMS spreadsheet (or set CNIPMS_SPREADSHEET_ID).
 */
function doGet() {
  return json_({ok:true,service:"CNIPMS API",version:"1.1"});
}
function doPost(e) {
  try {
    var body=JSON.parse(e && e.postData && e.postData.contents || "{}");
    var expected=PropertiesService.getScriptProperties().getProperty("CNIPMS_API_TOKEN");
    if(!expected || !body.token || !constantTime_(String(body.token),expected)) return json_({ok:false,error:"UNAUTHORIZED"});
    var a=String(body.action||""),d=body.data||{},result;
    switch(a){
      case "listGenerics": result=list_("GenericDrugs");break;
      case "listBrands": result=list_("BrandProducts");break;
      case "listLocations": result=list_("StorageLocations");break;
      case "listMovements": result=list_("StockMovements");break;
      case "listInventory": result=listInventory_();break;
      case "getGeneric": result=getGeneric_(d.generic_code);break;
      case "addGeneric": result=addGeneric_(d);break;
      case "addBrand": result=addBrand_(d);break;
      default: throw new Error("UNKNOWN_ACTION");
    }
    return json_({ok:true,result:result});
  }catch(err){return json_({ok:false,error:String(err && err.message || err)});}
}
function ss_(){var id=PropertiesService.getScriptProperties().getProperty("CNIPMS_SPREADSHEET_ID");return id?SpreadsheetApp.openById(id):SpreadsheetApp.getActiveSpreadsheet();}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function constantTime_(a,b){if(a.length!==b.length)return false;var d=0;for(var i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function sheet_(n){var s=ss_().getSheetByName(n);if(!s)throw new Error("SHEET_NOT_FOUND_"+n);return s;}
function list_(n){var s=sheet_(n),v=s.getDataRange().getValues();if(v.length<2)return [];var h=v[0].map(String);return v.slice(1).filter(function(r){return r.some(function(x){return x!=="";});}).map(function(r){var o={};h.forEach(function(k,i){var x=r[i];o[k]=x instanceof Date?x.toISOString():x;});return o;});}
function text_(v,k){var s=String(v==null?"":v).trim();if(!s)throw new Error("REQUIRED_FIELD_"+k);return s;}
function norm_(v){return String(v||"").trim().toUpperCase();}
function status_(v){var s=String(v||"").trim().toUpperCase();if(["ACTIVE","INACTIVE"].indexOf(s)<0)throw new Error("INVALID_STATUS");return s;}
function bool_(v){if(v===true||String(v).toLowerCase()==="true"||String(v).toLowerCase()==="yes")return true;if(v===false||String(v).toLowerCase()==="false"||String(v).toLowerCase()==="no")return false;throw new Error("INVALID_IS_CONTROLLED");}
function unique_(code){var k=norm_(code);if(list_("GenericDrugs").some(function(r){return norm_(r.generic_code)===k;})||list_("BrandProducts").some(function(r){return norm_(r.brand_code)===k;}))throw new Error("DUPLICATE_DRUG_CODE");}
function find_(sheet,keyCol,value){var k=norm_(value);return list_(sheet).find(function(r){return norm_(r[keyCol])===k;})||null;}
function append_(n,o){var s=sheet_(n),h=s.getRange(1,1,1,s.getLastColumn()).getDisplayValues()[0];s.appendRow(h.map(function(k){return o[k]===undefined?"":o[k];}));}
function audit_(action,type,id,before,after){var s=sheet_("AuditLog"),h=s.getRange(1,1,1,s.getLastColumn()).getDisplayValues()[0],o={audit_id:Utilities.getUuid(),timestamp:new Date(),user_id:"Vercel API",action:action,entity_type:type,entity_id:id,before_json:before?JSON.stringify(before):"",after_json:after?JSON.stringify(after):"",reason:"CNIPMS API",request_id:Utilities.getUuid()};s.appendRow(h.map(function(k){return o[k]===undefined?"":o[k];}));}
function addGeneric_(d){var code=text_(d.generic_code,"generic_code"),name=text_(d.generic_name,"generic_name"),strength=text_(d.strength,"strength"),form=text_(d.dosage_form,"dosage_form"),controlled=bool_(d.is_controlled),status=status_(d.status);var l=LockService.getScriptLock();l.waitLock(30000);try{unique_(code);var now=new Date(),o={generic_code:code,generic_name:name,strength:strength,dosage_form:form,is_controlled:controlled,status:status,created_at:now,updated_at:now};append_("GenericDrugs",o);audit_("CREATE","GenericDrugs",code,null,o);return o;}finally{l.releaseLock();}}
function addBrand_(d){var code=text_(d.brand_code,"brand_code"),name=text_(d.brand_name,"brand_name"),gc=text_(d.generic_code,"generic_code"),strength=text_(d.strength,"strength"),form=text_(d.dosage_form,"dosage_form"),upb=Number(d.units_per_box),status=status_(d.status);if(!Number.isSafeInteger(upb)||upb<=0)throw new Error("INVALID_UNITS_PER_BOX");var l=LockService.getScriptLock();l.waitLock(30000);try{unique_(code);var g=find_("GenericDrugs","generic_code",gc);if(!g)throw new Error("GENERIC_CODE_NOT_FOUND");if(String(g.status).toUpperCase()!=="ACTIVE")throw new Error("GENERIC_IS_INACTIVE");var now=new Date(),o={brand_code:code,brand_name:name,generic_code:g.generic_code,warehouse_name:String(d.warehouse_name||"").trim(),strength:strength,dosage_form:form,units_per_box:upb,status:status,created_at:now,updated_at:now};append_("BrandProducts",o);audit_("CREATE","BrandProducts",code,null,o);return {brand:o,generic_name:g.generic_name};}finally{l.releaseLock();}}
function getGeneric_(code){var g=find_("GenericDrugs","generic_code",text_(code,"generic_code"));if(!g)throw new Error("GENERIC_CODE_NOT_FOUND");return g;}
function listInventory_(){var brands=list_("BrandProducts"),locations=list_("StorageLocations"),lots=list_("Lots"),settings=list_("Inventory"),moves=list_("StockMovements").filter(function(m){return String(m.status).toUpperCase()==="POSTED";});var out=[];brands.forEach(function(b){locations.forEach(function(loc){var units=0;lots.filter(function(l){return String(l.brand_code)===String(b.brand_code)&&String(l.location_id)===String(loc.location_id)&&String(l.status).toUpperCase()==="ACTIVE";}).forEach(function(lot){moves.forEach(function(m){if(String(m.brand_code)!==String(b.brand_code)||String(m.lot_id)!==String(lot.lot_id))return;var q=Number(m.quantity_units)||0,t=String(m.movement_type).toUpperCase();if(["RECEIPT","RETURN","ADJUSTMENT_IN"].indexOf(t)>=0&&String(m.to_location_id)===String(loc.location_id))units+=q;if(["TRANSFER","DISPENSE","ADJUSTMENT_OUT"].indexOf(t)>=0&&String(m.from_location_id)===String(loc.location_id))units-=q;if(t==="TRANSFER"&&String(m.to_location_id)===String(loc.location_id))units+=q;});});var setting=settings.find(function(x){return String(x.brand_code)===String(b.brand_code)&&String(x.location_id)===String(loc.location_id);});var threshold=setting?Number(setting.reorder_level_units)||0:0,per=Number(b.units_per_box)||1;out.push({brand_code:b.brand_code,brand_name:b.brand_name,location_id:loc.location_id,location_name:loc.location_name,stock_units:units,full_boxes:Math.floor(units/per),remaining_units:units%per,reorder_level_units:threshold,low_stock:!!setting&&units<=threshold});});});return out;}
