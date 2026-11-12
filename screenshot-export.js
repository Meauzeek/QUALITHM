/* Capture a static layout. Rendering another chart never changes the live selection/audio. */
(() => {
 const button=document.getElementById('exportScreenshot');
 const compact='(max-width:760px), (orientation:portrait), (max-height:500px) and (max-width:1000px)';
 let libraryPromise, busy=false;
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const t=key=>globalThis.SelectionText?.t(key) || key;
 const library=()=>libraryPromise ||= new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='assets/vendor/modern-screenshot-4.7.0.js';
   script.onload=resolve;script.onerror=()=>{libraryPromise=null;script.remove();reject(new Error(t('captureFailed')));};document.head.append(script);
 });
 const pageSize=()=>matchMedia(compact).matches ? {width:1440,height:900,scale:1,mobile:true} : {width:innerWidth,height:innerHeight,scale:Math.min(2,devicePixelRatio || 1),mobile:false};
 async function ready(doc) {
   await Promise.race([doc.fonts.ready,delay(8000)]);
   await Promise.all([...doc.images].filter(img=>img.getClientRects().length).map(img=>Promise.race([img.decode().catch(()=>{}),delay(5000)])));
 }
 function staticDocument(width,height) {
   const root=document.documentElement.cloneNode(true);
   root.style.setProperty('--app-vw',width+'px');root.style.setProperty('--app-vh',height+'px');
   root.querySelectorAll('script,.br-ctrl,.dev-badge,.dev-only,.char-controls,.settings-backdrop,.session-exit,.modal-layer,#captureDialog,#quickPackMenu,#openSongLibrary').forEach(node=>node.remove());
   const list=root.querySelector('.list-zone');root.querySelector('#scene-music .workspace').prepend(list);
   root.querySelector('#songLibraryDrawer')?.remove();
   root.querySelectorAll('input').forEach(node=>{const original=document.getElementById(node.id);if(original)node.setAttribute('value',original.value);});
   const base=document.createElement('base');base.href=new URL('.',location.href).href;root.querySelector('head').prepend(base);
   const style=document.createElement('style');style.textContent=
    'html,body{width:'+width+'px!important;height:'+height+'px!important;min-height:0!important;overflow:hidden!important;zoom:1!important}' +
    '#app{width:100%!important;height:100%!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}' +
    'body{isolation:isolate}.bg-system{z-index:0!important}#app{position:relative;z-index:1;background:transparent}' +
    '.br-ctrl,.dev-badge,.dev-only,.char-controls{display:none!important}#scene-music .list-zone{display:flex!important}.marquee-content{transform:none!important}';
   root.querySelector('head').append(style);
   return root;
 }
 async function inFrame(root,width,height,callback) {
   const frame=document.createElement('iframe');frame.title='Screenshot layout';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
   frame.style.cssText='position:fixed;left:-20000px;top:0;width:'+width+'px;height:'+height+'px;border:0;pointer-events:none;';
   let timer;
   try {
     const loaded=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(new Error(t('captureFailed'))),15000);frame.onload=()=>{clearTimeout(timer);resolve();};});
     frame.srcdoc='<!DOCTYPE html>'+root.outerHTML;document.body.append(frame);await loaded;
     await ready(frame.contentDocument);
     return await callback(frame.contentDocument);
   } finally {clearTimeout(timer);frame.remove();globalThis.QualithmText?.measure();}
 }
 const png=(node,options={})=>modernScreenshot.domToPng(node,{timeout:5000,features:{restoreScrollPosition:true},style:{margin:'0'},...options});
 async function pageCapture() {
   const size=pageSize(),root=staticDocument(size.width,size.height);
   return inFrame(root,size.width,size.height,async doc=>{
     // Keep scroll offsets and the live desktop viewport, rather than re-centering the selection.
     for(const selector of ['#songList','#scene-category .scroll-container','.detail-content-layer','.detail-zone']) {
       const original=document.querySelector(selector),copy=doc.querySelector(selector);
       if(original && copy){copy.scrollTop=original.scrollTop;copy.scrollLeft=original.scrollLeft;}
     }
     if(size.mobile) {
       doc.querySelector('.song-row.active')?.scrollIntoView({block:'center'});
       if(document.querySelector('#scene-category.active'))doc.querySelectorAll('.cat-card')[PackScroller.activeIndex()]?.scrollIntoView({inline:'center',block:'nearest'});
       globalThis.QualithmText?.refresh(doc);globalThis.QualithmText?.measure();
     }
     // SVG foreignObject can resolve flex auto margins differently; lock their measured offsets.
     const layer=doc.querySelector('#scene-music .detail-content-layer');
     if(layer?.getClientRects().length) {
       const style=doc.defaultView.getComputedStyle(layer);
       layer.style.marginLeft=style.marginLeft;layer.style.marginRight=style.marginRight;
     }
     return png(doc.body,{width:size.width,height:size.height,scale:size.scale,backgroundColor:getComputedStyle(document.body).backgroundColor});
   });
 }
 async function cardsCapture(mode,requested) {
   const song=structuredClone(State.currentSong),precise=State.isPrecise;
   if(!song)throw new Error(t('captureNoSong'));
   const difficulties=mode==='card' ? [State.currDiff] : CHART_KEYS.filter(key=>requested?.includes(key) && song.difficulties[key]!==undefined);
   if(!difficulties.length || difficulties.some(key=>song.difficulties[key]===undefined))throw new Error(t('captureChoose'));
   const root=staticDocument(1440,900),body=root.querySelector('body'),background=root.querySelector('.bg-system'),template=root.querySelector('#songDossier');
   body.replaceChildren(background);
   const scene=document.createElement('section');scene.id='scene-music';scene.className='capture-card-scene';
   const wrap=document.createElement('div');wrap.className='capture-card-wrap';wrap.append(template);scene.append(wrap);body.append(scene);
   const style=document.createElement('style');style.textContent=
    '.capture-card-scene{position:relative;z-index:1;padding:0!important;width:max-content}' +
    '.capture-card-wrap{padding:24px;width:448px}' +
    '#scene-music .song-dossier{width:400px!important;display:block!important}' +
    '#scene-music .song-dossier #detailTitle{font-size:26px}' +
    '#scene-music .song-dossier .jacket-wrap{transform:none!important}' +
    '.capture-board{position:relative;z-index:1;display:grid;place-content:center;align-items:start;padding:40px;gap:24px}' +
    '.capture-board img{display:block;width:100%;height:auto;filter:drop-shadow(0 10px 14px #101b3826)}';
   root.querySelector('head').append(style);
   return inFrame(root,1440,900,async doc=>{
     const card=doc.querySelector('#songDossier'),wrapper=doc.querySelector('.capture-card-wrap'),images=[];
     for(const diff of difficulties) {
       Render.songCard(song,diff,card,precise);
       card.querySelectorAll('[data-selection-text]').forEach(node=>node.textContent=t(node.dataset.selectionText));
       globalThis.QualithmText?.refresh(doc);
       await ready(doc);globalThis.QualithmText?.measure();
       const box=wrapper.getBoundingClientRect();
       images.push({diff,data:await png(wrapper,{width:Math.ceil(box.width),height:Math.ceil(box.height),scale:2,backgroundColor:null}),width:box.width,height:box.height});
     }
     if(mode==='card')return images[0].data;
     // Composite PNG cards, so each instance keeps unique DOM IDs and the exact same renderer.
     const columns=images.length<=3?images.length:images.length===4?2:3,rows=Math.ceil(images.length/columns);
     const cardWidth=400,cardHeight=Math.max(...images.map(img=>img.height/img.width*cardWidth));
     const width=columns*cardWidth+(columns-1)*24+80,height=Math.ceil(rows*cardHeight+(rows-1)*24+80);
     const board=doc.createElement('div');board.className='capture-board';board.style.cssText='grid-template-columns:repeat('+columns+',400px);width:'+width+'px;height:'+height+'px';
     for(const item of images){const img=doc.createElement('img');img.src=item.data;img.alt=item.diff;board.append(img);}
     doc.querySelector('.capture-card-scene').replaceWith(board);
     // The composition has its own canvas; extend the existing glass background over it.
     doc.documentElement.style.setProperty('--app-vw',width+'px');doc.documentElement.style.setProperty('--app-vh',height+'px');
     for(const node of [doc.documentElement,doc.body]){node.style.setProperty('width',width+'px','important');node.style.setProperty('height',height+'px','important');}
     doc.querySelector('.bg-system').style.cssText+=';width:'+width+'px;height:'+height+'px;';
     await ready(doc);
     return png(doc.body,{width,height,scale:2,backgroundColor:getComputedStyle(document.body).backgroundColor});
   });
 }
 async function create({mode='page',difficulties}={}) {
   if(location.protocol==='file:')throw new Error('请通过本地预览网址 http://127.0.0.1:4173/ 或在线网页导出图片。');
   await library();
   return mode==='page'?pageCapture():cardsCapture(mode,difficulties);
 }
 const dialog=document.createElement('dialog');dialog.id='captureDialog';dialog.className='capture-dialog';
 dialog.setAttribute('aria-labelledby','captureTitle');
 dialog.innerHTML='<header><h2 id="captureTitle"></h2><button type="button" class="capture-close" aria-label="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header>'+
  '<div class="capture-actions"><button type="button" data-capture="page"><i class="fa-solid fa-display" aria-hidden="true"></i><span data-capture-text="capturePage"></span></button><button type="button" data-capture="card"><i class="fa-solid fa-image" aria-hidden="true"></i><span data-capture-text="captureCard"></span></button></div>'+
  '<fieldset class="capture-chart-options"><legend data-capture-text="captureBoard"></legend><p class="capture-song"></p><div class="capture-selection-actions"><span data-capture-text="captureChoose"></span><button type="button" data-select="all" data-capture-text="captureAll"></button><button type="button" data-select="none" data-capture-text="captureNone"></button></div><div class="capture-difficulties"></div><button type="button" class="capture-submit" data-capture="board" data-capture-text="captureExport"></button></fieldset>'+
  '<p class="capture-status" role="status" aria-live="polite"></p>';
 document.body.append(dialog);
 const status=dialog.querySelector('.capture-status'),choices=dialog.querySelector('.capture-difficulties');
 const selected=()=>[...choices.querySelectorAll('input:checked')].map(input=>input.value);
 const sync=()=>{dialog.querySelector('[data-capture="board"]').disabled=busy || !selected().length;};
 function open() {
   if(busy)return;
   document.getElementById('captureTitle').textContent=t('captureTitle');
   dialog.querySelector('.capture-close').setAttribute('aria-label',t('close'));
   dialog.querySelectorAll('[data-capture-text]').forEach(node=>node.textContent=t(node.dataset.captureText));
   const song=State.currentSong,hasSong=!!song && document.getElementById('scene-music').classList.contains('active');
   dialog.querySelector('[data-capture="card"]').disabled=!hasSong;
   dialog.querySelector('.capture-chart-options').hidden=!hasSong;
   dialog.querySelector('.capture-song').textContent=hasSong?song.title:'';
   choices.replaceChildren();
   if(hasSong) for(const key of CHART_KEYS.filter(key=>song.difficulties[key]!==undefined)) {
     const label=document.createElement('label');label.style.setProperty('--choice-color',CONFIG.colors[key]);
     const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=key;checkbox.checked=true;checkbox.setAttribute('aria-label',key);
     const name=document.createElement('span');name.textContent=key;
     const value=document.createElement('b');const raw=song.difficulties[key];value.innerHTML=key==='WMS'&&typeof raw==='string'?Utils.escapeHTML(raw):State.isPrecise?Utils.formatPrecise(raw):Utils.formatRough(raw);
     label.append(checkbox,name,value);choices.append(label);
   }
   status.textContent='';sync();dialog.showModal();
 }
 function close(){if(!busy){dialog.close();button.focus({preventScroll:true});}}
 dialog.querySelector('.capture-close').onclick=close;
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))close();});
 dialog.addEventListener('change',sync);
 dialog.querySelectorAll('[data-select]').forEach(control=>control.onclick=()=>{choices.querySelectorAll('input').forEach(input=>input.checked=control.dataset.select==='all');sync();});
 async function download(mode) {
   if(busy)return;busy=true;button.disabled=true;dialog.setAttribute('aria-busy','true');
   const controls=[...dialog.querySelectorAll('button,input')],disabled=controls.map(node=>node.disabled);controls.forEach(node=>node.disabled=true);
   status.textContent=t('captureWorking');
   try {
     const name=mode==='page'?document.querySelector('.scene.active').id.replace('scene-',''):State.currentSong.title;
     const safeName=name.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').slice(0,80);
     const data=await create({mode,difficulties:selected()}),link=document.createElement('a');
     link.download='QUALITHM-'+safeName+'-'+(mode==='card'?State.currDiff:mode)+'-'+Date.now()+'.png';link.href=data;link.click();status.textContent=t('captureDone');
   }catch(error){status.textContent=error.message || t('captureFailed');}
   finally{busy=false;button.disabled=false;dialog.removeAttribute('aria-busy');controls.forEach((node,i)=>node.disabled=disabled[i]);sync();}
 }
 dialog.querySelectorAll('[data-capture]').forEach(control=>control.onclick=()=>download(control.dataset.capture));
 button.onclick=open;
 globalThis.QualithmCapture={create,open,pageSize};
})();
