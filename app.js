(() => {
 'use strict';
 const KEY='jagad-must-read-v1-progress',SCHEMA='jagad-reading-progress',VERSION=2;
 const $=id=>document.getElementById(id),articles=[...document.querySelectorAll('article')],groups=[];
 const stages=[{key:'skim',name:'Skimming'},{key:'deep',name:'Deep reading'}];
 const items=articles.map(article=>{
   let heading=article.previousElementSibling;
   while(heading&&heading.tagName!=='H2')heading=heading.previousElementSibling;
   let group=groups.find(g=>g.heading===heading);
   if(!group){group={heading,name:heading.textContent.replace(/ — .*/,''),items:[],bars:{}};groups.push(group);}
   const item={article,group,id:article.dataset.readingId||article.querySelector('h3 a').getAttribute('href'),title:article.querySelector('h3').textContent,controls:{}};
   group.items.push(item);return item;
 });
 const model=JagadProgress(items.map(i=>i.id));let progress={},storageOK=true;
 const payload=()=>({schema:SCHEMA,version:VERSION,exportedAt:new Date().toISOString(),entries:progress});
 function message(text,warn=false){$('storage-status').textContent=text;$('storage-status').classList.toggle('warning',warn);}
 function save(){
   try{localStorage.setItem(KEY,JSON.stringify(payload()));storageOK=true;message('Kedua tahap tersimpan otomatis di browser ini.');}
   catch{storageOK=false;message('Penyimpanan browser tidak tersedia. Gunakan Ekspor progres sebelum menutup halaman.',true);}

 }
 function saveChange(before){
   save();
   window.dispatchEvent(new CustomEvent('reading-change',{detail:model.diff(before,progress)}));
 }
 try{
   const saved=localStorage.getItem(KEY);
   if(saved){const data=JSON.parse(saved);progress=model.validate(data);if(data.version===1&&!localStorage.getItem(KEY+'-before-stages'))localStorage.setItem(KEY+'-before-stages',saved);}
   save();
 }catch{storageOK=false;message('Progres tersimpan tidak dapat dimuat. Data lama tidak ditimpa. Gunakan impor cadangan yang valid.',true);}
 function makeBar(label,total){
   const row=document.createElement('div');row.className='stage-bar';
   row.innerHTML='<div class="bar-label"><span></span><span class="bar-value"></span></div><div class="bar-track" role="progressbar" aria-valuemin="0"><div class="bar-fill"></div></div>';
   row.querySelector('.bar-label span').textContent=label;
   const bar=row.querySelector('[role=progressbar]');bar.setAttribute('aria-label',label);bar.setAttribute('aria-valuemax',total);
   return {row,bar,value:row.querySelector('.bar-value')};
 }
 groups.forEach(g=>{
   const section=document.createElement('div');section.className='group-chart';const name=document.createElement('p');name.className='group-chart-name';name.textContent=g.name;section.append(name);
   stages.forEach(stage=>{const bar=makeBar(stage.name,g.items.length);bar.row.classList.add(stage.key);bar.bar.setAttribute('aria-label',stage.name+' — '+g.name);g.bars[stage.key]=bar;section.append(bar.row);});
   $('group-bars').append(section);g.summary=document.createElement('span');g.summary.className='section-summary';g.heading.append(g.summary);
 });
 items.forEach((item,index)=>{
   const controls=item.article.querySelector('[data-reading-controls]');
   stages.forEach(stage=>{
     const cb=controls.querySelector('[data-stage="'+stage.key+'"]');
     cb.setAttribute('aria-label','Sudah '+stage.name.toLowerCase()+': '+item.title);
     const date=controls.querySelector('[data-stage-date="'+stage.key+'"]');item.controls[stage.key]={checkbox:cb,date};
     cb.addEventListener('change',()=>{const before={...progress};progress[item.id]={...(progress[item.id]||model.empty()),[stage.key]:{completed:cb.checked,updatedAt:new Date().toISOString()}};saveChange(before);render();});
   });
   item.legacy=item.article.querySelector('.legacy-badge');
 });
 const empty=document.createElement('p');empty.id='no-results';empty.textContent='Tidak ada bacaan yang cocok dengan pencarian atau filter.';empty.hidden=true;articles[0].before(empty);
 function setBar(bar,done,total){bar.setAttribute('aria-valuenow',done);bar.setAttribute('aria-valuetext',done+' dari '+total+' bacaan');bar.querySelector('.bar-fill').style.width=(done/total*100)+'%';}
 function render(){
   items.forEach(item=>{const value=progress[item.id]||model.empty();
     stages.forEach(stage=>{const record=value[stage.key],control=item.controls[stage.key];control.checkbox.checked=record.completed;control.date.textContent=record.completed?'Dicentang '+new Date(record.updatedAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):'Belum dicentang';});
     item.article.classList.toggle('is-skimmed',value.skim.completed);item.article.classList.toggle('is-deep',value.deep.completed);item.legacy.hidden=!model.pendingLegacy(value);
   });
   const counts=model.counts(progress);
   stages.forEach(stage=>{$(stage.key+'-count').textContent=counts[stage.key];$(stage.key+'-percent').textContent=Math.round(counts[stage.key]/items.length*100)+'%';setBar($(stage.key+'-bar'),counts[stage.key],items.length);});
   $('legacy-count').hidden=counts.legacy===0;$('legacy-count').textContent=counts.legacy+' centang lama belum diberi tahap; tetap tersimpan dan tidak dimasukkan ke grafik.';
   groups.forEach(g=>{const c=model.counts(progress,g.items.map(i=>i.id));stages.forEach(stage=>{const bar=g.bars[stage.key],n=c[stage.key];bar.value.textContent=n+' / '+g.items.length+' · '+Math.round(n/g.items.length*100)+'%';setBar(bar.bar,n,g.items.length);});g.summary.textContent='Skimming '+c.skim+'/'+g.items.length+' · Deep reading '+c.deep+'/'+g.items.length;});filter();
 }
 function filter(){
   const query=$('reading-search').value.trim().toLocaleLowerCase('id-ID'),mode=$('reading-filter').value;let count=0;
   items.forEach(item=>{const value=progress[item.id]||model.empty(),s=value.skim.completed,d=value.deep.completed;
     const matchStage=mode==='all'||(mode==='not-skimmed'&&!s)||(mode==='skim-only'&&s&&!d)||(mode==='not-deep'&&!d)||(mode==='deep'&&d)||(mode==='legacy'&&model.pendingLegacy(value));
     const matchText=!query||[item.article.querySelector('h3'),...item.article.querySelectorAll('p:not(.legacy-badge)')].some(el=>el.textContent.toLocaleLowerCase('id-ID').includes(query));
     item.article.hidden=!(matchStage&&matchText);if(!item.article.hidden)count++;
   });
   groups.forEach(g=>{g.heading.hidden=g.items.every(i=>i.article.hidden);});empty.hidden=count>0;$('reading-result').textContent='Menampilkan '+count+' dari '+items.length+' bacaan. Lihat grafik pada halaman Monitor Bacaan Pribadi.';
 }
 $('reading-search').addEventListener('input',filter);$('reading-filter').addEventListener('change',filter);
 $('export-progress').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='progres-bacaan-jagad-'+new Date().toLocaleDateString('sv-SE')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Cadangan dua tahap disiapkan. Simpan berkas JSON hasil unduhan.',!storageOK);});
 $('import-progress').addEventListener('click',()=>$('import-file').click());
 $('import-file').addEventListener('change',async event=>{
   const file=event.target.files[0];if(!file)return;
   try{if(file.size>1000000)throw Error('Ukuran cadangan terlalu besar.');const imported=model.validate(JSON.parse(await file.text())),c=model.counts(imported);
     if(!confirm('Pulihkan cadangan: skimming '+c.skim+', deep reading '+c.deep+', centang lama belum diberi tahap '+c.legacy+'? Progres saat ini akan diganti. Ekspor terlebih dahulu bila ingin menyimpannya.'))return;
     const before=progress;progress=imported;saveChange(before);render();
   }catch(error){message('Impor gagal: '+error.message+' Progres saat ini tetap dipertahankan.',true);}finally{event.target.value='';}
 });
 window.addEventListener('storage',event=>{if(event.key===KEY){try{progress=event.newValue?model.validate(JSON.parse(event.newValue)):{};render();message('Progres diperbarui dari tab lain.');}catch{message('Perubahan dari tab lain tidak valid; progres saat ini dipertahankan.',true);}}});
 window.jagadReading={get:()=>JSON.parse(JSON.stringify(payload())),validate:model.validate,validatePatches:model.validatePatches,merge:model.merge,diff:model.diff,apply:entries=>{progress=model.validate({schema:SCHEMA,version:VERSION,entries});save();render();}};
 function showPage(){
   const monitor=location.hash==='#monitor';
   $('checklist-page').hidden=monitor;$('monitor-page').hidden=!monitor;
   $('page-title').textContent=monitor?'Monitor Bacaan Pribadi':'Checklist Bacaan';
   document.title=(monitor?'Monitor Bacaan':'Checklist Bacaan')+' — Disertasi Jagad';
   document.querySelectorAll('.page-nav a').forEach(link=>{if(link.getAttribute('href')===(monitor?'#monitor':'#checklist'))link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
 }
 window.addEventListener('hashchange',()=>{showPage();window.scrollTo(0,0);});
 showPage();
 render();
})();
