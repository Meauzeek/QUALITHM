const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(path.dirname(process.execPath), '..', 'node_modules', 'playwright'))); }
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.ttf':'font/ttf', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  const bytes = fs.readFileSync(file);
  res.setHeader('Content-Length', bytes.length);
  res.end(bytes);
});
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, ...(process.env.QUALITHM_BROWSER_CHANNEL ? { channel: process.env.QUALITHM_BROWSER_CHANNEL } : {}) });
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const compactLandscape = viewport.width <= 1000 && viewport.height <= 500 && viewport.width > viewport.height;
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const glassReport = [];
      const checkRenderedGlass = async () => {
        if (viewport.width !== 1366) return;
        const rail = await page.locator('#diffTabs').boundingBox();
        const labels = await page.locator('#diffTabs .d-tab').evaluateAll(buttons => buttons.map(button => ({
          difficulty:button.dataset.type, selected:button.classList.contains('active'),
          ink:getComputedStyle(button).color,
          boxes:[...button.querySelectorAll('span')].map(span => { const r=span.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })
        })));
        const hideText = await page.addStyleTag({content:'#diffTabs .d-tab > span {visibility:hidden!important}'});
        const pixels = await page.locator('#diffTabs').screenshot({animations:'disabled'});
        await hideText.evaluate(e => e.remove());
        const samples = await page.evaluate(async ({png,labels,rail}) => {
          const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
          const canvas = document.createElement('canvas'); canvas.width=img.width; canvas.height=img.height;
          const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0);
          return labels.map(label => {
            let minimum=Infinity;
            for (const rect of label.boxes) {
              for (let x=Math.ceil(rect.x-rail.x+1);x<rect.x-rail.x+rect.width-1;x+=2) {
                for (let y=Math.ceil(rect.y-rail.y+2);y<rect.y-rail.y+rect.height-2;y+=2) {
                  const rgba=ctx.getImageData(x,y,1,1).data;
                  minimum=Math.min(minimum,chroma.contrast(label.ink,chroma.rgb(rgba[0],rgba[1],rgba[2])));
                }
              }
            }
            return {difficulty:label.difficulty,selected:label.selected,theme:document.body.dataset.theme,minimum};
          });
        }, {png:pixels.toString('base64'),labels,rail});
        glassReport.push(...samples);
        for (const sample of samples) assert(sample.minimum >= 4.5, `Rendered glass contrast: ${JSON.stringify(sample)}`);
      };
      const selectPack = async name => {
        await page.locator('#quickPackSelect').click();
        await page.getByRole('option', {name, exact:true}).click();
      };
      const chooseSetting = async (id,value) => {
        await page.locator(`#${id}Trigger`).click();
        await page.locator(`#${id}Menu [data-value="${value}"]`).click();
      };
      const openLibrary = async () => {
        if (await page.locator('#openSongLibrary').isVisible() && !(await page.locator('#songLibraryDrawer').evaluate(e=>e.open))) await page.locator('#openSongLibrary').click();
      };
      const closeLibrary = async () => {
        if (await page.locator('#songLibraryDrawer').evaluate(e=>e.open)) await page.keyboard.press('Escape');
      };
      const selectSong = async locator => { await openLibrary(); await locator.click(); assert(!(await page.locator('#songLibraryDrawer').evaluate(e=>e.open)), 'Selecting a chart dismisses the mobile drawer'); };
      const errors = [];
      const assetFailures = [];
      page.on('requestfailed', request => { if (request.url().startsWith(url)) assetFailures.push({ url:request.url(), error:request.failure()?.errorText }); });
      page.on('pageerror', e => errors.push(e.message));
      // External art must not be necessary for rendering or operating the UI.
      await page.route('**/*', route => route.request().url().startsWith(url) ? route.continue() : route.abort());
      await page.goto(url);
      await page.evaluate(() => document.fonts.load('500 18px "IBM Plex Sans JP"', '柚木つばめ(燕檸)'));
      await page.evaluate(() => document.fonts.load('900 52px "QUALITHM Chart"', 'META'));
      await page.waitForFunction(() => document.querySelector('#heroImage').naturalWidth > 0);
      assert.equal(await page.locator('#heroImage').getAttribute('src'),'assets/characters/juni.png','Bundled character loads directly without waiting for a remote failure');
      const homeAlignment = await page.locator('.btn-start-large').evaluate(button => {const a=button.getBoundingClientRect(),b=button.querySelector('.t-main').getBoundingClientRect(); return Math.abs(a.x+a.width/2-b.x-b.width/2);});
      assert(homeAlignment < 1,'Archive label is centered in its whole button');
      await page.locator('.btn-start-large').hover();
      assert.equal(await page.locator('.btn-start-large .icon-arrow').evaluate(e=>getComputedStyle(e).opacity),'1');
      assert(await page.locator('.btn-start-large .t-main').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=28));
      await page.locator('#openSettings').click();
      assert.equal(await page.locator('#settingLanguage option').count(),8);
      assert.equal(await page.locator('#settingLanguageTrigger').evaluate(e=>getComputedStyle(e).borderWidth),'0px');
      const panelHeight=await page.locator('.settings-panel').evaluate(e=>e.scrollHeight);
      await page.locator('#settingLanguageTrigger').click();
      assert.equal(await page.locator('#settingLanguageMenu').evaluate(e=>e.parentElement.id),'settingsDialog');
      const popup=await page.locator('#settingLanguageMenu').boundingBox();
      assert(popup.y>=0 && popup.y+popup.height<=viewport.height,'Settings popup stays inside viewport');
      assert.equal(await page.locator('.settings-panel').evaluate(e=>e.scrollHeight),panelHeight,'Popup adds no panel scrollbar');
      await page.keyboard.press('End');
      assert.equal(await page.evaluate(()=>document.activeElement.dataset.value),'iu');
      await page.keyboard.press('Escape');
      for (const locale of ['zh-Hant','fr','ja','ko','es','iu','en']) {
        await page.locator('#settingLanguageTrigger').click();
        await page.locator(`#settingLanguageMenu [data-value="${locale}"]`).click();
        assert.equal(await page.locator('html').getAttribute('lang'),locale);
        assert.equal(await page.locator('#settingLanguage').inputValue(),locale);
        assert((await page.locator('#settingsTitle').innerText()).length>0);
        await page.waitForFunction(()=>{const e=document.querySelector('.btn-start-large .t-main');return e.getBoundingClientRect().width<=e.parentElement.clientWidth-60;});
        if (locale==='iu') {
          await page.evaluate(()=>document.fonts.load('600 20px "QUALITHM Syllabics"','ᐃᓄᒃᑎᑐᑦ'));
          assert(await page.evaluate(()=>document.fonts.check('600 20px "QUALITHM Syllabics"','ᐃᓄᒃᑎᑐᑦ')));
          if(process.env.QUALITHM_SCREENSHOTS) await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS,`settings-iu-${viewport.width}.png`)});
        }
      }
      await page.locator('#settingThemeTrigger').click();
      await page.keyboard.press('End'); await page.keyboard.press('Enter');
      assert.equal(await page.locator('body').getAttribute('data-theme'),'dark');
      await page.locator('#settingThemeTrigger').click(); await page.keyboard.press('Escape');
      assert(await page.locator('#settingsDialog').isVisible(),'Escape closes menu before dialog');
      await chooseSetting('settingTheme','light');
      await chooseSetting('settingLanguage','zh');
      assert.equal(await page.locator('#settingsTitle').innerText(), '设置');
      await chooseSetting('settingTheme','dark');
      await page.locator('#settingMute').check();
      await page.locator('#settingMotion').check();
      if (process.env.QUALITHM_SCREENSHOTS) await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `settings-${viewport.width}.png`)});
      await page.reload();
      await page.waitForFunction(() => document.querySelector('#heroImage').naturalWidth > 0);
      await page.locator('#openSettings').click();
      assert.equal(await page.locator('#settingLanguage').inputValue(), 'zh');
      assert.equal(await page.locator('#settingTheme').inputValue(), 'dark');
      assert(await page.locator('#settingMute').isChecked());
      assert(await page.locator('#settingMotion').isChecked());
      await chooseSetting('settingLanguage','en');
      await chooseSetting('settingTheme','light');
      await page.locator('#settingMute').uncheck();
      await page.locator('#settingMotion').uncheck();
      await page.keyboard.press('Escape');
      assert(await page.locator('#openSettings').evaluate(e => e === document.activeElement));
      await page.locator('#exitGame').click();
      assert(await page.locator('#app').evaluate(e => e.inert));
      assert(await page.evaluate(() => Preview.audio.paused && !Preview.playing));
      await page.locator('#resumeSession').click();
      assert(await page.locator('#scene-menu').evaluate(e => e.classList.contains('active')));
      assert.equal(await page.locator('#app').evaluate(e => e.inert), false);
      const heroBefore = await page.locator('#heroImage').evaluate(e => ({src:e.getAttribute('src'), transform:e.style.transform}));
      const fontBefore = await page.locator('body').evaluate(e => getComputedStyle(e).fontFamily);
      await page.locator('#themeToggle').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
      assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).fontFamily), fontBefore);
      assert.deepEqual(await page.locator('#heroImage').evaluate(e => ({src:e.getAttribute('src'),transform:e.style.transform})),heroBefore);
      await page.locator('#themeToggle').click();
      if (process.env.QUALITHM_SCREENSHOTS) await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `menu-new-${viewport.width}.png`)});
      await page.locator('.btn-start-large').click();
      await page.waitForFunction(() => document.querySelectorAll('.cat-card').length === 14).catch(async e => { console.log({errors, cards: await page.locator('.cat-card').count(), body: (await page.locator('body').innerText()).slice(0,1500)}); throw e; });
      await page.locator('#scene-category.active').waitFor({ state: 'visible' });
      assert.equal(await page.locator('.functional-pack').count(),4);
      assert.equal(await page.locator('.functional-pack img').count(),0,'Functional archives never borrow song jackets');
      assert.equal(new Set(await page.locator('.functional-pack .cat-placeholder i').evaluateAll(nodes=>nodes.map(e=>e.className))).size,4);
      assert.equal(await page.locator('[data-pack-key="WHIMSY"] .cat-img').getAttribute('src'),'assets/packs/whimsy.png');
      assert.equal(await page.locator('#scene-category .cat-info h3 > span').first().evaluate(e=>getComputedStyle(e).backgroundClip),'text');
      assert.equal(await page.locator('#scene-category .nav-info h2').evaluate(e=>getComputedStyle(e).backgroundClip),'text');
      if(viewport.width>=1366) {
        const track=page.locator('#scene-category .scroll-container');
        await page.locator('#packScrollNext').click();
        assert.equal(await page.locator('#packScrollNext').evaluate(e=>getComputedStyle(e).borderTopWidth),'0px');
        assert.equal(await page.locator('#packScrollNext').evaluate(e=>getComputedStyle(e).outlineWidth),'0px');
        await page.waitForTimeout(250);
        const beforeDrag=await track.evaluate(e=>e.scrollLeft), box=await track.boundingBox();
        await page.mouse.move(box.x+box.width*.65,box.y+box.height*.4);
        await page.mouse.down();
        await page.mouse.move(box.x+box.width*.35,box.y+box.height*.4,{steps:12});
        await page.mouse.up();
        assert(await page.locator('#scene-category').evaluate(e=>e.classList.contains('active')),'Dragging does not enter a pack');
        await page.waitForFunction(left=>document.querySelector('#scene-category .scroll-container').scrollLeft>left+50,beforeDrag);
        assert(!(await track.evaluate(e=>e.classList.contains('is-dragging'))));
        await track.focus();
        await page.keyboard.press('ArrowRight');
        const keyboardIndex=await page.evaluate(()=>Number(document.activeElement.dataset.packIndex));
        await page.keyboard.press('PageDown');
        assert.equal(await page.evaluate(()=>Number(document.activeElement.dataset.packIndex)),Math.min(13,keyboardIndex+3));
        await page.keyboard.press('ArrowLeft');
        assert.equal(await page.evaluate(()=>Number(document.activeElement.dataset.packIndex)),Math.min(13,keyboardIndex+3)-1);
      }
      const archiveCount = await page.locator('#catCount').textContent();
      const originalPack = page.locator('.cat-card').filter({has:page.getByRole('heading', {name:'Original',exact:true})});
      await originalPack.scrollIntoViewIfNeeded();
      await originalPack.locator('img').evaluate(async img => {
        if (!img.complete || !img.naturalWidth) await new Promise((resolve,reject) => { img.addEventListener('load',resolve,{once:true}); setTimeout(() => img.naturalWidth ? resolve() : reject(new Error('Local pack fallback did not load')),5000); });
        await img.decode();
      });
      await page.mouse.move(0,0);
      const restingFilter = await originalPack.locator('img').evaluate(e => getComputedStyle(e).filter);
      assert(restingFilter.includes('grayscale(1)'), 'Pack art must be desaturated at rest');
      if (process.env.QUALITHM_SCREENSHOTS) await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `packs-new-${viewport.width}.png`)});
      await originalPack.hover();
      assert.equal(await originalPack.locator('img').evaluate(e => getComputedStyle(e).filter),'none','Hovered pack restores original colors');
      if (process.env.QUALITHM_SCREENSHOTS) await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `packs-hover-${viewport.width}.png`)});
      await page.locator('#themeToggle').click();
      if (process.env.QUALITHM_SCREENSHOTS) await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `packs-dark-${viewport.width}.png`)});
      await page.locator('#themeToggle').click();
      assert(archiveCount.includes('81 SONGS'), JSON.stringify({ archiveCount, errors }));
      await page.locator('.cat-card').filter({ has: page.getByRole('heading', { name: 'Phigros', exact: true }) }).click();
      assert.equal(await page.locator('.song-row').count(), 4);
      assert.equal(await page.locator('.song-row img').count(), 0, 'Song list remains text-only');
      assert(await page.locator('#songList').evaluate(e=>getComputedStyle(e,'::-webkit-scrollbar-thumb').backgroundImage.includes('gradient') && getComputedStyle(e,'::-webkit-scrollbar-button').display === 'none'), 'Scrollbar uses themed glass with no native arrow buttons');
      await page.locator('.search-bar').click({position:{x:15,y:20}});
      assert(await page.locator('#searchInput').evaluate(e => e === document.activeElement), 'Search icon area focuses input');
      const group = page.locator('.group-header').first();
      await openLibrary();
      await group.focus(); await page.keyboard.press('Enter');
      assert.equal(await group.getAttribute('aria-expanded'),'false');
      await page.keyboard.press('Enter');
      assert.equal(await group.getAttribute('aria-expanded'),'true');
      for (const header of [group]) {
        assert(await header.evaluate(e=>{const s=getComputedStyle(e);return s.borderTopWidth==='0px' && s.clipPath.startsWith('polygon') && s.boxShadow.includes('inset');}), 'Pack and subgroup headers share a recessed borderless facet');
      }
      assert(await page.locator('.zone-header').evaluate(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)' && getComputedStyle(e).boxShadow==='none'),'Top-level pack title has no container');
      assert(await page.locator('.cat-label').evaluate(e=>getComputedStyle(e).backgroundClip==='text' && getComputedStyle(e).textShadow==='none'),'Pack title uses metallic lettering, not a drop shadow');
      const groupInk = await group.evaluate(e=>getComputedStyle(e).color);
      await group.hover();
      assert.equal(await group.evaluate(e=>getComputedStyle(e).color),groupInk,'Subgroup hover must not become purple');
      if (await page.locator('#songLibraryDrawer').evaluate(e=>e.open)) {
        assert.equal(await page.locator('#openSongLibrary').getAttribute('aria-expanded'),'true');
        const drawerBox=await page.locator('#songLibraryDrawer').boundingBox();
        assert.equal(drawerBox.x,0); assert(drawerBox.width<viewport.width);
        if (process.env.QUALITHM_SCREENSHOTS) await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS,`drawer-${viewport.width}.png`)});
        await closeLibrary();
        assert(await page.locator('#openSongLibrary').evaluate(e=>e===document.activeElement));
        await page.locator('#themeToggle').click(); await openLibrary();
        if (process.env.QUALITHM_SCREENSHOTS) await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS,`drawer-dark-${viewport.width}.png`)});
        await page.mouse.click(viewport.width-5,viewport.height/2);
        assert(!(await page.locator('#songLibraryDrawer').evaluate(e=>e.open)),'Backdrop click closes drawer');
        await page.locator('#themeToggle').click();
        if (viewport.width===390) {
          await openLibrary(); await page.setViewportSize({width:1280,height:800});
          assert(!(await page.locator('#songLibraryDrawer').evaluate(e=>e.open)));
          assert(await page.locator('.workspace > .list-zone').isVisible(),'Resizing restores the same desktop list');
          await page.setViewportSize(viewport);
        }
      }
      const difficultyType = await page.locator('.d-tab').first().evaluate(e => ({
        label: parseFloat(getComputedStyle(e.querySelector('.d-tab-name')).fontSize),
        number: parseFloat(getComputedStyle(e.querySelector('.d-tab-val')).fontSize),
        height: e.clientHeight,
        content: e.scrollHeight
      }));
      assert(difficultyType.number >= (compactLandscape ? 18 : 28) && difficultyType.label >= (compactLandscape ? 12 : 15), 'Difficulty labels must remain legible at native scale');
      assert(difficultyType.content <= difficultyType.height + 1, 'Enlarged difficulty text must not overflow its button');
      await page.locator('#chartFilterOptions [data-diff="HYP"]').click();
      assert.equal(await page.locator('.song-row[data-difficulty="MET"]').count(), 4);
      await selectSong(page.locator('.song-row').last());
      assert.equal(await page.locator('#detailTitle').innerText(), 'DESTRUCTION 3,2,1');
      assert.equal(await page.locator('.d-tab.active').getAttribute('data-type'), 'MET');
      const jacket = await page.locator('.jacket-box').boundingBox();
      assert(Math.abs(jacket.width - jacket.height) < 2, 'Jacket must remain square');
      const seal = await page.locator('#ratingStamp').boundingBox();
      const overlapWidth = Math.max(0, Math.min(jacket.x + jacket.width, seal.x + seal.width) - Math.max(jacket.x, seal.x));
      const overlapHeight = Math.max(0, Math.min(jacket.y + jacket.height, seal.y + seal.height) - Math.max(jacket.y, seal.y));
      assert(overlapWidth * overlapHeight / (jacket.width * jacket.height) < .09, 'Difficulty seal must cover less than 9% of the jacket');
      assert.equal(await page.locator('.song-dossier #detailTitle, .song-dossier #detailArtist, .song-dossier #detailBpm').count(), 3, 'Jacket metadata belongs in the same frame');
      assert.equal(await page.locator('.geometry-cluster').first().evaluate(e => getComputedStyle(e).animationName), 'none', 'Reduced motion keeps the geometry static');
      await page.locator('#devToggle').click();
      await page.locator('#btnEditSong').click();
      assert(await page.locator('#editModal').evaluate(e => e.classList.contains('open')));
      await page.locator('#valMET').fill('18.5');
      await page.locator('#editForm').evaluate(form => form.requestSubmit());
      await selectPack('Level');
      await page.locator('#searchInput').fill('DESTRUCTION');
      const high = page.locator('.song-row[data-difficulty="MET"]');
      assert((await high.innerText()).includes('18+'));
      await selectSong(high);
      await page.locator('#preciseToggle').click();
      assert.equal(await page.locator('#stampVal').innerText(), '18.5');
      await page.locator('#searchInput').fill('');
      await selectPack('Rotaeno');
      await page.locator('#chartFilterOptions [data-diff="HYP"]').click();
      await selectSong(page.locator('.song-row[data-song-id="collab-rot-suimori"]'));
      assert(await page.locator('.song-row.active.hyp-active').evaluate(e=>getComputedStyle(e,'::before').opacity==='1' && getComputedStyle(e,'::before').backgroundImage.includes('61.3%')),'HYP selection keeps its purple layer and four reflection bands');
      assert.equal(await page.locator('.d-tab.active').getAttribute('data-type'), 'HYP');
      assert(await page.locator('#stampVal').evaluate(e => e.closest('.rating-recess').classList.contains('hyp-style')));
      assert.equal(await page.locator('.rate-stamp').count(), 0, 'The old level plaque is removed');
      assert(await page.locator('#stampLabel').evaluate(e => getComputedStyle(e).fontFamily.includes('QUALITHM Chart')));
      assert.notEqual(await page.locator('#stampLabel').evaluate(e => getComputedStyle(e).color), 'rgb(255, 255, 255)', 'Day difficulty name is engraved dark type');
      assert.equal(await page.locator('.page-curl').count(), 0, 'No lifted page curl remains');
      assert.equal(await page.locator('.jacket-sheet').evaluate(e => getComputedStyle(e).clipPath),'none','The torn sheet has been removed');
      assert((await page.locator('#ratingStamp').evaluate(e => getComputedStyle(e).clipPath)).startsWith('polygon'), 'Rating uses a trapezoid');
      assert(await page.locator('#ratingStamp').evaluate(e => getComputedStyle(e).fontFamily.includes('Rajdhani')));
      assert(await page.locator('.rating-fraction').evaluate(e => parseFloat(getComputedStyle(e).fontSize) < parseFloat(getComputedStyle(e.parentElement).fontSize)), 'Precise decimal suffix is smaller');
      const detailedWidth = (await page.locator('#ratingStamp').boundingBox()).width;
      await page.locator('#preciseToggle').click();
      assert((await page.locator('#ratingStamp').boundingBox()).width < detailedWidth, 'Rough levels use a compact recess');
      const plusGeometry = await page.evaluate(() => {
        const original = State.currentSong.difficulties[State.currDiff];
        const sample = value => {
          State.currentSong.difficulties[State.currDiff] = value; Render.songDetail();
          const stamp=document.querySelector('#stampVal'), recess=document.querySelector('#ratingStamp');
          const range=document.createRange(); range.selectNodeContents(stamp.firstChild);
          const r=range.getBoundingClientRect(),p=stamp.querySelector('.plus-symbol')?.getBoundingClientRect();
          return {x:r.x,width:r.width,recess:recess.getBoundingClientRect().width,plusLeft:p?.left,plusRight:p?.right,right:recess.getBoundingClientRect().right,stroke:stamp.querySelector('.plus-symbol')?parseFloat(getComputedStyle(stamp.querySelector('.plus-symbol')).webkitTextStrokeWidth):0};
        };
        const plain=sample(16),plus=sample(16.5),single=sample(7.5),singlePlain=sample(4);
        State.currentSong.difficulties[State.currDiff]=original; Render.songDetail();
        return {plain,plus,single,singlePlain};
      });
      assert(Math.abs(plusGeometry.plain.x-plusGeometry.plus.x)<.1,'Plus never shifts the integer');
      assert.equal(plusGeometry.plain.recess,plusGeometry.plus.recess);
      assert.equal(plusGeometry.plain.recess,plusGeometry.single.recess,'One digit plus reserves the same two digit recess');
      assert.equal(plusGeometry.plain.recess,plusGeometry.singlePlain.recess,'One digit reserves the same two digit recess');
      assert(Math.abs((plusGeometry.singlePlain.x+plusGeometry.singlePlain.width/2)-(plusGeometry.plain.x+plusGeometry.plain.width/2))<.1,'Single and double digit numerals share the same center');
      assert(plusGeometry.plus.plusRight <= plusGeometry.plus.right-1,'Plus retains a right inset');
      assert(plusGeometry.single.plusLeft>=plusGeometry.single.x+plusGeometry.single.width,'Single digit plus stays after its integer without overlap');
      assert(plusGeometry.plus.stroke>=3,'Two digit plus knocks out the underlying numeral');
      await page.locator('#preciseToggle').click();
      assert.equal(await page.locator('.preview-control').count(), 0, 'Preview row has been removed');
      assert.equal(await page.locator('.d-tab[data-type="MET"]').evaluate(e => e.style.getPropertyValue('--col-ref')), '#465fe2');
      if (process.env.QUALITHM_SCREENSHOTS) {
        await page.locator('#detailTitle').scrollIntoViewIfNeeded();
        await page.screenshot({ animations: 'disabled', path: path.join(process.env.QUALITHM_SCREENSHOTS, `hyp-${viewport.width}.png`) });
      }
      await page.locator('#themeToggle').click();
      assert(await page.locator('.chart-name-glyph').evaluate(e => getComputedStyle(e).backgroundImage.includes('gradient') && Number(getComputedStyle(e).opacity)<1), 'Night name retains translucent theme-tinted material');
      assert.equal(await page.locator('.d-tab[data-type="MET"]').evaluate(e => e.style.getPropertyValue('--col-ref')), '#516ef2');
      if (process.env.QUALITHM_SCREENSHOTS) {
        await page.screenshot({ animations: 'disabled', path: path.join(process.env.QUALITHM_SCREENSHOTS, `hyp-dark-${viewport.width}.png`) });
      }
      await page.locator('#themeToggle').click();
      if (process.env.QUALITHM_SCREENSHOTS) {
        await page.locator('#chartFilterOptions [data-diff="MET"]').click();
        await selectSong(page.locator('.song-row[data-song-id="collab-rot-suimori"]'));
        await page.screenshot({ animations: 'disabled', path: path.join(process.env.QUALITHM_SCREENSHOTS, `met-${viewport.width}.png`) });
        await page.locator('#themeToggle').click();
        await page.screenshot({ animations: 'disabled', path: path.join(process.env.QUALITHM_SCREENSHOTS, `met-dark-${viewport.width}.png`) });
        await page.locator('#themeToggle').click();
      }
      await selectPack('Cytus II');
      await page.locator('#chartFilterOptions [data-diff="MET"]').click();
      const titles = await page.locator('.song-row .s-title').allTextContents();
      assert.equal(titles.length, 16);
      assert(titles.some(t => t.includes('͟͝͞Ⅱ́̕')));
      assert.equal(await page.locator('.hidden-mark').count(), 1);
      await page.locator('#searchInput').fill('機械');
      assert.equal(await page.locator('.song-row').count(), 1);
      await page.locator('#searchInput').fill('');
      await selectPack('WHIMSY');
      const full = page.locator('.song-row[data-song-id="collab-cy2-ii"]');
      await selectSong(full);
      assert((await page.locator('#detailTitle').innerText()).includes('Full Version'));
      assert((await page.locator('#detailAnnotations').innerText()).includes('FULL VERSION'));
      assert.equal(await page.locator('#stampVal').innerText(), '全');
      assert.equal(await page.locator('#songDossier').getAttribute('data-rating-kind'),'text');
      assert.equal(await page.locator('#ratingStamp').evaluate(e=>getComputedStyle(e).fontSize),'32px','WMS ideographs use their own smaller type size');
      const ideographFits = await page.locator('#stampVal').evaluate(e=>{const r=e.getBoundingClientRect(),s=e.parentElement.getBoundingClientRect(); return r.right<s.right-5 && r.left>s.left+20 && r.height<s.height;});
      assert(ideographFits,'WMS ideographs retain space around the glyph');
      assert.equal(await page.locator('#audioToggle').getAttribute('title'), 'Open official preview');
      const wmsId=await page.evaluate(()=>State.songs.find(s=>s.difficulties.WMS==='1.2x')?.id);
      assert(wmsId,'Catalog includes the reported 1.2x chart');
      await selectSong(page.locator(`.song-row[data-song-id="${wmsId}"]`));
      await page.waitForFunction(()=>parseFloat(document.querySelector('#songDossier').style.getPropertyValue('--rating-width'))<110);
      assert.equal(await page.locator('#stampVal').innerText(),'1.2x');
      assert(!/\b\d+:\d{2}\b/.test(await page.locator('#detailAnnotations').innerText()),'Duration is not shown');
      if(process.env.QUALITHM_SCREENSHOTS) await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS,`wms-compact-${viewport.width}.png`)});
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, 'Page must fit width');
      assert.deepEqual(errors, []);
      console.log(`browser-smoke: ${viewport.width}x${viewport.height} PASS`);
      if (process.env.QUALITHM_SCREENSHOTS) await page.screenshot({ path: path.join(process.env.QUALITHM_SCREENSHOTS, `qualithm-${viewport.width}.png`) });
      // Edit only the isolated test profile; the real catalog has no Greek title yet.
      await selectPack('Original');
      await page.locator('#chartFilterOptions [data-diff="MET"]').click();
      for (const title of ['God is [In] a girl', '髓星', '大音', 'Selenophilia', '2enith 4bove Chroma']) {
        await page.locator('#searchInput').fill(title);
        await selectSong(page.locator('.song-row').first());
        await page.locator('#detailCover').evaluate(img => img.decode()).catch(async error => { console.log({title, cover:await page.locator('#detailCover').getAttribute('src'), errors, assetFailures}); throw error; });
        assert((await page.locator('#detailCover').getAttribute('src')).startsWith('assets/jackets/'));
        if(title==='髓星') {
          assert((await page.locator('#detailTitle').innerText()).includes('髄星'),'Legacy spelling remains searchable');
          assert.equal(await page.locator('#detailAnnotations').innerText(),'','Search-only spelling is not a detail annotation');
        }
        if (title === '大音') {
          const coverBounds = await page.locator('#detailCover').boundingBox();
          const plaqueBounds = await page.locator('#ratingStamp').boundingBox();
          // The visible 音 glyph occupies this normalized region of the supplied square jacket.
          const glyph = {x:coverBounds.x + coverBounds.width * .63, y:coverBounds.y + coverBounds.height * .72, width:coverBounds.width * .19, height:coverBounds.height * .22};
          const w = Math.max(0, Math.min(glyph.x + glyph.width, plaqueBounds.x + plaqueBounds.width) - Math.max(glyph.x, plaqueBounds.x));
          const h = Math.max(0, Math.min(glyph.y + glyph.height, plaqueBounds.y + plaqueBounds.height) - Math.max(glyph.y, plaqueBounds.y));
          assert(w * h / (glyph.width * glyph.height) < .5, '大音: level plaque covers less than half the 音 glyph region');
          const tabsBox = await page.locator('#diffTabs').boundingBox();
          assert(tabsBox.x >= coverBounds.x + coverBounds.width, 'Difficulty buttons are to the right of the cover');
          assert.equal(await page.locator('#diffTabs').evaluate(e => getComputedStyle(e).flexDirection), 'column');
          if (process.env.QUALITHM_SCREENSHOTS) {
            await page.locator('#songDossier').scrollIntoViewIfNeeded();
            await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `dayin-${viewport.width}.png`)});
            await page.locator('#themeToggle').click();
            await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `dayin-dark-${viewport.width}.png`)});
            await page.locator('#themeToggle').click();
          }
        }
      }
      if (process.env.QUALITHM_SCREENSHOTS) {
        await page.locator('#searchInput').fill('');
        assert.equal(await page.locator('#detailArtist .cjk-punctuation').count(), 2);
        assert.equal(await page.locator('#songDossier').getAttribute('data-difficulty'), 'MET');
        await page.locator('#quickPackSelect').click();
        assert.equal(await page.locator('#quickPackSelect').getAttribute('aria-expanded'), 'true');
        const menuBounds = await page.locator('#quickPackMenu').boundingBox();
        assert(menuBounds.x >= 0 && menuBounds.x + menuBounds.width <= viewport.width + 1, 'Themed pack menu fits screen');
        if (process.env.QUALITHM_SCREENSHOTS) await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `pack-menu-${viewport.width}.png`)});
        await page.keyboard.press('Escape');
        assert(await page.locator('#quickPackSelect').evaluate(e => e === document.activeElement));
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Home');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#quickPackName').innerText(), 'Original');
        assert.equal(await page.locator('#quickPackSelect').getAttribute('aria-expanded'), 'false');
        if (viewport.width >= 1366) {
          await page.locator('.detail-content-layer').evaluate(e => e.scrollTop = 0);
          const frame = await page.locator('#songDossier').boundingBox();
          const layer = await page.locator('.detail-content-layer').boundingBox();
          const play = await page.locator('#playButton').boundingBox();
          assert(frame.y >= layer.y, 'The top of the colored frame must remain visible');
          assert(play.y + play.height <= layer.y + layer.height + 1, 'Desktop play action must fit without scrolling');
        }
        await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `materials-${viewport.width}.png`)});
        await page.locator('#themeToggle').click();
        await page.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `materials-dark-${viewport.width}.png`)});
        await page.locator('#themeToggle').click();
        await page.locator('#searchInput').fill('2enith 4bove Chroma');
        await selectSong(page.locator('.song-row').first());
      }
      // Card styling follows the selected chart, including theme changes.
      const cardEdges = new Set();
      for (const diff of ['NUL','PHM','DEC','MET','HYP']) {
        await page.locator(`#diffTabs [data-type="${diff}"]`).click();
        assert.equal(await page.locator('#songDossier').getAttribute('data-difficulty'), diff);
        const activeTab = page.locator('#diffTabs .d-tab.active');
        assert.equal(await activeTab.getAttribute('aria-pressed'), 'true');
        assert.equal(await activeTab.evaluate(e => getComputedStyle(e).borderTopWidth), '0px');
        assert.equal(await activeTab.evaluate(e => getComputedStyle(e).color), 'rgb(255, 255, 255)', 'Day selection uses white type');
        const edge = await page.locator('.jacket-stage').evaluate(e => {
          const s = getComputedStyle(e);
          return { color:getComputedStyle(e.querySelector('.jacket-sheet')).backgroundColor, widths:[s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth] };
        });
        assert(edge.widths.every(width => width === '0px'), 'Colored jacket border is removed');
        cardEdges.add(edge.color);
        await checkRenderedGlass();
        if (process.env.QUALITHM_SCREENSHOTS && viewport.width === 1366) {
          await page.locator('#songDossier').screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `card-${diff}.png`)});
        }
        await page.locator('#themeToggle').click();
        assert.equal(await page.locator('#songDossier').getAttribute('data-difficulty'), diff);
        assert(await activeTab.evaluate(e => getComputedStyle(e).backgroundImage.includes('radial-gradient')), 'Night glass veils a theme-color glow');
        assert.equal(await activeTab.evaluate(e => chroma(getComputedStyle(e).color).hex()), await activeTab.evaluate(e => chroma(e.style.getPropertyValue('--tab-active-ink')).hex()), 'Night selection uses contrast-adjusted theme ink');
        assert.equal(await page.locator('#stampLabel').evaluate(e => getComputedStyle(e).fontSize),compactLandscape ? '36px' : '52px','All difficulty names retain identical type height');
        assert(await page.locator('.chart-name-glyph').evaluate(e => new DOMMatrixReadOnly(getComputedStyle(e).transform).a >= .9), 'Long difficulty names retain at least 90% of natural glyph width');
        await checkRenderedGlass();
        if (process.env.QUALITHM_SCREENSHOTS && viewport.width === 1366) {
          await page.locator('#songDossier').screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS, `card-dark-${diff}.png`)});
        }
        await page.locator('#themeToggle').click();
      }
      assert.equal(cardEdges.size, 5, 'Every main difficulty has its own card color');
      if (glassReport.length) {
        console.log(`browser-smoke: rendered glass minimum ${Math.min(...glassReport.map(s=>s.minimum)).toFixed(2)}:1`);
        if (process.env.QUALITHM_SCREENSHOTS) fs.writeFileSync(path.join(process.env.QUALITHM_SCREENSHOTS,'glass-contrast.json'),JSON.stringify(glassReport,null,2));
      }
      await page.locator('#diffTabs [data-type="MET"]').click();
      await page.locator('#btnEditSong').click();
      const chooserPromise = page.waitForEvent('filechooser');
      await page.locator('#editCover + .local-art-button').click();
      const chooser = await chooserPromise;
      await chooser.setFiles(path.join(root, 'assets/jackets/selenophilia.png'));
      await page.waitForFunction(() => document.querySelector('#editCover').value.startsWith('data:image/jpeg;base64,'));
      await page.locator('#editForm').evaluate(form => form.requestSubmit());
      assert((await page.evaluate(() => JSON.parse(localStorage.getItem('QUALITHM_DB_V9')).songs.find(s => s.title === '2enith 4bove Chroma').coverUrl)).startsWith('data:image/jpeg;base64,'));
      await page.locator('#searchInput').fill('');
      await selectPack('Phigros');
      await page.locator('#chartFilterOptions [data-diff="MET"]').click();
      await selectSong(page.locator('.song-row').first());
      const greekWidths = [];
      await page.locator('#btnEditSong').click();
      await page.locator('#editTitle').fill('《髓星》 -Doppelkonzert für Violine und Violoncello Nr. 7, Markstern- — '.repeat(2));
      await page.locator('#editArtist').fill('削除 vs. virkato / xi feat. 燕檸 (vocal: 柚木つばめ) — Long artist credit for scrolling verification — '.repeat(2));
      await page.locator('#editHidden').check();
      await page.locator('#editForm').evaluate(form => form.requestSubmit());
      await page.waitForFunction(() => document.querySelector('#detailTitle').classList.contains('is-overflowing'));
      await openLibrary();
      await page.waitForFunction(()=>document.querySelector('.song-row.active .s-title').classList.contains('is-overflowing'));
      for (const selector of ['#detailTitle','#detailArtist','.song-row.active .s-title','.song-row.active .s-artist']) {
        const line=page.locator(selector);
        assert(await line.evaluate(e => e.classList.contains('is-overflowing')),`${selector}: long text should scroll`);
        assert(await line.evaluate(e => e.clientHeight <= Math.ceil(parseFloat(getComputedStyle(e).lineHeight))),`${selector}: stays on one line`);
      }
      assert.equal(await page.locator('#hiddenMedallion').count(),0);
      assert.equal(await page.locator('#songDossier').getAttribute('data-hidden'),'true');
      assert(await page.locator('.jacket-sheet').evaluate(e => getComputedStyle(e).backgroundImage.includes('radial-gradient')));
      assert(await page.locator('.song-row.active .hidden-mark').isVisible());
      await closeLibrary();
      assert(!(await page.locator('#detailAnnotations').innerText()).includes('HIDDEN'));
      if (process.env.QUALITHM_SCREENSHOTS) {
        await page.locator('#songDossier').screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS,`single-line-hidden-${viewport.width}.png`)});
      }
      await page.emulateMedia({reducedMotion:'no-preference'});
      const motion=await page.locator('#detailTitle .marquee-content').evaluate(e => {
        const animation=e.getAnimations()[0];
        if (!animation) return false;
        animation.pause(); animation.currentTime=Number(animation.effect.getTiming().duration)*.5;
        return new DOMMatrixReadOnly(getComputedStyle(e).transform).m41 < -1;
      });
      assert(motion,'Overflow text actually moves to reveal its ending');
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.equal(await page.locator('#detailTitle .marquee-content').evaluate(e => getComputedStyle(e).animationName),'none');
      for (const title of ['Άνθρωπος', 'Α\u0301νθρωπος', 'ἄνθρωπος', 'Comptinésie']) {
        await page.locator('#btnEditSong').click();
        await page.locator('#editTitle').fill(title);
        await page.locator('#editForm').evaluate(form => form.requestSubmit());
        assert.equal(await page.locator('#detailTitle').textContent(), title);
        const greek = page.locator('#detailTitle .greek-text');
        if (title === 'Comptinésie') {
          assert.equal(await greek.count(), 0, 'Latin diacritics retain their original font');
          continue;
        }
        assert.equal(await greek.count(), 1);
        assert.equal(await greek.textContent(), title);
        await page.evaluate(() => document.fonts.load('700 32px "Qualithm Greek"', 'Άνθρωπος'));
        assert(await page.evaluate(() => document.fonts.check('700 32px "Qualithm Greek"', 'Άνθρωπος')));
        const shape = await greek.evaluate(e => ({ font: getComputedStyle(e).fontFamily, width: e.getBoundingClientRect().width }));
        assert(shape.font.includes('Qualithm Greek'));
        greekWidths.push(shape.width);
        assert.equal(await page.locator('.song-row.active .greek-text').textContent(), title);
        if (title === 'Άνθρωπος' && process.env.QUALITHM_SCREENSHOTS) {
          await page.locator('#detailTitle').scrollIntoViewIfNeeded();
          await page.screenshot({ animations: 'disabled', path: path.join(process.env.QUALITHM_SCREENSHOTS, `greek-${viewport.width}.png`) });
        }
      }
      assert(Math.abs(greekWidths[0] - greekWidths[1]) < 1, 'NFC and NFD Greek accents must shape equivalently');
      assert.deepEqual(errors, []);
      console.log(`browser-smoke: Greek NFC/NFD/polytonic ${viewport.width}x${viewport.height} PASS`);
      // Presentation locale must never change underlying category or song identities.
      await page.evaluate(()=>SceneManager.switch('menu'));
      await page.locator('#openSettings').click();
      await chooseSetting('settingLanguage','ja');
      await page.locator('#settingsDone').click();
      await page.locator('.btn-start-large').click();
      const chunithm=page.locator('.cat-card[data-pack-key="CHUNITHM"]');
      await chunithm.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
      assert.equal(await chunithm.locator('.pack-title-original').innerText(),'CHUNITHM');
      assert.equal(await chunithm.locator('.pack-title-original').evaluate(e=>getComputedStyle(e).opacity),'1');
      await chunithm.hover();
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-pack-key="CHUNITHM"] .pack-title-local')).opacity==='1');
      assert.equal(await chunithm.locator('.pack-title-local').innerText(),'チュウニズム');
      assert(await page.locator('.cat-info h3').evaluateAll(nodes=>nodes.every(e=>e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).fontSize)*1.31)),'Hidden localized titles never reserve a second row');
      const maimaiTitle=page.locator('[data-pack-key="maimai DX"] h3');
      const titleHeight=await maimaiTitle.evaluate(e=>e.getBoundingClientRect().height);
      await maimaiTitle.locator('.pack-title-local').evaluate(e=>{e.textContent='maimai でらっくす とても長い曲集名称';QualithmText.refresh();});
      await page.waitForFunction(()=>document.querySelector('[data-pack-key="maimai DX"] .pack-title-local').classList.contains('pack-title-overflow'));
      assert.equal(await maimaiTitle.evaluate(e=>e.getBoundingClientRect().height),titleHeight);
      await page.emulateMedia({reducedMotion:'no-preference'});
      assert.equal(await maimaiTitle.locator('.pack-title-local').evaluate(e=>getComputedStyle(e).animationName),'label-pan');
      assert(await maimaiTitle.locator('.pack-title-local').evaluate(e=>parseFloat(e.style.getPropertyValue('--marquee-shift'))<0));
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.evaluate(()=>SelectionText.refresh());
      await chunithm.click();
      assert.equal(await page.locator('#listCatName').innerText(),'チュウニズム');
      await selectPack('maimai でらっくす');
      assert.equal(await page.locator('#quickPackName').innerText(),'maimai でらっくす');
      await selectPack('オンゲキ');
      assert.equal(await page.locator('#listCatName').innerText(),'オンゲキ');
      assert.equal(await page.evaluate(()=>State.currCat),'O.N.G.E.K.I.');
      await page.evaluate(()=>SceneManager.switch('menu'));
      await page.locator('#openSettings').click();
      await chooseSetting('settingLanguage','zh');
      await page.locator('#settingsDone').click();
      await page.locator('.btn-start-large').click();
      const arcaea=page.locator('.cat-card[data-pack-key="Arcaea"]');
      const whimsyCard=page.locator('.cat-card[data-pack-key="WHIMSY"]');
      await whimsyCard.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
      await whimsyCard.locator('img').evaluate(img=>img.decode());
      assert(await whimsyCard.locator('img').evaluate(img=>img.naturalWidth===1920 && getComputedStyle(img).filter.includes('grayscale(1)')));
      assert.equal(await whimsyCard.locator('.pack-title-original').innerText(),'WHIMSY');
      assert.equal(await whimsyCard.locator('.pack-title-original').evaluate(e=>getComputedStyle(e).opacity),'1');
      await whimsyCard.hover();
      assert.equal(await whimsyCard.locator('img').evaluate(img=>getComputedStyle(img).filter),'none');
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-pack-key="WHIMSY"] .pack-title-local')).opacity==='1');
      assert.equal(await whimsyCard.locator('.pack-title-local').innerText(),'特殊谱面');
      if(process.env.QUALITHM_SCREENSHOTS) await whimsyCard.screenshot({path:path.join(process.env.QUALITHM_SCREENSHOTS,`whimsy-local-${viewport.width}.png`)});
      await arcaea.scrollIntoViewIfNeeded(); await page.mouse.move(0,0);
      assert.equal(await arcaea.locator('.pack-title-original').evaluate(e=>getComputedStyle(e).opacity),'1');
      await arcaea.hover();
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-pack-key="Arcaea"] .pack-title-local')).opacity==='1');
      assert.equal(await arcaea.locator('.pack-title-local').innerText(),'韵律源点');
      await arcaea.click();
      assert.equal(await page.locator('#quickPackName').innerText(),'韵律源点');
      assert.equal(await page.locator('#quickPackName').evaluate(e=>getComputedStyle(e).backgroundClip),'text');
      assert.equal(await page.evaluate(()=>State.currCat),'Arcaea');
      await selectPack('WHIMSY');await page.mouse.move(0,0);await page.locator('#quickPackSelect').blur();
      assert.equal(await page.locator('#listCatName').innerText(),'WHIMSY');
      assert.equal(await page.locator('#quickPackName .pack-title-original').innerText(),'WHIMSY');
      await page.locator('#quickPackSelect').hover();
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('#quickPackName .pack-title-local')).opacity==='1');
      assert.equal(await page.locator('#quickPackName .pack-title-local').innerText(),'特殊谱面');
      await selectPack('全部曲目');
      assert.equal(await page.evaluate(()=>State.currCat),'All Songs');
      assert.equal(await page.locator('#randomSelect').getAttribute('title'),'随机选曲');
      assert.equal(await page.locator('[data-selection-text="chartCountLabel"]').innerText(),'谱面数量');
      assert.equal(await page.evaluate(()=>SelectionText.group('PHASE I')),'Phase I');
      assert.equal(await page.evaluate(()=>SelectionText.group('Cytus II: PHASE II')),'音乐世界Cytus II: Phase II');
      await selectPack('等级');
      const levelPlus=page.locator('.group-label .plus-symbol').first();
      assert(await levelPlus.count(),'Localized level group retains its superscript');
      assert(await levelPlus.evaluate(e=>getComputedStyle(e).position==='relative' && parseFloat(getComputedStyle(e).top)<0));
      await selectPack('全部曲目');
      for(const id of ['randomSelect','sortToggle','preciseToggle']) {
        await page.locator(`#${id}`).click();
        assert.equal(await page.locator(`#${id}`).evaluate(e=>getComputedStyle(e).borderTopWidth),'0px');
        assert.equal(await page.locator(`#${id}`).evaluate(e=>getComputedStyle(e).outlineWidth),'0px');
      }
      // Generate a quiet, local PCM fixture; no third-party audio or network is needed.
      await page.evaluate(()=>{
        const rate=8000, samples=rate*3, bytes=new ArrayBuffer(44+samples*2), view=new DataView(bytes);
        const word=(offset,value)=>[...value].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
        word(0,'RIFF'); view.setUint32(4,36+samples*2,true);word(8,'WAVE');word(12,'fmt ');
        view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
        view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
        word(36,'data');view.setUint32(40,samples*2,true);
        Preview.stop(true);State.currentSong.preview={url:URL.createObjectURL(new Blob([bytes],{type:'audio/wav'})),start:.4,end:1.6};
        State.currentSong.durationMs=180000;Preview.muted=false;Render.songDetail();
        globalThis.__loops=0;Preview.audio.addEventListener('seeking',()=>{if(Preview.audio.currentTime<.5)globalThis.__loops++;});
      });
      const selectedId=await page.evaluate(()=>State.currSongId);
      await selectSong(page.locator(`.song-row[data-song-id="${selectedId}"]`).first());
      await page.waitForFunction(()=>Preview.playing && !Preview.audio.paused && Preview.audio.currentTime>=.4);
      await page.waitForFunction(()=>globalThis.__loops>=2);
      assert(!/\b\d+:\d{2}\b/.test(await page.locator('#detailAnnotations').innerText()));
      await page.locator('#audioToggle').click();
      await page.waitForFunction(()=>Preview.audio.paused);
      await page.locator('#audioToggle').click();
      await page.waitForFunction(()=>!Preview.audio.paused);
      await page.evaluate(()=>SceneManager.switch('category'));
      await page.waitForFunction(()=>Preview.audio.paused);
      assert.deepEqual(errors,[]);
      console.log(`browser-smoke: localization, compact WMS, looping preview ${viewport.width}x${viewport.height} PASS`);
      await context.close();
    }
    // Actual browser refresh on an old V8 local database, then offline JSON fallback.
    const page = await browser.newPage();
    await page.route('**/*', route => route.request().url().startsWith(url) ? route.continue() : route.abort());
    await page.goto(url);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('QUALITHM_DB_V9') || '{}').songs?.length === 81);
    await page.evaluate(() => {
      localStorage.removeItem('QUALITHM_DB_V9');
      localStorage.setItem('QUALITHM_DB_V8', JSON.stringify({ songs: [{ id: 'm1', title: 'MY EDIT', category: 'maimai DX', difficulties: { MET: 17.5 } }, { id: 'mine', title: 'MY SONG', category: 'Custom', difficulties: { MET: 18 } }], meta: { catOrder: ['Custom'] } }));
    });
    await page.reload();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('QUALITHM_DB_V9') || '{}').songs?.length === 82);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('QUALITHM_DB_V9')).songs[0].title), 'MY EDIT');
    await page.evaluate(() => localStorage.clear());
    await page.route('**/qualia_info.json', route => route.abort());
    await page.reload();
    await page.locator('.btn-start-large').click();
    await page.waitForFunction(() => document.querySelector('#catCount').textContent.includes('81 SONGS'));
    console.log('browser-smoke: V8 migration and offline JSON fallback PASS');
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
