const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(path.dirname(process.execPath),'..','node_modules','playwright')));}
const root=path.resolve(__dirname,'..'),out=process.env.QUALITHM_SCREENSHOTS;
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://localhost').pathname)));if(!p.startsWith(root+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'};res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));});

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.QUALITHM_BROWSER_CHANNEL?{channel:process.env.QUALITHM_BROWSER_CHANNEL}:{})});
 try {
 for(const viewport of [{width:1920,height:1080,scale:1},{width:1536,height:864,scale:1.25},{width:390,height:844,scale:1}]) {
  const mobile=viewport.width===390,context=await browser.newContext({viewport,deviceScaleFactor:viewport.scale,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce',acceptDownloads:true});
  if(mobile)await context.addInitScript(()=>localStorage.setItem('QUALITHM_LANGUAGE','zh'));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)||r.request().url().startsWith('data:')?r.continue():r.abort());
  await page.goto(url);await page.locator('.btn-start-large').click();await page.locator('[data-pack-key="Original"]').click();
  await page.locator('#searchInput').fill('God is');await page.locator('#chartFilterOptions [data-diff="HYP"]').click();
  if(mobile)await page.locator('#openSongLibrary').click();await page.locator('.song-row').first().click();
  await page.waitForFunction(()=>document.querySelector('#detailCover').naturalWidth>0);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);
  const before=await page.locator('#detailCover').boundingBox(),live=await page.screenshot();
  assert.equal(await page.locator('#chartFilterOptions').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
  assert(await page.locator('#chartFilterOptions').evaluate(e=>getComputedStyle(e).filter.includes('drop-shadow')));
  if(out)fs.writeFileSync(path.join(out,'live-'+viewport.width+'.png'),live);
  await page.evaluate(()=>document.addEventListener('load',event=>{
   if(event.target.tagName==='SCRIPT' && event.target.src.includes('modern-screenshot')) {
    const original=modernScreenshot.domToPng;modernScreenshot.domToPng=(node,options)=>{const r=node.ownerDocument.querySelector('#detailCover')?.getBoundingClientRect();window.captureRect=r?.toJSON();return original(node,options);};
   }
  },true));
  const state=()=>page.evaluate(()=>({id:State.currSongId,diff:State.currDiff,cat:State.currCat,filter:State.filterDiff,precise:State.isPrecise,muted:Preview.muted,source:Preview.audio.src,paused:Preview.audio.paused}));
  const download=async mode=>{
   if(!(await page.locator('#captureDialog').evaluate(e=>e.open)))await page.locator('#exportScreenshot').click();
   if(out)await page.locator('#captureDialog').screenshot({path:path.join(out,'capture-dialog-'+viewport.width+'.png')});
   const original=await state(),pending=page.waitForEvent('download',{timeout:90000});await page.locator('[data-capture="'+mode+'"]').click();const file=await pending;
   assert.deepEqual(await state(),original,'Export does not alter selection or audio');assert.equal(await page.locator('iframe[title="Screenshot layout"]').count(),0);
   const bytes=fs.readFileSync(await file.path());if(out)await file.saveAs(path.join(out,'capture-'+mode+'-'+viewport.width+'.png'));return bytes;
  };
  const screen=await download('page');
  assert.equal(screen.readUInt32BE(16),mobile?1440:viewport.width*viewport.scale);assert.equal(screen.readUInt32BE(20),mobile?900:viewport.height*viewport.scale);
  if(!mobile) {
   const difference=await page.evaluate(async({a,b,rect,scale})=>{
    const pixels=async data=>{const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return ctx;};
    const first=await pixels(a),second=await pixels(b);let sum=0,n=0;
    for(let y=rect.y+16;y<rect.y+rect.height-16;y+=12)for(let x=rect.x+16;x<rect.x+rect.width-16;x+=12){const p=first.getImageData(Math.round(x*scale),Math.round(y*scale),1,1).data,q=second.getImageData(Math.round(x*scale),Math.round(y*scale),1,1).data;for(let c=0;c<3;c++){sum+=Math.abs(p[c]-q[c]);n++;}}
    return sum/n;
   },{a:live.toString('base64'),b:screen.toString('base64'),rect:before,scale:viewport.scale});
   console.log('capture-cards: jacket pixel difference',viewport.width,difference.toFixed(3));
   console.log('capture-cards: positions',JSON.stringify({live:before,copy:await page.evaluate(()=>captureRect)}));
   assert(difference<8,'Export jacket must occupy the same coordinates as the visible page');
  }
  await page.locator('.capture-close').click();
  if(viewport.width!==1536) {
   await page.evaluate(()=>{
    window.captureRecords=[];const original=modernScreenshot.domToPng;
    modernScreenshot.domToPng=(node,options)=>{if(node.classList.contains('capture-card-wrap')) {const card=node.querySelector('#songDossier'),label=card.querySelector('#stampLabel'),glyph=label.firstElementChild;captureRecords.push({difficulty:card.dataset.difficulty,title:card.querySelector('#detailTitle').textContent,artist:card.querySelector('#detailArtist').textContent,value:card.querySelector('#stampVal').textContent,cover:card.querySelector('#detailCover').getAttribute('src'),nameScale:Number(label.style.getPropertyValue('--name-scale')),nameSpacing:parseFloat(getComputedStyle(glyph).letterSpacing),fontSize:getComputedStyle(label).fontSize});}return original(node,options);};
    State.currentSong.difficulties.WMS_alias='Special chart title';State.currentSong.difficulties.WMS_cover='assets/jackets/selenophilia.png';State.currentSong.difficulties.WMS_artist='Special artist';
   });
   await page.locator('#preciseToggle').click();
   const card=await download('card');assert.equal(card.readUInt32BE(16),896);assert(card.readUInt32BE(20)>1000);
   assert.deepEqual((await page.evaluate(()=>captureRecords)).map(r=>r.difficulty),['HYP']);
   await page.evaluate(()=>{captureRecords=[];});
   assert.equal(await page.locator('.capture-difficulties input:checked').count(),6);
   await page.locator('[data-select="none"]').click();assert(await page.locator('[data-capture="board"]').isDisabled());
   if(mobile) {await page.locator('.capture-difficulties input[value="MET"]').check();await page.locator('.capture-difficulties input[value="HYP"]').check();}
   else await page.locator('[data-select="all"]').click();
   const board=await download('board');assert(board.readUInt32BE(16)>1500);assert(board.length>100000);
   const records=await page.evaluate(()=>captureRecords);assert.deepEqual(records.map(r=>r.difficulty),mobile?['MET','HYP']:['NUL','PHM','DEC','MET','HYP','WMS']);
   if(!mobile){const special=records.at(-1);assert.equal(special.title,'Special chart title');assert.equal(special.artist,'Special artist');assert.equal(special.cover,'assets/jackets/selenophilia.png');assert(special.nameScale>1 && special.nameSpacing>0,'WHIMSY distributes lettering into available space');assert(records.every(card=>card.fontSize==='52px'));}
   await page.locator('.capture-close').click();
   await page.locator('#themeToggle').click();await page.evaluate(()=>{captureRecords=[];});
   await download('card');await page.locator('.capture-close').click();
   // New HYP jacket migration: every other difficulty still resolves the base jacket.
   await page.evaluate(()=>{const song=State.songs.find(s=>s.id==='c1');State.currCat='CHUNITHM';State.currSongId=song.id;State.currDiff='HYP';Render.songDetail();});
   await page.waitForFunction(()=>document.querySelector('#detailCover').getAttribute('src')==='assets/jackets/tiamat-hyp.jpg' && document.querySelector('#detailCover').naturalWidth>0);
   assert(await page.evaluate(()=>{const song=State.currentSong,card=document.querySelector('#songDossier').cloneNode(true);Render.songCard(song,'MET',card);return card.querySelector('#detailCover').getAttribute('src')===song.coverUrl && song.difficulties.HYP_cover==='assets/jackets/tiamat-hyp.jpg';}));
   if(!mobile){const tiamat=await download('card');if(out)fs.writeFileSync(path.join(out,'tiamat-hyp.png'),tiamat);}
  }
  assert.deepEqual(errors,[]);console.log('capture-cards: '+viewport.width+' PASS');await context.close();
 }
 } finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
