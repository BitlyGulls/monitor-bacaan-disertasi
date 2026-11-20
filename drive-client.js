/* Manual Google Drive saving adapted from the user-owned dissertation planner. */

(()=>{
'use strict';
const bridge=window.readingBridge,$=id=>document.getElementById(id),copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const config=JSON.parse($('google-drive-config').textContent),scope='https://www.googleapis.com/auth/drive.appdata openid https://www.googleapis.com/auth/userinfo.email',filename='reading-'+bridge.projectId()+'.json';
let client=null,token=null,expires=0,user=null,base=null,remote=null,busy=false,authBusy=false,mode='preparing',intent='load',conflict=false,initial=copy(bridge.read());
const messages={en:{connect:'Open Google Drive',save:'Save to Google Drive',load:'Reload from Drive',disconnect:'Disconnect',preparing:'Preparing Google Drive…',signedOut:'Open your Google Drive to continue. Changes are not sent automatically.',loading:'Opening your saved reading progress…',saved:'Saved to Google Drive',pending:'Unsaved changes — press Save to Google Drive',empty:'No saved reading progress yet — press Save to create one',saving:'Saving to Google Drive…',error:'Could not access Drive. Your draft is still on this device. Try again.',expired:'Google connection expired — press Save or Open Google Drive to reconnect.',conflict:'Drive has a different version. Open it, or save this device’s version as the latest.',useRemote:'Open Drive version',keepLocal:'Save this version',localFile:'Offline HTML copy. Use the online reading app to open or save Google Drive.',setup:'Google Drive is unavailable. Export HTML or JSON to keep a copy.',popup:'Google sign-in did not finish. Allow popups and try again.',permission:'Drive permission was not granted. Try Open Google Drive again.',invalid:'The saved file could not be read. Your current reading progress has been kept.',tooLarge:'Reading progress exceeds the 5 MB limit. Export a backup and reduce its size.',discard:'Open the saved Drive version and replace the unsaved changes on this device?',leave:'Disconnect? Unsaved changes will remain as a draft on this device.',lastSaved:'Last saved',storage:'Local draft storage is unavailable. Keep this tab open or export a backup.'},id:{connect:'Buka Google Drive',save:'Simpan ke Google Drive',load:'Muat ulang dari Drive',disconnect:'Putuskan koneksi',preparing:'Menyiapkan Google Drive…',signedOut:'Buka Google Drive Anda untuk melanjutkan. Perubahan tidak dikirim otomatis.',loading:'Membuka progres bacaan tersimpan…',saved:'Tersimpan di Google Drive',pending:'Perubahan belum disimpan — tekan Simpan ke Google Drive',empty:'Belum ada simpanan — tekan Simpan untuk membuatnya',saving:'Menyimpan ke Google Drive…',error:'Drive belum dapat diakses. Draf tetap di perangkat ini. Coba lagi.',expired:'Koneksi Google berakhir — tekan Simpan atau Buka Google Drive untuk menghubungkan lagi.',conflict:'Versi di Drive berbeda. Buka versi tersebut, atau simpan versi perangkat ini sebagai yang terbaru.',useRemote:'Buka versi Drive',keepLocal:'Simpan versi ini',localFile:'Salinan HTML luring. Gunakan situs bacaan daring untuk membuka atau menyimpan Google Drive.',setup:'Google Drive belum tersedia. Ekspor HTML atau JSON untuk menyimpan salinan.',popup:'Login Google belum selesai. Izinkan popup lalu coba lagi.',permission:'Izin Drive belum diberikan. Coba Buka Google Drive lagi.',invalid:'Berkas simpanan tidak dapat dibaca. Progres bacaan saat ini tetap dipertahankan.',tooLarge:'Progres bacaan melebihi batas 5 MB. Ekspor cadangan dan kurangi ukurannya.',discard:'Buka versi tersimpan di Drive dan ganti perubahan yang belum disimpan pada perangkat ini?',leave:'Putuskan koneksi? Perubahan yang belum disimpan tetap menjadi draf di perangkat ini.',lastSaved:'Terakhir disimpan',storage:'Draf lokal tidak dapat disimpan. Biarkan tab terbuka atau ekspor cadangan.'}};
const t=key=>(messages[bridge.language()]||messages.en)[key],key=()=> 'jagad-reading-drive-base:'+user.sub+':'+bridge.projectId();
const dirty=()=>user?(!base||!same(bridge.read(),base.data)):!same(bridge.read(),initial);
function remember(){if(!user)return;try{localStorage.setItem(key(),JSON.stringify({base}))}catch(e){}}
function render(){
 $('drive-connect').textContent=t('connect');$('drive-save').textContent=t('save');$('drive-load').textContent=t('load');$('drive-disconnect').textContent=t('disconnect');$('drive-use-remote').textContent=t('useRemote');$('drive-keep-local').textContent=t('keepLocal');
 $('drive-connect').hidden=!!user&&mode!=='expired';$('drive-load').hidden=!user;$('drive-disconnect').hidden=!user;
 for(const id of ['drive-connect','drive-save','drive-load','drive-disconnect'])$(id).disabled=busy||authBusy||!client||['setup','localFile'].includes(mode);
 $('drive-use-remote').hidden=!conflict||!remote;$('drive-keep-local').hidden=!conflict; $('drive-use-remote').disabled=busy||authBusy;$('drive-keep-local').disabled=busy||authBusy;
 $('account-name').textContent=user?.email||'';
 const state=['saved','pending','empty'].includes(mode)?(dirty()?(base?'pending':'empty'):'saved'):mode;
 let label=t(state)||t('error');if(base?.savedAt&&!['loading','saving'].includes(state))label+=' · '+t('lastSaved')+': '+new Date(base.savedAt).toLocaleString(bridge.language()==='id'?'id-ID':'en-GB');
 $('cloud-status').textContent=label;$('cloud-status').dataset.status=state;
}
function lockEditor(value){document.querySelectorAll('main').forEach(main=>main.inert=value);$('import-progress').disabled=value;}
function setMode(next){mode=next;render()}
async function api(path,options={}){
 if(!token||Date.now()>=expires){token=null;throw Object.assign(Error('expired'),{code:'expired'})}
 const response=await fetch(path,{...options,headers:{Authorization:'Bearer '+token,...options.headers},signal:AbortSignal.timeout(25000),cache:'no-store'});
 if(!response.ok){if(response.status===401){token=null;throw Object.assign(Error('expired'),{code:'expired'})}throw Error('drive-'+response.status)}return response;
}
async function latest(){
 const query=new URLSearchParams({spaces:'appDataFolder',q:"trashed = false and name = '"+filename+"'",orderBy:'createdTime desc',pageSize:'100',fields:'files(id,createdTime),nextPageToken'});
 const list=await(await api('https://www.googleapis.com/drive/v3/files?'+query)).json();
 if(!list.files?.length)return null;
 // Every Save creates a new snapshot. Simultaneous saves cannot destroy an older one.
 const entry=list.files[0],raw=await(await api('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(entry.id)+'?alt=media')).json();
 if(raw.format!=='jagad-drive-reading-v1'||raw.projectId!==bridge.projectId()||!raw.progress||raw.progress.projectId!==bridge.projectId())throw Object.assign(Error('invalid'),{code:'invalid'});
 return{id:entry.id,savedAt:entry.createdTime,data:bridge.validate(raw.progress)};
}
function accept(record){base=record;remote=null;conflict=false;if(record)bridge.apply(record.data);remember();setMode(record?'saved':'empty')}
function showConflict(record){remote=record;conflict=true;setMode('conflict')}
function failure(error){setMode(error.code||'error')}
async function run(action,force=false){
 if(busy)return;busy=true;setMode(action==='save'?'saving':'loading');if(action==='load')lockEditor(true);
 try{
  const found=await latest();
  if(action==='load'){
   if(found){if(!force&&dirty()&&!same(bridge.read(),found.data)){showConflict(found);return}accept(found)}
   else{base=null;remote=null;conflict=false;remember();setMode('empty')}return;
  }
  if(!force&&found?.id!==(base?.id)&&found&&!same(found.data,base?.data)&&!same(found.data,bridge.read())){showConflict(found);return}
  const plan=copy(bridge.read());if(found&&same(plan,found.data)){base=found;conflict=false;remote=null;remember();setMode('saved');return}
  const raw=JSON.stringify({format:'jagad-drive-reading-v1',projectId:bridge.projectId(),savedAt:new Date().toISOString(),parentId:found?.id||null,progress:plan});
  if(new TextEncoder().encode(raw).byteLength>5000000)throw Object.assign(Error('tooLarge'),{code:'tooLarge'});
  const boundary='reading_'+crypto.randomUUID().replaceAll('-',''),metadata={name:filename,mimeType:'application/json',parents:['appDataFolder']};
  const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+raw+'\r\n--'+boundary+'--';
  const result=await(await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,createdTime',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body})).json();
  if(!result.id)throw Error('missing-id');base={id:result.id,savedAt:result.createdTime||new Date().toISOString(),data:plan};remote=null;conflict=false;remember();setMode('saved');
 }catch(error){failure(error)}finally{busy=false;lockEditor(false);render()}
}
async function authorized(response){
 authBusy=false;if(response.error){setMode('permission');return}
 if(!google.accounts.oauth2.hasGrantedAllScopes(response,'https://www.googleapis.com/auth/drive.appdata','openid','https://www.googleapis.com/auth/userinfo.email')){setMode('permission');return}
 token=response.access_token;expires=Date.now()+(Number(response.expires_in)||3600)*1000-30000;busy=true;lockEditor(true);let newAccount=false;setMode('loading');
 try{
  const identity=await(await api('https://openidconnect.googleapis.com/v1/userinfo')).json();if(!identity.sub)throw Error('identity');
  newAccount=user?.sub!==identity.sub;
  if(newAccount){
   user=identity;const migration=bridge.account(identity.sub);base=null;remote=null;conflict=false;
   try{const cached=JSON.parse(localStorage.getItem(key())||'null');if(cached?.base){base={...cached.base,data:bridge.validate(cached.base.data)}}}catch(e){}
   const found=await latest(),local=bridge.read();
   if(found){
    if(same(local,found.data)||(!migration.hasCache&&!migration.anonymousDraft)||(base&&same(local,base.data))){accept(found)}
    else if(base?.id===found.id){setMode('pending')}
    else{showConflict(found)}
   }else{base=null;remember();setMode('empty')}
  }else setMode(dirty()?'pending':'saved');
 }catch(error){failure(error);busy=false;lockEditor(false);render();return}
 busy=false;lockEditor(false);render();if(intent==='save'&&!conflict)await run('save');else if(intent==='load'&&!conflict&&!newAccount)await run('load',true);
}
function request(action){
 if(busy||authBusy||!client)return;if(action==='save'&&bridge.flush?.()===false)return;intent=action;
 if(action==='load'&&user&&dirty()&&!confirm(t('discard')))return;
 if(token&&Date.now()<expires){run(action,action==='load');return}
 authBusy=true;render();try{client.requestAccessToken({prompt:user?'':'select_account',...(user?.email?{hint:user.email}:{})})}catch(e){authBusy=false;setMode('popup')}
}
function disconnect(){if(dirty()&&!confirm(t('leave')))return;token=null;expires=0;user=null;base=null;remote=null;conflict=false;bridge.account(null);initial=copy(bridge.read());setMode('signedOut')}
function changed(e){if(!e.detail?.remote&&user&&!busy&&['saved','pending','empty'].includes(mode))mode=dirty()?'pending':'saved';render()}
window.addEventListener('reading-change',changed);window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue=''}});
window.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&location.protocol!=='file:'){event.preventDefault();request('save')}});
document.addEventListener('focusout',render);
// Resolve conflicts explicitly; these buttons never send edits in the background.
const binding=()=>{
 $('drive-connect').onclick=()=>request('load');$('drive-save').onclick=()=>request('save');$('drive-load').onclick=()=>request('load');$('drive-disconnect').onclick=disconnect;
 $('drive-use-remote').onclick=()=>{if(remote)accept(remote)};$('drive-keep-local').onclick=()=>{if(bridge.flush?.()===false)return;if(token&&Date.now()<expires)run('save',true);else{conflict=false;request('save')}};
};binding();
if(location.protocol==='file:'){setMode('localFile');return}
if(!config.clientId){setMode('setup');return}
const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=()=>{try{client=google.accounts.oauth2.initTokenClient({client_id:config.clientId,scope,include_granted_scopes:false,callback:authorized,error_callback:()=>{authBusy=false;setMode('popup')}});setMode('signedOut')}catch(e){setMode('setup')}};script.onerror=()=>setMode('setup');document.head.append(script);render();
})();

