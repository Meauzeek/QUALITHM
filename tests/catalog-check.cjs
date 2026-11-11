const assert = require('node:assert/strict');
const { sandbox, DB, Utils, data } = require('./logic-smoke.cjs');
const updates = sandbox.QUALITHM_CATALOG_UPDATES;
assert(Utils.titleHTML('xi feat. 燕檸 (vocal: 柚木つばめ)').includes('class="cjk-punctuation"'));
assert.equal(Utils.titleHTML('Title (Remix)'), 'Title (Remix)');
assert.equal(data.songs.find(s => s.title === 'Selenophilia').bpm, 200);
assert.equal(data.songs.find(s => s.title === '2enith 4bove Chroma').bpm, 242.4);
assert.deepEqual(data.songs.find(s => s.title === 'Selenophilia').difficulties, { NUL: 3, PHM: 8, DEC: 13.9, MET: 16.3 });
assert.deepEqual(data.songs.find(s => s.title === '2enith 4bove Chroma').difficulties, { NUL: 4, PHM: 8, DEC: 12.4, MET: 15.5, HYP: 16.2 });
assert.equal(Utils.assetURL('C:\\project\\assets\\jackets\\test.jpg'), 'assets/jackets/test.jpg');
assert.equal(Utils.assetURL('assets\\jackets\\test.jpg'), 'assets/jackets/test.jpg');
assert.equal(Utils.assetURL('file:///C:/project/assets/jackets/test.jpg'), 'assets/jackets/test.jpg');
for (const path of ['javascript:alert(1)', 'C:/private/image.png', '../private.png', '//evil.test/img']) assert.equal(Utils.assetURL(path), '');
for (const update of updates) {
    for (const patch of update.songs) {
        const seed = data.songs.find(s => s.id === patch.id);
        assert(seed, patch.id);
        for (const [target, changes] of [[seed, patch.fields], [seed.difficulties, patch.difficulties]]) {
            for (const [key, change] of Object.entries(changes || {})) assert.deepEqual(target[key], change.after);
        }
    }
}
const cached = { songs: [{ id: 'collab-pr-sense-of-wonder', title: 'My title', coverUrl: 'mine.jpg', difficulties: { NUL: 99, PHM: 11, DEC: 13.8, MET: 15.9 } }], meta: {} };
const saved = JSON.stringify(cached);
const merged = DB.mergeSeed(cached, data);
assert.equal(JSON.stringify(cached), saved, 'Migration must not mutate the source');
assert.equal(merged.songs[0].title, 'My title');
assert.equal(merged.songs[0].coverUrl, 'mine.jpg');
assert.equal(merged.songs[0].difficulties.NUL, 99);
assert.equal(merged.songs[0].difficulties.MET, 15.7);
assert.equal(merged.songs[0].difficulties.HYP, 16);
merged.songs[0].difficulties.MET = 15.9;
assert.equal(DB.mergeSeed(merged, data).songs[0].difficulties.MET, 15.9, 'Do not reapply after a later manual edit');
const inuk = data.songs.find(s => s.title === 'ᐃᓄᒃ');
const markstern = data.songs.find(s=>s.id==='16150cf2-714c-42aa-a075-f02da9b1d426');
assert(markstern.title.includes('髄星')); assert.equal(markstern.alias,'髓星');
const legacyMarkstern = {...markstern,title:markstern.title.replace('髄星','髓星')}; delete legacyMarkstern.alias;
const migratedMarkstern = DB.mergeSeed({songs:[legacyMarkstern],meta:{}},data).songs[0];
assert.equal(migratedMarkstern.title,markstern.title); assert.equal(migratedMarkstern.alias,'髓星');
assert.equal(DB.mergeSeed({songs:[{...legacyMarkstern,title:'My title'}],meta:{}},data).songs[0].title,'My title');
assert.equal(inuk.bpm, 289);
assert.equal(DB.mergeSeed({ songs: [{ ...inuk, bpm: 'undefined' }] }, data).songs[0].bpm, 289);
assert.equal(data.songs.find(s => s.title === '大音').difficulties.HYP, 18);
for (const title of ['Άνθρωπος', 'Α\u0301νθρωπος', 'ἄνθρωπος']) {
    assert(Utils.titleHTML(title).includes('class="greek-text"'));
    assert.equal(Utils.titleHTML(title).replace(/<[^>]+>/g, ''), title);
}
for (const title of ['͟͝͞Ⅱ́̕', 'Comptinésie', 'ᐃᓄᒃ', '雪融花', 'MET', 'Café', 'Cafe\u0301']) assert.equal(Utils.titleHTML(title), title);
assert.equal(Utils.titleHTML('A <Ά> & B'), 'A &lt;<span class="greek-text" lang="el">Ά</span>&gt; &amp; B');
console.log('catalog-check: PASS — revised ratings, originals, one-time field migration and Greek-only shaping');
