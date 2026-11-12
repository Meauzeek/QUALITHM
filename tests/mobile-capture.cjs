const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(path.dirname(process.execPath),'..','node_modules','playwright')));}
const root=path.resolve(__dirname,'..'),out=process.env.QUALITHM_SCREENSHOTS;
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://localhost').pathname)));if(!p.startsWith(root+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'};res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,...(process.env.QUALITHM_BROWSER_CHANNEL?{channel:process.env.QUALITHM_BROWSER_CHANNEL}:{})});
 try{
 for(const [width,height] of [[360,640],[390,844],[430,932],[844,390],[1366,768]]){
  const mobile=width<1000,context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,reducedMotion:'reduce',acceptDownloads:true});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{errors.push(d.message());await d.dismiss();});
  const exportScene=async name=>{
   const original=await page.evaluate(()=>({id:State.currSongId,diff:State.currDiff,cat:State.currCat,muted:Preview.muted,theme:document.body.dataset.theme}));
   const download=page.waitForEvent('download',{timeout:90000});await page.locator('#exportScreenshot').click();await page.locator('[data-capture="page"]').click();const file=await download;
   const location=await file.path(),bytes=fs.readFileSync(location);assert.equal(bytes.readUInt32BE(16),mobile?1440:width);assert.equal(bytes.readUInt32BE(20),mobile?900:height);assert(bytes.length>50000,'PNG contains actual rendered content');
   if(out)await file.saveAs(path.join(out,`${name}-${width}.png`));
   assert.deepEqual(await page.evaluate(()=>({id:State.currSongId,diff:State.currDiff,cat:State.currCat,muted:Preview.muted,theme:document.body.dataset.theme})),original);
   assert.equal(await page.locator('iframe[title="Screenshot layout"]').count(),0,'Capture frame cleaned up');
   await page.locator('#captureDialog .capture-close').click();
  };
  await page.route('**/*',r=>r.request().url().startsWith(url)||r.request().url().startsWith('data:')?r.continue():r.abort());
  await page.goto(url);await page.waitForFunction(()=>document.querySelector('#heroImage').naturalWidth>0);await page.evaluate(()=>document.fonts.ready);
  if(mobile){
   assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth+1),'Page fits device');
   const overlap=await page.evaluate(()=>{const a=document.querySelector('.home-actions').getBoundingClientRect(),b=document.querySelector('.menu-char-area').getBoundingClientRect();return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));});assert.equal(overlap,0,'Character has its own area');
   for(const selector of ['.btn-start-large','#openSettings','#exitGame'])assert(await page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Home action is unobstructed');
  }
  if(out)await page.screenshot({path:path.join(out,`home-${width}.png`)});
  if(width===390)await exportScene('export-home');
  await page.locator('.btn-start-large').click();
  if(width===390){await page.locator('#themeToggle').click();await exportScene('export-packs-dark');await page.locator('#themeToggle').click();}
  await page.locator('[data-pack-key="Original"]').click();await page.locator('#searchInput').fill('Selenophilia');
  if(mobile)await page.locator('#openSongLibrary').click();await page.locator('.song-row').first().click();
  await page.locator('#diffTabs [data-type="PHM"]').click();assert.equal(await page.locator('#stampLabel').innerText(),'PHASM');
  if(mobile)assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth+1),'Music keeps one viewport');
  const art=await page.locator('#detailCover').boundingBox();assert(Math.abs(art.width-art.height)<1,'Square art');
  if(width===844){const zone=await page.locator('.detail-zone').boundingBox();assert(art.y>=zone.y && art.y+art.height<=zone.y+zone.height,'Landscape shows full jacket');}
  await page.locator('#playButton').scrollIntoViewIfNeeded();assert(await page.locator('#playButton').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Play action reachable above footer');
  if(out)await page.screenshot({path:path.join(out,`music-${width}.png`)});
  if(width===390||width===1366)await exportScene('export');
  assert.deepEqual(errors,[]);console.log(`mobile-capture: ${width}x${height} PASS`);await context.close();
 }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
