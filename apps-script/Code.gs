/**
 * CNIPMS Google Sheets backend — catalog + inventory.
 * Script Properties required:
 *   CNIPMS_API_TOKEN = same token configured in Vercel
 *   CNIPMS_SPREADSHEET_ID = ID of the existing CNIPMS spreadsheet
 */
const TAB = {
  generics: 'GenericDrugs', brands: 'BrandProducts', locations: 'StorageLocations',
  lots: 'Lots', movements: 'StockMovements', reorder: 'ReorderLevels', audit: 'AuditLog'
};
const HEADERS = {
  GenericDrugs: ['generic_code','generic_name','strength','dosage_form','is_controlled','status','created_at','updated_at'],
  BrandProducts: ['brand_code','brand_name','generic_code','warehouse_name','strength','dosage_form','units_per_box','status','created_at','updated_at'],
  StorageLocations: ['location_id','location_name','location_type','status'],
  Lots: ['lot_id','brand_code','batch_number','expiry_date','created_at'],
  StockMovements: ['movement_id','timestamp','movement_type','brand_code','lot_id','batch_number','expiry_date','from_location_id','to_location_id','quantity_units','status','notes'],
  ReorderLevels: ['brand_code','location_id','reorder_level_units','updated_at'],
  AuditLog: ['timestamp','action','entity','entity_id','details']
};
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ok:true,service:'CNIPMS Google Sheets API',version:'2.0'})).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const token = PropertiesService.getScriptProperties().getProperty('CNIPMS_API_TOKEN') || '';
    if (!token || !safeEqual_(String(req.token||''), token)) return out_({ok:false,error:'UNAUTHORIZED'});
    const d = req.data || {};
    let result;
    switch (String(req.action||'')) {
      case 'listGenerics': result = list_('GenericDrugs'); break;
      case 'listBrands': result = list_('BrandProducts'); break;
      case 'getGeneric': result = list_('GenericDrugs').find(x=>norm_(x.generic_code)===norm_(d.generic_code)) || null; break;
      case 'addGeneric': result = addCatalog_('GenericDrugs',d,'generic_code'); break;
      case 'addBrand': result = addBrand_(d); break;
      case 'listLocations': result = ensureLocations_(); break;
      case 'listMovements': result = list_('StockMovements'); break;
      case 'listReorderLevels': result = list_('ReorderLevels'); break;
      case 'listInventory': result = inventory_(); break;
      case 'receiveStock': result = receive_(d); break;
      case 'transferStock': result = transfer_(d); break;
      case 'adjustStock': result = adjust_(d); break;
      case 'setReorderLevel': result = setReorder_(d); break;
      default: return out_({ok:false,error:'UNKNOWN_ACTION'});
    }
    return out_({ok:true,result:result});
  } catch (err) {
    return out_({ok:false,error:String(err && err.message || err)});
  }
}
function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function safeEqual_(a,b){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;}
function ss_(){const id=PropertiesService.getScriptProperties().getProperty('CNIPMS_SPREADSHEET_ID');return id?SpreadsheetApp.openById(id):SpreadsheetApp.getActiveSpreadsheet();}
function sheet_(name){const ss=ss_();let sh=ss.getSheetByName(name);if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,HEADERS[name].length).setValues([HEADERS[name]]);sh.setFrozenRows(1);}else if(sh.getLastRow()===0){sh.getRange(1,1,1,HEADERS[name].length).setValues([HEADERS[name]]);sh.setFrozenRows(1);}return sh;}
function rows_(name){const sh=sheet_(name);const values=sh.getDataRange().getValues();if(!values.length)return [];const headers=values[0].map(String);return values.slice(1).filter(r=>r.some(v=>v!==''&&v!==null)).map(r=>{const o={};headers.forEach((h,i)=>o[h]=dateValue_(r[i]));return o;});}
function dateValue_(v){return v instanceof Date?Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss'):v;}
function list_(name){return rows_(name);}
function append_(name,obj){const sh=sheet_(name);const hs=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);sh.appendRow(hs.map(h=>obj[h]===undefined?'':obj[h]));}
function norm_(v){return String(v||'').trim().toUpperCase();}
function now_(){return new Date();}
function audit_(action,entity,id,details){append_('AuditLog',{timestamp:now_(),action:action,entity:entity,entity_id:id,details:JSON.stringify(details||{})});}
function addCatalog_(tab,d,key){const required=tab==='GenericDrugs'?['generic_code','generic_name','strength','dosage_form','status']:[];required.forEach(k=>{if(!String(d[k]||'').trim())throw new Error('Missing required field: '+k);});const code=norm_(d[key]);if(!code)throw new Error('Code is required.');const all=list_('GenericDrugs').concat(list_('BrandProducts'));if(all.some(x=>norm_(x.generic_code||x.brand_code)===code))throw new Error('This drug code already exists. Codes must be unique across both catalogs.');const obj=Object.assign({},d,{created_at:now_(),updated_at:now_()});append_(tab,obj);audit_('ADD',tab,code,obj);return obj;}
function addBrand_(d){['brand_code','brand_name','generic_code','strength','dosage_form','units_per_box','status'].forEach(k=>{if(String(d[k]||'').trim()==='')throw new Error('Missing required field: '+k);});if(!(Number(d.units_per_box)>0&&Number.isInteger(Number(d.units_per_box))))throw new Error('Units per box must be a positive whole number.');if(!list_('GenericDrugs').some(x=>norm_(x.generic_code)===norm_(d.generic_code)))throw new Error('Generic code not found.');return addCatalog_('BrandProducts',Object.assign({},d,{units_per_box:Number(d.units_per_box)}),'brand_code');}
function ensureLocations_(){let a=list_('StorageLocations');if(!a.length){const defaults=[['MAIN','Main Warehouse','WAREHOUSE','ACTIVE'],['INPATIENT','Inpatient Pharmacy','PHARMACY','ACTIVE'],['OUTPATIENT','Outpatient Pharmacy','PHARMACY','ACTIVE'],['MEDCENTER','Medical Center Pharmacy','PHARMACY','ACTIVE']];defaults.forEach(r=>append_('StorageLocations',{location_id:r[0],location_name:r[1],location_type:r[2],status:r[3]}));a=list_('StorageLocations');}return a;}
function validateQty_(q){const n=Number(q);if(!Number.isInteger(n)||n<=0)throw new Error('Quantity must be a positive whole number of units.');return n;}
function brand_(code){const b=list_('BrandProducts').find(x=>norm_(x.brand_code)===norm_(code));if(!b)throw new Error('Brand code not found.');return b;}
function location_(id){const l=ensureLocations_().find(x=>norm_(x.location_id)===norm_(id));if(!l)throw new Error('Storage location not found: '+id);if(norm_(l.status||'ACTIVE')==='INACTIVE')throw new Error('Storage location is inactive.');return l;}
function inventory_(){
 const brands=list_('BrandProducts'), locs=ensureLocations_(), moves=list_('StockMovements'), levels=list_('ReorderLevels'), result=[];
 brands.forEach(b=>locs.forEach(l=>{
  if(norm_(b.status||'ACTIVE')==='INACTIVE'||norm_(l.status||'ACTIVE')==='INACTIVE')return;
  let units=0;
  moves.forEach(m=>{if(norm_(m.status||'POSTED')!=='POSTED'||norm_(m.brand_code)!==norm_(b.brand_code))return;const q=Number(m.quantity_units)||0, type=norm_(m.movement_type);if(type==='RECEIPT'&&norm_(m.to_location_id)===norm_(l.location_id))units+=q;else if(type==='TRANSFER'&&norm_(m.to_location_id)===norm_(l.location_id))units+=q;else if(type==='TRANSFER'&&norm_(m.from_location_id)===norm_(l.location_id))units-=q;else if(type==='ADJUSTMENT'&&norm_(m.to_location_id)===norm_(l.location_id))units+=q;else if(type==='ADJUSTMENT'&&norm_(m.from_location_id)===norm_(l.location_id))units-=q;});
  const level=levels.find(x=>norm_(x.brand_code)===norm_(b.brand_code)&&norm_(x.location_id)===norm_(l.location_id));
  const per=Number(b.units_per_box)||1, reorder=Number(level&&level.reorder_level_units)||0;
  result.push({brand_code:b.brand_code,brand_name:b.brand_name,generic_code:b.generic_code,location_id:l.location_id,location_name:l.location_name,stock_units:units,full_boxes:Math.floor(units/per),remaining_units:units%per,reorder_level_units:reorder,low_stock:reorder>0&&units<=reorder});
 }));
 return result;
}
function receive_(d){const lock=LockService.getScriptLock();lock.waitLock(15000);try{
 const b=brand_(d.brand_code), l=location_(d.to_location_id||'MAIN'), q=validateQty_(d.quantity_units);
 if(!String(d.batch_number||'').trim())throw new Error('Batch number is required.');if(!String(d.expiry_date||'').trim())throw new Error('Expiry date is required.');
 const exp=new Date(d.expiry_date);if(isNaN(exp.getTime()))throw new Error('Invalid expiry date.');
 const lotId='LOT-'+Utilities.getUuid().slice(0,8).toUpperCase();
 append_('Lots',{lot_id:lotId,brand_code:b.brand_code,batch_number:String(d.batch_number).trim(),expiry_date:d.expiry_date,created_at:now_()});
 const m={movement_id:Utilities.getUuid(),timestamp:now_(),movement_type:'RECEIPT',brand_code:b.brand_code,lot_id:lotId,batch_number:String(d.batch_number).trim(),expiry_date:d.expiry_date,from_location_id:'',to_location_id:l.location_id,quantity_units:q,status:'POSTED',notes:String(d.notes||'')};
 append_('StockMovements',m);audit_('RECEIVE_STOCK','StockMovements',m.movement_id,m);return m;
 }finally{lock.releaseLock();}}
function available_(brandCode,locationId,lotId){return inventoryByLot_().filter(x=>norm_(x.brand_code)===norm_(brandCode)&&norm_(x.location_id)===norm_(locationId)&&(!lotId||norm_(x.lot_id)===norm_(lotId))).reduce((s,x)=>s+x.units,0);}
function inventoryByLot_(){const moves=list_('StockMovements'),out=[];moves.forEach(m=>{if(norm_(m.status||'POSTED')!=='POSTED')return;const q=Number(m.quantity_units)||0,t=norm_(m.movement_type);if(t==='RECEIPT')out.push({brand_code:m.brand_code,location_id:m.to_location_id,lot_id:m.lot_id,units:q});else if(t==='TRANSFER'){out.push({brand_code:m.brand_code,location_id:m.to_location_id,lot_id:m.lot_id,units:q});out.push({brand_code:m.brand_code,location_id:m.from_location_id,lot_id:m.lot_id,units:-q});}else if(t==='ADJUSTMENT'){if(m.to_location_id)out.push({brand_code:m.brand_code,location_id:m.to_location_id,lot_id:m.lot_id,units:q});if(m.from_location_id)out.push({brand_code:m.brand_code,location_id:m.from_location_id,lot_id:m.lot_id,units:-q});}});return out;}
function transfer_(d){const lock=LockService.getScriptLock();lock.waitLock(15000);try{
 const b=brand_(d.brand_code), from=location_(d.from_location_id), to=location_(d.to_location_id), q=validateQty_(d.quantity_units), lotId=String(d.lot_id||'').trim();
 if(norm_(from.location_id)===norm_(to.location_id))throw new Error('Source and destination must be different.');
 if(!lotId)throw new Error('Select a lot ID for transfer.');
 const avail=available_(b.brand_code,from.location_id,lotId);if(avail<q)throw new Error('Insufficient stock in the selected location and lot. Available: '+avail+' units.');
 const m={movement_id:Utilities.getUuid(),timestamp:now_(),movement_type:'TRANSFER',brand_code:b.brand_code,lot_id:lotId,batch_number:String(d.batch_number||''),expiry_date:String(d.expiry_date||''),from_location_id:from.location_id,to_location_id:to.location_id,quantity_units:q,status:'POSTED',notes:String(d.notes||'')};
 append_('StockMovements',m);audit_('TRANSFER_STOCK','StockMovements',m.movement_id,m);return m;
 }finally{lock.releaseLock();}}
function adjust_(d){const lock=LockService.getScriptLock();lock.waitLock(15000);try{
 const b=brand_(d.brand_code), loc=location_(d.location_id), q=validateQty_(d.quantity_units), direction=norm_(d.direction), lotId=String(d.lot_id||'').trim();
 if(!lotId)throw new Error('Lot ID is required.');
 let from='',to=loc.location_id;if(direction==='DECREASE'){from=loc.location_id;to='';if(available_(b.brand_code,loc.location_id,lotId)<q)throw new Error('Adjustment exceeds available stock.');}else if(direction!=='INCREASE')throw new Error('Direction must be INCREASE or DECREASE.');
 const m={movement_id:Utilities.getUuid(),timestamp:now_(),movement_type:'ADJUSTMENT',brand_code:b.brand_code,lot_id:lotId,batch_number:String(d.batch_number||''),expiry_date:String(d.expiry_date||''),from_location_id:from,to_location_id:to,quantity_units:q,status:'POSTED',notes:String(d.notes||'')};
 append_('StockMovements',m);audit_('ADJUST_STOCK','StockMovements',m.movement_id,m);return m;
 }finally{lock.releaseLock();}}
function setReorder_(d){const b=brand_(d.brand_code),l=location_(d.location_id),q=Number(d.reorder_level_units);if(!Number.isInteger(q)||q<0)throw new Error('Reorder level must be a non-negative whole number of units.');const sh=sheet_('ReorderLevels'),all=list_('ReorderLevels'),existing=all.find(x=>norm_(x.brand_code)===norm_(b.brand_code)&&norm_(x.location_id)===norm_(l.location_id));if(existing){const hs=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);const row=all.findIndex(x=>norm_(x.brand_code)===norm_(b.brand_code)&&norm_(x.location_id)===norm_(l.location_id))+2;const obj={brand_code:b.brand_code,location_id:l.location_id,reorder_level_units:q,updated_at:now_()};sh.getRange(row,1,1,hs.length).setValues([hs.map(h=>obj[h]===undefined?'':obj[h])]);}else append_('ReorderLevels',{brand_code:b.brand_code,location_id:l.location_id,reorder_level_units:q,updated_at:now_()});audit_('SET_REORDER_LEVEL','ReorderLevels',b.brand_code+'|'+l.location_id,{reorder_level_units:q});return {brand_code:b.brand_code,location_id:l.location_id,reorder_level_units:q};}
