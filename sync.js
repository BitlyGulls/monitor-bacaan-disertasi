/* GitHub is the shared store. Credentials stay in memory in the current tab. */
(() => {
 'use strict';
 const OWNER='BitlyGulls', REPO='monitor-bacaan-disertasi', BRANCH='reading-progress';
 const ENDPOINT=`https://api.github.com/repos/${OWNER}/${REPO}/contents/progress.json`;
 const APP=window.jagadReading, $=id=>document.getElementById(id);
 const DIRTY_KEY='jagad-must-read-v1-pending-stages-v2';
 let token='',dirty={},busy=false,timer=null,queued=false;
 let baseline=APP.get().entries;
 function status(text,warn=false){$('cloud-status').textContent=text;$('cloud-status').classList.toggle('warning',warn);}
 function persistDirty(){try{localStorage.setItem(DIRTY_KEY,JSON.stringify(dirty));}catch{status('Perubahan belum tersimpan di GitHub. Ekspor cadangan sebelum menutup halaman.',true);}}
 try{
   const saved=localStorage.getItem(DIRTY_KEY),old=localStorage.getItem('jagad-must-read-v1-pending');
   if(saved)dirty=APP.validatePatches(JSON.parse(saved));
   else if(old){const migrated=APP.validate({schema:'jagad-reading-progress',version:1,entries:JSON.parse(old)});dirty=Object.fromEntries(Object.entries(migrated).map(([id,value])=>[id,{legacy:value.legacy}]));}
   else dirty=APP.diff({},baseline);
   persistDirty();
 }catch{dirty={};}
 function rememberChanges(){
   const now=APP.get().entries;
   for(const [id,changes]of Object.entries(APP.diff(baseline,now)))dirty[id]={...(dirty[id]||{}),...changes};
   baseline=now;persistDirty();
   if(token){status('Menyimpan perubahan ke GitHub…');clearTimeout(timer);timer=setTimeout(()=>sync(true),900);}
   else status('Perubahan tersimpan di perangkat ini. Hubungkan GitHub untuk mengirimnya ke perangkat lain.');
 }
 window.addEventListener('reading-change',rememberChanges);
 function headers(){return {'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token?{'Authorization':'Bearer '+token}:{})};}
 async function request(url,options={}){
   const response=await fetch(url,{cache:'no-store',...options,headers:{...headers(),...options.headers},signal:AbortSignal.timeout(20000)});
   if(!response.ok){const error=Error(response.status===401?'Token tidak valid atau sudah kedaluwarsa.':response.status===403?'Akses GitHub dibatasi. Periksa izin Contents: Read and write atau batas permintaan.':response.status===404?'Penyimpanan progres belum tersedia atau token tidak memiliki akses ke repositori.':'GitHub merespons '+response.status+'. Coba lagi.');error.status=response.status;throw error;}
   return response.json();
 }
 function decode(content){return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0))));}
 function encode(value){const bytes=new TextEncoder().encode(JSON.stringify(value,null,2));return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));}
 function apply(entries){APP.apply(entries);baseline=APP.get().entries;}
 async function sync(write=false){
   if(busy){queued=queued||write;return;}busy=true;
   try{
     for(let attempt=0;attempt<3;attempt++){
       const remote=await request(ENDPOINT+'?ref='+BRANCH+'&t='+Date.now());
       const entries=APP.validate(decode(remote.content));
       // Merge by stage, so skimming and deep reading on the same article
       // can be updated independently by two devices. Undo records are retained.
       const pending=JSON.parse(JSON.stringify(dirty));const merged=APP.merge(entries,pending);
       if(write&&token&&Object.keys(pending).length){
         try{
           await request(ENDPOINT,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Update reading progress',branch:BRANCH,sha:remote.sha,content:encode({schema:'jagad-reading-progress',version:2,exportedAt:new Date().toISOString(),entries:merged})})});
         }catch(error){if(error.status===409&&attempt<2)continue;throw error;}
         for(const [id,changes]of Object.entries(pending)){
           for(const [field,record]of Object.entries(changes))if(JSON.stringify(dirty[id]?.[field])===JSON.stringify(record))delete dirty[id][field];
           if(dirty[id]&&!Object.keys(dirty[id]).length)delete dirty[id];
         }persistDirty();apply(APP.merge(merged,dirty));
         status(Object.keys(dirty).length?'Ada perubahan berikutnya yang menunggu disimpan.':'Tersinkron ke GitHub · '+new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}));
       }else{
         apply(merged);
         status(Object.keys(dirty).length?'Ada perubahan di perangkat ini yang belum dikirim. Hubungkan GitHub untuk menyinkronkan.':'Progres bersama dimuat dari GitHub. '+(token?'Sinkronisasi otomatis aktif.':'Hubungkan GitHub untuk menyimpan perubahan.'));
       }break;
     }
   }catch(error){status((navigator.onLine?'':'Sedang luring. ')+error.message+' Centang lokal tetap tersedia; gunakan Ekspor progres untuk cadangan.',true);}
   finally{busy=false;if(queued){queued=false;sync(true);}else if(token&&Object.keys(dirty).length)status('Ada perubahan yang belum tersimpan ke GitHub. Tekan Sinkronkan sekarang untuk mencoba lagi.',true);}
 }
 $('cloud-connect').addEventListener('submit',async event=>{
   event.preventDefault();const candidate=$('github-token').value.trim();if(!candidate)return;
   token=candidate;$('github-token').value='';$('connect-github').disabled=true;
   try{
     const user=await request('https://api.github.com/user');
     if(user.login.toLowerCase()!==OWNER.toLowerCase())throw Error('Gunakan token akun '+OWNER+'.');
     $('cloud-connect').hidden=true;$('disconnect-github').hidden=false;
     persistDirty();await sync(true);
   }catch(error){token='';status(error.message,true);}
   finally{$('connect-github').disabled=false;}
 });
 $('disconnect-github').addEventListener('click',()=>{token='';clearTimeout(timer);$('cloud-connect').hidden=false;$('disconnect-github').hidden=true;status('GitHub diputus dari tab ini. Perubahan berikutnya disimpan di perangkat ini.');});
 $('sync-now').addEventListener('click',()=>sync(Boolean(token)));
 window.addEventListener('online',()=>sync(Boolean(token)));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync(Boolean(token));});
 setInterval(()=>{if(token&&document.visibilityState==='visible')sync(true);},60000);
 sync(false);
})();
