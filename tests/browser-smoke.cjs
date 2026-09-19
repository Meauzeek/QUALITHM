const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(path.dirname(process.execPath), '..', 'node_modules', 'playwright'))); }
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, ...(process.env.QUALITHM_BROWSER_CHANNEL ? { channel: process.env.QUALITHM_BROWSER_CHANNEL } : {}) });
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      // External art must not be necessary for rendering or operating the UI.
      await page.route('**/*', route => route.request().url().startsWith(url) ? route.continue() : route.abort());
      await page.goto(url);
      await page.locator('.btn-start-large').click();
      await page.waitForFunction(() => document.querySelectorAll('.cat-card').length === 14);
      await page.locator('#scene-category.active').waitFor({ state: 'visible' });
      const archiveCount = await page.locator('#catCount').textContent();
      assert(archiveCount.includes('73 SONGS'), JSON.stringify({ archiveCount, errors }));
      await page.locator('.cat-card').filter({ has: page.getByRole('heading', { name: 'Phigros', exact: true }) }).click();
      assert.equal(await page.locator('.song-row').count(), 4);
      await page.locator('#chartFilterOptions [data-diff="HYP"]').click();
      assert.equal(await page.locator('.song-row[data-difficulty="MET"]').count(), 4);
      await page.locator('.song-row').last().click();
      assert.equal(await page.locator('#detailTitle').innerText(), 'DESTRUCTION 3,2,1');
      assert.equal(await page.locator('.d-tab.active').getAttribute('data-type'), 'MET');
      const jacket = await page.locator('.jacket-box').boundingBox();
      assert(Math.abs(jacket.width - jacket.height) < 2, 'Jacket must remain square');
      await page.locator('#devToggle').click();
      await page.locator('#btnEditSong').click();
      assert(await page.locator('#editModal').evaluate(e => e.classList.contains('open')));
      await page.locator('#valMET').fill('18.5');
      await page.locator('#editForm').evaluate(form => form.requestSubmit());
      await page.locator('#quickPackSelect').selectOption('Level');
      await page.locator('#searchInput').fill('DESTRUCTION');
      const high = page.locator('.song-row[data-difficulty="MET"]');
      assert((await high.innerText()).includes('18+'));
      await high.click();
      await page.locator('#preciseToggle').click();
      assert.equal(await page.locator('#stampVal').innerText(), '18.5');
      await page.locator('#searchInput').fill('');
      await page.locator('#quickPackSelect').selectOption('Rotaeno');
      await page.locator('#chartFilterOptions [data-diff="HYP"]').click();
      await page.locator('.song-row[data-song-id="collab-rot-suimori"]').click();
      assert.equal(await page.locator('.d-tab.active').getAttribute('data-type'), 'HYP');
      assert(await page.locator('#stampVal').evaluate(e => e.closest('.rate-stamp').classList.contains('hyp-style')));
      const stampStyle = await page.locator('.rate-stamp.hyp-style').evaluate(e => {
        const s = getComputedStyle(e);
        return { widths: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth], outline: s.outlineStyle, background: s.backgroundImage, shadow: s.boxShadow };
      });
      assert.equal(new Set(stampStyle.widths).size, 1, 'HYP stamp borders must have equal widths');
      assert.equal(stampStyle.outline, 'none', 'No jagged extra outline');
      assert(!stampStyle.shadow.includes('inset'), 'No doubled top border');
      assert(stampStyle.background.includes('rgba(226, 232, 255, 0.72)'), 'Daytime corner must reveal purple underneath');
      assert(stampStyle.background.includes('90.5%'), 'Corner keeps its parallel cutout');
      assert.equal(await page.locator('.d-tab[data-type="MET"]').evaluate(e => e.style.getPropertyValue('--col-ref')), '#465fe2');
      if (process.env.QUALITHM_SCREENSHOTS) {
        await page.locator('#detailTitle').scrollIntoViewIfNeeded();
        await page.screenshot({ animations: 'disabled', path: path.join(process.env.QUALITHM_SCREENSHOTS, `hyp-${viewport.width}.png`) });
      }
      await page.locator('#themeToggle').click();
      const nightCorner = await page.locator('.rate-stamp.hyp-style').evaluate(e => getComputedStyle(e).backgroundImage);
      assert(nightCorner.includes('rgb(226, 232, 255)'), 'Nighttime corner retains its brighter contrast');
      assert.equal(await page.locator('.d-tab[data-type="MET"]').evaluate(e => e.style.getPropertyValue('--col-ref')), '#516ef2');
      if (process.env.QUALITHM_SCREENSHOTS) {
        await page.screenshot({ animations: 'disabled', path: path.join(process.env.QUALITHM_SCREENSHOTS, `hyp-dark-${viewport.width}.png`) });
      }
      await page.locator('#themeToggle').click();
      if (process.env.QUALITHM_SCREENSHOTS) {
        await page.locator('#chartFilterOptions [data-diff="MET"]').click();
        await page.locator('.song-row[data-song-id="collab-rot-suimori"]').click();
        await page.screenshot({ animations: 'disabled', path: path.join(process.env.QUALITHM_SCREENSHOTS, `met-${viewport.width}.png`) });
        await page.locator('#themeToggle').click();
        await page.screenshot({ animations: 'disabled', path: path.join(process.env.QUALITHM_SCREENSHOTS, `met-dark-${viewport.width}.png`) });
        await page.locator('#themeToggle').click();
      }
      await page.locator('#quickPackSelect').selectOption('Cytus II');
      await page.locator('#chartFilterOptions [data-diff="MET"]').click();
      const titles = await page.locator('.song-row .s-title').allTextContents();
      assert.equal(titles.length, 16);
      assert(titles.some(t => t.includes('͟͝͞Ⅱ́̕')));
      assert.equal(await page.locator('.hidden-mark').count(), 1);
      await page.locator('#searchInput').fill('機械');
      assert.equal(await page.locator('.song-row').count(), 1);
      await page.locator('#searchInput').fill('');
      await page.locator('#quickPackSelect').selectOption('WHIMSY');
      const full = page.locator('.song-row[data-song-id="collab-cy2-ii"]');
      await full.click();
      assert((await page.locator('#detailTitle').innerText()).includes('Full Version'));
      assert((await page.locator('#detailAnnotations').innerText()).includes('FULL VERSION'));
      assert.equal(await page.locator('#stampVal').innerText(), '全');
      assert.equal(await page.locator('#previewToggle').isDisabled(), false);
      assert((await page.locator('#previewStatus').innerText()).includes('APPLE MUSIC'));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, 'Page must fit width');
      assert.deepEqual(errors, []);
      console.log(`browser-smoke: ${viewport.width}x${viewport.height} PASS`);
      if (process.env.QUALITHM_SCREENSHOTS) await page.screenshot({ path: path.join(process.env.QUALITHM_SCREENSHOTS, `qualithm-${viewport.width}.png`) });
      await context.close();
    }
    // Actual browser refresh on an old V8 local database, then offline JSON fallback.
    const page = await browser.newPage();
    await page.route('**/*', route => route.request().url().startsWith(url) ? route.continue() : route.abort());
    await page.goto(url);
    await page.evaluate(() => {
      localStorage.removeItem('QUALITHM_DB_V9');
      localStorage.setItem('QUALITHM_DB_V8', JSON.stringify({ songs: [{ id: 'm1', title: 'MY EDIT', category: 'maimai DX', difficulties: { MET: 17.5 } }, { id: 'mine', title: 'MY SONG', category: 'Custom', difficulties: { MET: 18 } }], meta: { catOrder: ['Custom'] } }));
    });
    await page.reload();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('QUALITHM_DB_V9') || '{}').songs?.length === 74);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('QUALITHM_DB_V9')).songs[0].title), 'MY EDIT');
    await page.evaluate(() => localStorage.clear());
    await page.route('**/qualia_info.json', route => route.abort());
    await page.reload();
    await page.locator('.btn-start-large').click();
    await page.waitForFunction(() => document.querySelector('#catCount').textContent.includes('73 SONGS'));
    console.log('browser-smoke: V8 migration and offline JSON fallback PASS');
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
