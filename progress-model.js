/* Progress format shared by the local page, backups, and GitHub sync. */
globalThis.JagadProgress = function createProgressModel(readingIds) {
 'use strict';
 const known=new Set(readingIds), fields=['skim','deep','legacy'];
 const emptyStage=()=>({completed:false,updatedAt:null});
 const empty=()=>({skim:emptyStage(),deep:emptyStage(),legacy:emptyStage()});
 const dateOK=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
 function stage(value){
   if(!value||typeof value.completed!=='boolean'||!(value.updatedAt===null||dateOK(value.updatedAt))||(value.completed&&!dateOK(value.updatedAt)))throw Error('Status atau tanggal tahap baca tidak valid.');
   return {completed:value.completed,updatedAt:value.updatedAt};
 }
 function record(value,version=2){
   if(version===1){if(!value||typeof value.completed!=='boolean'||!dateOK(value.updatedAt))throw Error('Status bacaan lama tidak valid.');return {...empty(),legacy:stage(value)};}
   if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Status bacaan tidak valid.');
   return Object.fromEntries(fields.map(field=>[field,stage(value[field])]));
 }
 function validate(data){
   if(!data||data.schema!=='jagad-reading-progress'||![1,2].includes(data.version)||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))throw Error('Format cadangan tidak sesuai.');
   return Object.fromEntries(Object.entries(data.entries).map(([id,value])=>{if(!known.has(id))throw Error('Cadangan memuat bacaan di luar paket ini.');return [id,record(value,data.version)];}));
 }
 function validatePatches(patches){
   if(!patches||typeof patches!=='object'||Array.isArray(patches))throw Error('Perubahan tertunda tidak valid.');
   return Object.fromEntries(Object.entries(patches).map(([id,changes])=>{
     if(!known.has(id)||!changes||typeof changes!=='object'||Array.isArray(changes))throw Error('Perubahan tertunda tidak valid.');
     return [id,Object.fromEntries(Object.entries(changes).map(([field,value])=>{if(!fields.includes(field))throw Error('Tahap baca tidak dikenal.');return [field,stage(value)];}))];
   }));
 }
 function merge(entries,patches){
   const merged=validate({schema:'jagad-reading-progress',version:2,entries});
   for(const [id,changes]of Object.entries(validatePatches(patches)))merged[id]={...(merged[id]||empty()),...changes};
   return merged;
 }
 function diff(before,after,timestamp=new Date().toISOString()){
   const patches={};
   for(const id of new Set([...Object.keys(before),...Object.keys(after)])){
     const old=before[id]||empty(),now=after[id]||empty();
     for(const field of fields)if(JSON.stringify(old[field])!==JSON.stringify(now[field]))(patches[id]||={})[field]=now[field].updatedAt?now[field]:{completed:false,updatedAt:timestamp};
   }return patches;
 }
 const pendingLegacy=value=>Boolean(value?.legacy.completed&&!value.skim.updatedAt&&!value.deep.updatedAt);
 function counts(entries,ids=[...known]){return ids.reduce((total,id)=>{const value=entries[id];if(value?.skim.completed)total.skim++;if(value?.deep.completed)total.deep++;if(pendingLegacy(value))total.legacy++;return total;},{skim:0,deep:0,legacy:0});}
 return {empty,validate,validatePatches,merge,diff,counts,pendingLegacy};
};
