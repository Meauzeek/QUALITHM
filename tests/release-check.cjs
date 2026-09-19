const assert = require('node:assert/strict');
const { sandbox, State, DB, Utils, ChartPolicy, Preview, data } = require('./logic-smoke.cjs');
const { rank } = require('../metadata-lookup.js');
require('./palette-check.cjs');

async function main() {
  const added = data.songs.filter(s => s.id.startsWith('collab-'));
  assert.equal(added.length, 34);
  assert.equal(new Set(data.songs.map(s => s.id)).size, 73);
  const expected = { Phigros: 4, 'Paradigm: Reboot': 10, Rotaeno: 4, 'Cytus II': 16 };
  for (const [category, count] of Object.entries(expected)) assert.equal(added.filter(s => s.category === category).length, count);
  assert.equal(added.filter(s => s.hidden).length, 3);
  const locked = { 'collab-phi-destruction-321': [16, null], 'collab-pr-zero': [15.3, 16], 'collab-pr-observatory': [15.9, null], 'collab-rot-suimori': [14.5, 15.8], 'collab-rot-quadruplicity': [15.4, 16], 'collab-cy2-ii': [15.5, null], 'collab-pr-sense-of-wonder': [15.9, null] };
  for (const [id, [met, hyp]] of Object.entries(locked)) {
    const s = added.find(s => s.id === id);
    assert.equal(s.difficulties.MET, met);
    assert.equal(s.difficulties.HYP ?? null, hyp);
  }
  for (const s of added) {
    assert(s.coverUrl.startsWith('https://'));
    assert(s.bpm !== null, s.title + ': BPM missing');
    const levels = ['NUL', 'PHM', 'DEC', 'MET', 'HYP'].map(k => s.difficulties[k]).filter(v => v !== undefined);
    assert(levels.every((n, i) => Number.isFinite(n) && n <= 16.3 && (!i || n > levels[i - 1])), s.title);
    assert(!s.previewUrl || s.previewUrl.startsWith('https://audio-ssl.itunes.apple.com/'));
  }
  const full = added.find(s => s.id === 'collab-cy2-ii');
  assert.equal(full.title, '͟͝͞Ⅱ́̕');
  assert.equal(full.difficulties.WMS, '全');
  assert(full.WMS_durationMs > 420000 && full.durationMs < 240000);
  assert.equal(full.preview.url, '');
  assert(full.WMS_previewUrl);
  assert.equal(added.filter(s => s.category === 'Cytus II' && s.subgroup === 'PHASE II').length, 5);

  // User edits, custom songs, custom order and pack art survive a refresh.
  const edited = { ...data.songs[0], title: 'LOCAL EDIT', difficulties: { MET: 18.5 } };
  const custom = { id: 'user-song', title: 'CUSTOM', category: 'User pack', difficulties: { NUL: 1000 } };
  const local = { songs: [edited, custom], meta: { catOrder: ['User pack', 'maimai DX', 'VARIETY'], catMeta: { 'maimai DX': { cover: 'custom.jpg' } }, characters: [{ id: 'user-character' }] } };
  const frozen = JSON.stringify(local);
  const merged = DB.mergeSeed(local, data);
  assert.equal(JSON.stringify(local), frozen);
  assert.equal(merged.songs.length, 74);
  assert.deepEqual(merged.songs[0], edited);
  assert.deepEqual(merged.songs[1], custom);
  assert.equal(merged.meta.catMeta['maimai DX'].cover, 'custom.jpg');
  assert.equal(merged.meta.characters[0].id, 'user-character');
  assert(merged.meta.catOrder.indexOf('Phigros') < merged.meta.catOrder.indexOf('VARIETY'));
  assert.equal(DB.mergeSeed(merged, data).songs.length, 74);
  const original = data.songs[0];
  assert.equal(DB.previewSupplements([{ ...original, preview: { url: '', start: 0, end: null } }]).length, 1);
  assert.equal(DB.previewSupplements([{ ...original, preview: { url: 'my-audio.ogg' } }]).length, 0);
  assert.equal(DB.previewSupplements([{ ...original, preview: { url: '', start: 12 } }]).length, 0);
  assert.equal(DB.previewSupplements([{ ...original, title: 'USER TITLE', preview: { url: '' } }]).length, 0);
  assert.equal(DB.normalizeSongs([{ ...original, previewUrl: 'legacy.ogg', preview: { url: '' } }])[0].preview.url, '');
  State.currSongId = original.id; State.currDiff = 'MET';
  assert(Preview.externalOnly, 'Store samples must not become game-loop audio');
  Preview.audio.readyState = 1;
  await Preview.play();
  assert(Preview.audio.paused, 'Apple samples must not play inside the app');
  State.songs.push({ id: 'own-audio', preview: { url: 'assets/own.ogg', start: 12, end: 28 } });
  State.currSongId = 'own-audio';
  assert.equal(Preview.externalOnly, false);
  Preview.audio.duration = 20;
  assert.equal(Preview.endTime(), 20, 'Configured end must clamp to actual duration');
  await Preview.play();
  assert.equal(Preview.audio.currentTime, 12);
  assert.equal(Preview.audio.paused, false);
  Preview.stop(true);
  assert(Preview.audio.paused);
  assert.equal(data.songs.filter(s => !s.id.startsWith('collab-') && s.preview?.url).length, 29);

  // Exercise DB.init with actual mocked storage / network, including V8 upgrade.
  for (const key of [DB.key, DB.legacyKey]) {
    const storage = new Map([[key, JSON.stringify(local)]]);
    sandbox.localStorage = { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) };
    sandbox.fetch = async () => ({ ok: true, json: async () => data });
    await DB.init();
    assert.equal(State.songs.length, 74);
    assert.equal(State.songs[0].title, 'LOCAL EDIT');
    assert(storage.has(DB.key));
  }
  sandbox.localStorage = { getItem: () => null, setItem: () => {} };
  await DB.init(); assert.equal(State.songs.length, 73);
  sandbox.fetch = async () => { throw new Error('simulated offline'); };
  await DB.init(); assert.equal(State.songs.length, 73);
  let overwrites = 0;
  sandbox.localStorage = { getItem: () => '{broken', setItem: () => overwrites++ };
  await DB.init(); assert.equal(overwrites, 0); assert.equal(State.songs.length, 73);

  // No business cap and no collision between numeric level 999 and WHIMSY.
  for (const value of [17, 17.5, 18, 25.9, 999, 1000, 1000000]) {
    const song = { id: `test-${value}`, difficulties: { MET: value } };
    const [entry] = ChartPolicy.levelEntries(song);
    assert.equal(entry.diff, 'MET'); assert.equal(entry.val, value);
    assert.equal(Utils.formatPrecise(value), value.toFixed(1));
    assert(!Utils.formatRough(value).includes('WHIMSY'));
  }
  assert(Utils.formatRough(17.5).includes('17<span'));
  const candidates = [{ trackName: 'Alexandrite', artistName: 'WAiKURO', collectionName: 'Arcaea' }, { trackName: 'Alexandrite', artistName: 'onoken', collectionName: 'Cytus II-Ivy' }];
  assert.equal(rank(candidates, { title: 'Alexandrite', artist: 'onoken', category: 'Cytus II' }).length, 1);
  assert.equal(rank([{ trackName: 'Ice', artistName: 'Lil Baby' }], { title: 'iL', artist: 'Ice' }).length, 0);
  assert.equal(rank([{ trackName: 'Used to Be', artistName: 'AJ Mitchell' }], { title: 'Used to be', artist: 'KIVΛ' }).length, 0);
  console.log('release-check: PASS — migration, offline bootstrap, locked ratings, editions, matching, uncapped levels');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
