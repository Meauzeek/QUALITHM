const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const libraryOnly = source.split("document.getElementById('themeToggle')")[0];

class AudioStub {
  constructor() { this.volume = 1; this.paused = true; this.readyState = 0; this.duration = NaN; this.currentTime = 0; this.src = ''; }
  addEventListener() {}
  removeAttribute() {}
  load() {}
  pause() { this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
}

function elementStub(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    classList: {
      contains: name => classes.has(name),
      toggle: (name, force) => {
        if (force === undefined ? !classes.has(name) : force) classes.add(name);
        else classes.delete(name);
      }
    }
  };
}

const devElements = [elementStub(['dev-only', 'hidden']), elementStub(['dev-only', 'hidden'])];
const devToggle = elementStub();

const sandbox = {
  console,
  Audio: AudioStub,
  setInterval: () => 0,
  clearInterval: () => {},
  setTimeout: () => 0,
  clearTimeout: () => {},
  crypto: { randomUUID: () => 'test-id' },
  localStorage: { getItem: () => null, setItem: () => {} },
  fetch: async () => ({ ok: false }),
  alert: () => {},
  confirm: () => false,
  prompt: () => null,
  navigator: { onLine: true },
  location: { href: 'http://127.0.0.1/' },
  URL,
  Blob,
  AbortController,
  document: {
    querySelectorAll: selector => selector === '.dev-only' ? devElements : [],
    getElementById: id => id === 'devToggle' ? devToggle : null
  }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/vendor/chroma-3.2.0.min.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'palette.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'seed-fallback.js'), 'utf8'), sandbox);
vm.runInContext(`${libraryOnly}\nglobalThis.__logic = { State, DB, Utils, ChartPolicy, CHART_KEYS, DevUI, ChartSelection, Render, Preview };`, sandbox);

const { State, DB, Utils, ChartPolicy, CHART_KEYS, DevUI, ChartSelection, Render, Preview } = sandbox.__logic;
const data = JSON.parse(fs.readFileSync(path.join(root, 'qualia_info.json'), 'utf8'));
State.songs = DB.normalizeSongs(data.songs);
State.meta = DB.buildMeta(data.meta);
State.favorites = new Set([State.songs[0].id]);
DB.refreshCategories();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(Utils.isBrowserAsset('https://example.com/cover.png'), 'HTTPS image URLs must be browser-safe');
assert(!Utils.isBrowserAsset('N:\\archive\\cover.png'), 'Windows-only image paths must use the offline fallback');

assert(State.categories.slice(0, 3).join('|') === 'All Songs|Favorites|Level', 'Virtual archive order must be All Songs, Favorites, Level');

State.currCat = 'Favorites';
State.filterDiff = 'MET';
const favoriteEntries = State.songs
  .filter(song => State.favorites.has(song.id))
  .map(song => ChartPolicy.ordinaryEntry(song))
  .filter(Boolean);
assert(favoriteEntries.length === 1 && favoriteEntries[0].diff === 'MET', 'Favorites must preserve the actual chart filter');

State.devMode = true;
DevUI.sync();
assert(devElements.every(element => !element.classList.contains('hidden')), 'DEBUG must reveal every dev-only control');
State.devMode = false;
DevUI.sync();
assert(devElements.every(element => element.classList.contains('hidden')), 'DEBUG off must hide every dev-only control');

State.currCat = 'Level';
const levelEntries = State.songs.flatMap(song => ChartPolicy.levelEntries(song));
assert(levelEntries.length === 333, `Expected 333 Level charts, got ${levelEntries.length}`);
assert(new Set(levelEntries.map(entry => `${entry.song.id}::${entry.diff}`)).size === 333, 'Level row identities must be unique');

State.currCat = 'All Songs';
State.filterDiff = 'MET';
const metEntries = State.songs.map(song => ChartPolicy.ordinaryEntry(song)).filter(Boolean);
assert(metEntries.length === 73 && metEntries.every(entry => entry.diff === 'MET'), 'MET must be strict MET-only');

State.filterDiff = 'HYP';
const hypEntries = State.songs.map(song => ChartPolicy.ordinaryEntry(song)).filter(Boolean);
assert(hypEntries.length === 73, `Expected 73 HYP-mode rows, got ${hypEntries.length}`);
assert(hypEntries.filter(entry => entry.diff === 'HYP').length === 27, 'Expected 27 actual HYP charts');
assert(hypEntries.filter(entry => entry.diff === 'MET' && entry.fallback).length === 46, 'Expected 46 HYP→MET fallbacks');
assert(hypEntries.filter(entry => entry.fallback).every(entry => entry.diff === 'MET' && entry.song.difficulties.HYP === undefined), 'Every HYP fallback row must identify itself as actual MET');

const clickedFallback = hypEntries.find(entry => entry.fallback);
Render.songList = () => {};
Preview.select = () => {};
State.currSongId = null;
State.currDiff = 'HYP';
ChartSelection.select(clickedFallback, { autoplay: false });
assert(State.currSongId === clickedFallback.song.id && State.currDiff === 'MET', 'Clicking a MET fallback row must open MET, never HYP');

State.filterDiff = 'WMS';
const wmsEntries = State.songs.map(song => ChartPolicy.ordinaryEntry(song)).filter(Boolean);
assert(wmsEntries.length === 14 && wmsEntries.every(entry => entry.diff === 'WMS'), 'WMS must be strict WMS-only');

for (const entry of [...levelEntries, ...metEntries, ...hypEntries, ...wmsEntries]) {
  assert(CHART_KEYS.includes(entry.diff), `Unexpected chart key ${entry.diff}`);
  assert(entry.song.difficulties[entry.diff] !== undefined, `Row ${entry.song.id} displays a missing chart`);
}

console.log('logic-smoke: PASS');
console.log('LEVEL=333 MET=73 HYP=73 (27 HYP + 46 MET fallback) WMS=14 FAVORITES=1');
module.exports = { sandbox, State, DB, Utils, ChartPolicy, Preview, data };
