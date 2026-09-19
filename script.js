/* =========================================
   CONFIG & UTILS
   ========================================= */
const CONFIG = {
    colors: {
        NUL: '#ff7f50', PHM: '#d4af37', DEC: '#2e8b57',
        MET: '#8a2be2', HYP: '#9270d6', WMS: '#888888'
    },
    labels: {
        NUL: 'NULL', PHM: 'PHANTOM', DEC: 'DECAY', 
        MET: 'META', HYP: 'HYPER', WMS: 'WHIMSY'
    },
    defaultDifficulties: { NUL: 1.0, PHM: 5.0, DEC: 9.0, MET: 12.0 },
    defaultDialogues: [
      "Juni is Here! (｡•̀ᴗ-)✧",
      "System online. > <",
      "Fragments loaded. (๑>◡<๑)",
      "Awaiting input. (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)",
      "Kyunni~(∠> ▽ < )⌒♪"
    ]
};

// Optional hard-coded pack art overrides. Empty by default so the configured
// pack image or the first available song jacket becomes the fallback.
const DEFAULT_CAT_COVERS = {};
const CHART_KEYS = ['NUL', 'PHM', 'DEC', 'MET', 'HYP', 'WMS'];

const Utils = {
    escapeHTML: value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])),
    randomTilt: () => (Math.random() * 4 - 2).toFixed(2) + 'deg',
    isBrowserAsset(url) {
        const value = String(url || '').trim();
        return Boolean(value) && !/^[a-z]:[\\/]/i.test(value) && !/^(?:javascript|vbscript|file):/i.test(value);
    },
    formatRough(val) {
        if (typeof val === 'string') return Utils.escapeHTML(val);
        if (!val && val !== 0) return '-';
        const int = Math.floor(val);
        return (val - int) >= 0.5 ? `${int}<span class="plus-symbol">+</span>` : `${int}`;
    },
    formatPrecise: (val) => {
        if (typeof val === 'string') return Utils.escapeHTML(val);
        return (typeof val === 'number') ? val.toFixed(1) : (val || '-');
    },
    toggleTheme() {
        const body = document.body;
        body.setAttribute('data-theme', body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    },
    exportData() {
        const blob = new Blob([JSON.stringify({songs: State.songs, meta: State.meta}, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'qualia_info.json';
        a.click();
    },
    glassColor(hex) { return `color-mix(in srgb, ${hex}, transparent 80%)`; }
};

const ViewportManager = {
    setSizeVars() {
        const vw = window.visualViewport?.width || window.innerWidth;
        const vh = window.visualViewport?.height || window.innerHeight;
        document.documentElement.style.setProperty('--app-vw', `${vw}px`);
        document.documentElement.style.setProperty('--app-vh', `${vh}px`);
    },
    init() {
        this.setSizeVars();
        window.addEventListener('resize', () => this.setSizeVars(), { passive: true });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.setSizeVars(), 200);
        }, { passive: true });
        window.visualViewport?.addEventListener('resize', () => this.setSizeVars(), { passive: true });
    }
};

/* =========================================
   FULL DATA SEEDING
   ========================================= */
const fillLowDiffs = (d) => ({
    NUL: 3.0, PHM: 7.0, DEC: 10.5, ...d
});

// Generated from qualia_info.json by tools/sync-seed.mjs; never maintain two seeds.
const SEED_SONGS = globalThis.QUALITHM_SEED?.songs || [];
const SEED_META = globalThis.QUALITHM_SEED?.meta || { catOrder: [], catMeta: {}, juniConfig: {} };

const DB = {
    key: 'QUALITHM_DB_V9',
    legacyKey: 'QUALITHM_DB_V8',
    async init() {
        let cached;
        this.storageWritable = true;
        try {
            const raw = localStorage.getItem(this.key) || localStorage.getItem(this.legacyKey);
            if (raw) {
                cached = JSON.parse(raw);
                if (!Array.isArray(cached.songs)) throw new Error('Invalid cached song library');
            }
        } catch (error) {
            cached = undefined;
            this.storageWritable = false;
            console.warn('Saved library could not be read; using bundled library for this session.', error);
        }
        const seed = await this.loadLocalBootstrap() || { songs: SEED_SONGS, meta: SEED_META };
        const merged = this.mergeSeed(cached, seed);
        State.songs = this.normalizeSongs(merged.songs);
        State.meta = this.buildMeta(merged.meta);
        this.save();
        this.refreshCategories();
        setInterval(() => {
            const d = new Date();
            document.getElementById('sysTime').innerText = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        }, 1000);
    },
    mergeSeed(local, seed) {
        const songs = [...(local?.songs || [])];
        const ids = new Set(songs.map(song => song.id));
        for (const song of seed.songs) {
            if (!ids.has(song.id)) { songs.push(song); ids.add(song.id); }
        }
        const meta = { ...seed.meta, ...(local?.meta || {}) };
        meta.catMeta = { ...(seed.meta?.catMeta || {}), ...(local?.meta?.catMeta || {}) };
        const order = [...(local?.meta?.catOrder || seed.meta?.catOrder || [])];
        const seedOrder = seed.meta?.catOrder || [];
        for (let i = 0; i < seedOrder.length; i++) {
            const category = seedOrder[i];
            if (order.includes(category)) continue;
            const next = seedOrder.slice(i + 1).find(cat => order.includes(cat));
            if (next) order.splice(order.indexOf(next), 0, category);
            else order.push(category);
        }
        meta.catOrder = [...new Set(order)];
        meta.seedVersion = seed.meta?.seedVersion || meta.seedVersion;
        return { songs, meta };
    },
    previewSupplements(songs) {
        return songs.flatMap(song => {
            const seed = SEED_SONGS.find(item => item.id === song.id && item.title === song.title && item.artist === song.artist);
            if (!seed?.preview?.url || song.preview?.url || song.previewUrl || song.preview?.start || song.preview?.end) return [];
            return [{ song, seed }];
        });
    },
    buildMeta(meta = {}) {
        const mergedMeta = {
            ...JSON.parse(JSON.stringify(SEED_META)),
            ...meta,
            juniConfig: {
                ...SEED_META.juniConfig,
                ...(meta.juniConfig || {})
            },
            catMeta: {
                ...(SEED_META.catMeta || {}),
                ...(meta.catMeta || {})
            }
        };

        if (!mergedMeta.juniUrl || mergedMeta.juniUrl.includes('placehold.co')) {
            mergedMeta.juniUrl = SEED_META.juniUrl;
        }

        const legacyCharacter = {
            id: 'juni', name: 'Juni',
            imageUrl: String(mergedMeta.juniUrl || '').replace(/^http:\/\/scpsandboxcn\.wikidot\.com/i, 'https://scpsandboxcn.wikidot.com'),
            enabled: true,
            x: Number(mergedMeta.juniConfig?.x) || 0,
            y: Number(mergedMeta.juniConfig?.y) || 0,
            scale: Number(mergedMeta.juniConfig?.s) || 1,
            dialogues: Array.isArray(mergedMeta.dialogues) ? mergedMeta.dialogues : []
        };
        const sourceCharacters = Array.isArray(meta.characters) && meta.characters.length ? meta.characters : [legacyCharacter];
        mergedMeta.characters = sourceCharacters.map((character, index) => ({
            id: character.id || `character-${index + 1}`,
            name: character.name || `CHARACTER ${index + 1}`,
            imageUrl: String(character.imageUrl || character.url || '').replace(/^http:\/\/scpsandboxcn\.wikidot\.com/i, 'https://scpsandboxcn.wikidot.com'),
            enabled: character.enabled !== false,
            x: Number(character.x) || 0,
            y: Number(character.y) || 0,
            scale: Math.max(.5, Math.min(2, Number(character.scale ?? character.s) || 1)),
            dialogues: Array.isArray(character.dialogues) ? character.dialogues.filter(Boolean) : []
        }));
        return mergedMeta;
    },
    normalizeSongs(songs) {
        const seen = new Set();
        return JSON.parse(JSON.stringify(songs)).filter(song => {
            if (!song || typeof song !== 'object') return false;
            const key = song.id || `${song.title}::${song.artist}::${song.category}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).map((song, index) => ({
            ...song,
            id: song.id || `song-${index + 1}`,
            title: song.title || 'UNTITLED',
            artist: song.artist || 'UNKNOWN ARTIST',
            category: song.category || 'Original',
            subgroup: song.subgroup || '',
            difficulties: song.difficulties && typeof song.difficulties === 'object' ? song.difficulties : {},
            preview: {
                url: String(song.preview?.url ?? song.previewUrl ?? ''),
                start: Math.max(0, Number(song.preview?.start ?? song.previewStart) || 0),
                end: Number(song.preview?.end ?? song.previewEnd) > 0 ? Number(song.preview?.end ?? song.previewEnd) : null,
                source: String(song.preview?.source || ''),
                sourceUrl: String(song.preview?.sourceUrl || '')
            }
        }));
    },
    async loadLocalBootstrap() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetch('./qualia_info.json', { cache: 'no-store', signal: controller.signal });
            if (!response.ok) return null;
            const data = await response.json();
            if (!data || !Array.isArray(data.songs) || !data.songs.length) return null;
            return data;
        } catch (e) {
            console.warn('qualia_info.json auto-import skipped:', e);
            return null;
        } finally { clearTimeout(timeout); }
    },
    save() {
        try {
            if (this.storageWritable !== false) localStorage.setItem(this.key, JSON.stringify({ songs: State.songs, meta: State.meta }));
        } catch (error) {
            console.warn('Local storage unavailable; export JSON to keep session edits.', error);
        }
        this.refreshCategories();
    },
    refreshCategories() {
        const songCats = new Set(State.songs.map(s => s.category));
        let mergedSet = new Set([...songCats, ...(State.meta.catOrder || [])]);
        let arr = Array.from(mergedSet).filter(c => !['All Songs', 'Favorites', 'Level', 'WHIMSY'].includes(c)).sort();
        
        if (State.meta.catOrder.length > 0) {
            arr.sort((a, b) => {
                const idxA = State.meta.catOrder.indexOf(a);
                const idxB = State.meta.catOrder.indexOf(b);
                const posA = idxA === -1 ? 9999 : idxA;
                const posB = idxB === -1 ? 9999 : idxB;
                return posA - posB;
            });
        }
        
        arr = arr.filter(c => c !== 'Original');
        arr.unshift('Original');
        arr.unshift('Level');
        arr.unshift('Favorites');
        arr.unshift('All Songs');
        if (State.songs.some(s => s.difficulties.WMS)) arr.push('WHIMSY');
        
        State.categories = arr;
        if(State.meta.catOrder.length === 0) State.meta.catOrder = arr;
    }
};

const State = {
    songs: [], meta: {}, categories: [],
    currCat: null, currSongId: null, currDiff: 'MET', filterDiff: 'MET',
    sortMode: 'subgroup', isPrecise: false, devMode: false, batchMode: false,
    selectedSongs: new Set(), favorites: new Set(), visibleEntries: [], lastRandomKey: null,
    
    get currentSong() { return this.songs.find(s => s.id === this.currSongId); },
    get isWhimsyCat() { return this.currCat === 'WHIMSY'; },
    get isLevelCat() { return this.currCat === 'Level'; }
};

const UserState = {
    key: 'QUALITHM_USER_STATE_V1',
    init() {
        try {
            const data = JSON.parse(localStorage.getItem(this.key) || '{}');
            State.favorites = new Set(Array.isArray(data.favorites) ? data.favorites.filter(Boolean) : []);
        } catch {
            State.favorites = new Set();
        }
    },
    save() {
        localStorage.setItem(this.key, JSON.stringify({ favorites: Array.from(State.favorites) }));
    },
    has(songId) { return Boolean(songId) && State.favorites.has(songId); },
    toggle(songId = State.currSongId) {
        if (!songId) return;
        if (State.favorites.has(songId)) State.favorites.delete(songId);
        else State.favorites.add(songId);
        this.save();
        Render.songList();
    },
    renderFavorite() {
        const button = document.getElementById('favoriteToggle');
        if (!button) return;
        const active = this.has(State.currSongId);
        button.disabled = !State.currentSong;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
        button.title = active ? 'Remove from Favorites' : 'Add to Favorites';
        button.querySelector('.favorite-glyph').textContent = active ? '★' : '☆';
    }
};

const DevUI = {
    sync() {
        document.querySelectorAll('.dev-only').forEach(element => element.classList.toggle('hidden', !State.devMode));
        document.getElementById('devToggle')?.classList.toggle('active', State.devMode);
    }
};

const SceneManager = {
    switch(id) {
        if (id !== 'music') Preview.stop();
        document.querySelectorAll('.scene').forEach(el => el.classList.remove('active'));
        document.getElementById(`scene-${id}`).classList.add('active');
        
        const sysInfo = document.getElementById('mainSysInfo');
        if (id === 'menu') sysInfo.classList.remove('hidden');
        else sysInfo.classList.add('hidden');

        if (id === 'menu') Juni.applyConfig();
        if (id === 'category') {
            try { Render.categoryGrid(); }
            catch (error) { console.error('Archive rendering failed:', error); Render.categoryError(); }
        }
        if (id === 'music') {
            State.batchMode = false;
            State.sortMode = State.isLevelCat ? 'level_desc' : (State.currCat === 'All Songs' ? 'pack' : 'subgroup');
            BatchOps.renderUI();
            QuickPack.render();
            DifficultyFilter.render();
            Render.songList();
        }
        DevUI.sync();
    }
};

const Juni = {
    index: 0,
    get list() {
        const enabled = (State.meta.characters || []).filter(character => character.enabled !== false);
        return enabled.length ? enabled : (State.meta.characters || []);
    },
    get current() { return this.list[this.index] || this.list[0]; },
    init() {
        this.applyConfig();
        document.getElementById('charContainer').onclick = () => { if(!State.devMode) this.speak(); };
        document.getElementById('charSwitcher').onclick = event => event.stopPropagation();
        document.querySelector('.char-controls').onclick = event => event.stopPropagation();
        setInterval(() => {
            if (!State.devMode && document.getElementById('scene-menu').classList.contains('active')) {
                this.list.length > 1 ? this.next() : this.speak();
            }
        }, 30000);
    },
    applyConfig() {
        const img = document.getElementById('heroImage');
        const character = this.current;
        if (!character) return;
        img.alt = character.name;
        img.classList.remove('image-error');
        img.onerror = () => img.classList.add('image-error');
        img.onload = () => img.classList.remove('image-error');
        img.src = character.imageUrl || '';
        img.style.transform = `translate(calc(-50% + ${character.x}px), calc(-50% + ${character.y}px)) scale(${character.scale})`;
        document.getElementById('activeCharacterName').innerText = `${String(character.name).toUpperCase()} // ${String(this.index + 1).padStart(2, '0')}`;
        if(State.devMode) {
            document.getElementById('juniX').value = character.x;
            document.getElementById('juniY').value = character.y;
            document.getElementById('juniS').value = character.scale;
        }
    },
    updateConfig() {
        const character = this.current; if (!character) return;
        character.x = parseInt(document.getElementById('juniX').value);
        character.y = parseInt(document.getElementById('juniY').value);
        character.scale = parseFloat(document.getElementById('juniS').value);
        this.applyConfig(); DB.save();
    },
    next() { if (!this.list.length) return; this.index = (this.index + 1) % this.list.length; this.applyConfig(); this.speak(); },
    prev() { if (!this.list.length) return; this.index = (this.index - 1 + this.list.length) % this.list.length; this.applyConfig(); this.speak(); },
    add() {
        const character = { id: crypto.randomUUID?.() || `character-${Date.now()}`, name: `CHARACTER ${(State.meta.characters?.length || 0) + 1}`, imageUrl: '', enabled: true, x: 0, y: 0, scale: 1, dialogues: ['New resonance connected.'] };
        State.meta.characters.push(character); this.index = this.list.indexOf(character); DB.save(); this.applyConfig();
    },
    remove() {
        if ((State.meta.characters || []).length <= 1) return alert('At least one character is required.');
        if (!confirm(`Remove ${this.current.name}?`)) return;
        State.meta.characters = State.meta.characters.filter(character => character !== this.current); this.index = 0; DB.save(); this.applyConfig();
    },
    editName() { const value = prompt('Character Name:', this.current?.name || ''); if (value) { this.current.name = value.trim(); DB.save(); this.applyConfig(); } },
    editAsset() { const value = prompt('Character Image URL / Relative Path:', this.current?.imageUrl || ''); if (value !== null) { this.current.imageUrl = value.trim(); DB.save(); this.applyConfig(); } },
    editDialogues() { const value = prompt('Dialogues separated by |', (this.current?.dialogues || []).join('|')); if (value !== null) { this.current.dialogues = value.split('|').map(line => line.trim()).filter(Boolean); DB.save(); } },
    speak() {
        const lines = this.current?.dialogues; if (!lines || lines.length === 0) return;
        const line = lines[Math.floor(Math.random() * lines.length)];
        const box = document.getElementById('dialogueBox');
        document.getElementById('dialogueText').innerText = line;
        box.classList.remove('hidden');
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => box.classList.add('hidden'), 4000);
    }
};

const ChartPolicy = {
    ordinaryEntry(song) {
        if (!song?.difficulties) return null;
        if (State.isWhimsyCat) {
            return song.difficulties.WMS !== undefined ? { song, diff: 'WMS', val: song.difficulties.WMS, fallback: false } : null;
        }
        const requested = State.filterDiff;
        if (requested === 'HYP') {
            if (song.difficulties.HYP !== undefined) return { song, diff: 'HYP', val: song.difficulties.HYP, fallback: false };
            if (song.difficulties.MET !== undefined) return { song, diff: 'MET', val: song.difficulties.MET, fallback: true };
            return null;
        }
        return song.difficulties[requested] !== undefined
            ? { song, diff: requested, val: song.difficulties[requested], fallback: false }
            : null;
    },
    levelEntries(song) {
        return CHART_KEYS
            .filter(diff => song?.difficulties?.[diff] !== undefined)
            .map(diff => ({ song, diff, val: song.difficulties[diff], fallback: false }));
    }
};

const DifficultyFilter = {
    select(diff) {
        if (!CHART_KEYS.includes(diff)) return;
        State.filterDiff = diff;
        if (!State.isLevelCat) {
            const entry = ChartPolicy.ordinaryEntry(State.currentSong);
            if (entry) State.currDiff = entry.diff;
            else State.currSongId = null;
        }
        this.render();
        Render.songList();
    },
    render() {
        const bar = document.getElementById('chartFilterBar');
        if (!bar) return;
        bar.classList.toggle('level-mode', State.isLevelCat || State.isWhimsyCat);
        const visibleDiff = State.isWhimsyCat ? 'WMS' : State.filterDiff;
        bar.querySelectorAll('[data-diff]').forEach(button => button.classList.toggle('active', button.dataset.diff === visibleDiff));
        const help = document.getElementById('chartFilterHelp');
        let baseText = '';
        if (State.isLevelCat) baseText = 'ALL CHARTS / DUPLICATES ENABLED';
        else if (State.isWhimsyCat) baseText = 'WMS CHARTS ONLY';
        else if (State.filterDiff === 'HYP') baseText = 'HYP / MET FALLBACK';
        else baseText = `${State.filterDiff} CHARTS ONLY`;
        help.dataset.baseText = baseText;
        help.innerText = baseText;
    }
};

const QuickPack = {
    render() {
        const select = document.getElementById('quickPackSelect');
        if (!select) return;
        select.innerHTML = '';
        State.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.innerText = category;
            option.selected = category === State.currCat;
            select.appendChild(option);
        });
    },
    select(category) {
        if (!State.categories.includes(category)) return;
        State.currCat = category;
        State.sortMode = State.isLevelCat ? 'level_desc' : (category === 'All Songs' ? 'pack' : 'subgroup');
        Preview.stop();
        this.render(); DifficultyFilter.render(); Render.songList();
    },
    step(direction) {
        const index = Math.max(0, State.categories.indexOf(State.currCat));
        this.select(State.categories[(index + direction + State.categories.length) % State.categories.length]);
    }
};

const PackScroller = {
    initialized: false,
    init() {
        if (this.initialized) return;
        this.initialized = true;
        const container = document.querySelector('#scene-category .scroll-container');
        document.getElementById('packScrollPrev').onclick = () => this.step(-1);
        document.getElementById('packScrollNext').onclick = () => this.step(1);
        container.addEventListener('scroll', () => this.refresh(), { passive: true });
        container.addEventListener('wheel', event => {
            if (container.scrollWidth <= container.clientWidth || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            event.preventDefault();
            container.scrollBy({ left: event.deltaY, behavior: 'smooth' });
        }, { passive: false });
        window.addEventListener('resize', () => this.refresh(), { passive: true });
    },
    cards() { return Array.from(document.querySelectorAll('#categoryGrid .cat-card')); },
    activeIndex() {
        const container = document.querySelector('#scene-category .scroll-container');
        const cards = this.cards();
        if (!cards.length) return 0;
        const center = container.scrollLeft + container.clientWidth / 2;
        return cards.reduce((best, card, index) => {
            const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
            return distance < best.distance ? { index, distance } : best;
        }, { index: 0, distance: Infinity }).index;
    },
    step(direction) {
        const cards = this.cards();
        if (!cards.length) return;
        const index = Math.max(0, Math.min(cards.length - 1, this.activeIndex() + direction));
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        window.setTimeout(() => this.refresh(), 280);
    },
    refresh() {
        const cards = this.cards();
        const index = this.activeIndex();
        document.getElementById('packPosition').innerText = `${String(cards.length ? index + 1 : 0).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
        document.getElementById('packScrollPrev').disabled = !cards.length || index <= 0;
        document.getElementById('packScrollNext').disabled = !cards.length || index >= cards.length - 1;
    }
};

const ChartSelection = {
    select(entry, { autoplay = true, scroll = false } = {}) {
        if (!entry?.song) return;
        const changedSong = State.currSongId !== entry.song.id;
        State.currSongId = entry.song.id;
        State.currDiff = entry.diff;
        Render.songList();
        Preview.select(entry.song, autoplay && changedSong);
        if (scroll) requestAnimationFrame(() => {
            const key = `${entry.song.id}::${entry.diff}`;
            const row = Array.from(document.querySelectorAll('.song-row')).find(element => element.dataset.entryKey === key);
            row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
};

const RandomSelect = {
    pick() {
        const pool = State.visibleEntries || [];
        if (!pool.length) return;
        const currentKey = `${State.currSongId}::${State.currDiff}`;
        const alternatives = pool.length > 1 ? pool.filter(entry => `${entry.song.id}::${entry.diff}` !== currentKey) : pool;
        const entry = alternatives[Math.floor(Math.random() * alternatives.length)];
        State.lastRandomKey = `${entry.song.id}::${entry.diff}`;
        ChartSelection.select(entry, { autoplay: true, scroll: true });
    }
};

const Preview = {
    audio: new Audio(), songId: null, playing: false, muted: false, looping: false, fadeTimer: null, requestToken: 0,
    init() {
        this.audio.preload = 'metadata';
        this.audio.addEventListener('timeupdate', () => this.onTime());
        this.audio.addEventListener('ended', () => this.restart());
        this.audio.addEventListener('play', () => { this.playing = true; this.render(); });
        this.audio.addEventListener('pause', () => { this.playing = false; this.render(); });
        this.audio.addEventListener('error', () => {
            this.playing = false;
            this.render('PREVIEW UNAVAILABLE');
        });
    },
    get config() {
        const song = State.currentSong;
        if (State.currDiff === 'WMS' && song && Object.hasOwn(song, 'WMS_previewUrl')) {
            return { url: song.WMS_previewUrl || '', start: 0, end: null, source: song.WMS_previewUrl ? 'iTunes' : '', sourceUrl: song.WMS_previewSourceUrl || '' };
        }
        return song?.preview || {};
    },
    get externalOnly() {
        // Store API samples are promotional assets, not licensed game-loop audio.
        return this.config.source === 'iTunes' || /\.itunes\.apple\.com\//i.test(this.config.url || '');
    },
    async select(song, autoplay = true) {
        if (!song) return this.stop();
        const key = `${song.id}::${this.config.url || ''}`;
        if (this.songId !== key) {
            this.stop(true);
            this.songId = key;
        }
        const token = ++this.requestToken;
        this.render();
        if (autoplay && this.config.url && !this.muted && !this.externalOnly) await this.play(token);
    },
    async play(token = ++this.requestToken) {
        const song = State.currentSong;
        const config = this.config;
        if (!config.url || this.muted || this.externalOnly) return this.render();
        let resolved = config.url;
        try { resolved = new URL(config.url, location.href).href; } catch {}
        if (this.audio.src !== resolved) {
            this.audio.src = config.url;
            this.audio.load();
        }
        const begin = async () => {
            if (token !== this.requestToken || State.currentSong?.id !== song.id || this.muted) return;
            const start = Math.max(0, Number(config.start) || 0);
            const end = this.endTime();
            if (this.audio.currentTime < start || this.audio.currentTime >= end) this.audio.currentTime = start;
            this.audio.volume = 0;
            try {
                await this.audio.play();
                if (token === this.requestToken) this.fadeTo(1, 650);
            }
            catch { this.render('TAP TO PREVIEW'); }
        };
        if (this.audio.readyState >= 1) await begin();
        else this.audio.addEventListener('loadedmetadata', begin, { once: true });
    },
    pause() { this.requestToken += 1; this.fadeTo(0, 260, () => this.audio.pause()); },
    stop(immediate = false) {
        this.requestToken += 1;
        clearInterval(this.fadeTimer);
        if (!immediate && !this.audio.paused) return this.fadeTo(0, 220, () => this.resetAudio());
        this.resetAudio();
    },
    resetAudio() {
        this.audio.pause();
        this.audio.removeAttribute('src');
        this.audio.load();
        this.playing = false;
        this.render();
    },
    fadeTo(target, duration, done) {
        clearInterval(this.fadeTimer);
        const origin = this.audio.volume;
        const steps = Math.max(1, Math.ceil(duration / 40));
        let step = 0;
        this.fadeTimer = setInterval(() => {
            step += 1;
            this.audio.volume = Math.max(0, Math.min(1, origin + (target - origin) * (step / steps)));
            if (step >= steps) { clearInterval(this.fadeTimer); done?.(); }
        }, 40);
    },
    endTime() {
        const requested = Number(this.config.end);
        const duration = Number.isFinite(this.audio.duration) ? this.audio.duration : Infinity;
        return requested > Number(this.config.start || 0) ? Math.min(requested, duration) : duration;
    },
    onTime() {
        if (!this.playing) return;
        const start = Math.max(0, Number(this.config.start) || 0);
        const end = this.endTime();
        const duration = Math.max(.1, end - start);
        const elapsed = Math.max(0, this.audio.currentTime - start);
        if (Number.isFinite(end) && end - this.audio.currentTime < .8 && end > this.audio.currentTime) this.audio.volume = Math.max(.04, (end - this.audio.currentTime) / .8);
        if (this.audio.currentTime >= end) this.restart();
        document.getElementById('previewProgress').style.width = `${Math.min(100, elapsed / duration * 100)}%`;
        document.getElementById('previewStatus').innerText = `${this.time(elapsed)} / ${this.time(duration)} · LOOP`;
    },
    restart() {
        if (this.looping || this.muted || !this.config.url) return;
        const token = this.requestToken;
        this.looping = true;
        this.audio.currentTime = Math.max(0, Number(this.config.start) || 0);
        this.audio.volume = 0;
        this.audio.play().then(() => { if (token === this.requestToken) this.fadeTo(1, 650); }).catch(() => {});
        setTimeout(() => { this.looping = false; }, 160);
    },
    toggle() {
        if (this.externalOnly) {
            if (/^https:\/\/music\.apple\.com\//i.test(this.config.sourceUrl || '')) window.open(this.config.sourceUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        this.playing ? this.pause() : this.play();
    },
    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) this.stop();
        const icon = document.querySelector('#audioToggle i');
        icon.className = this.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        document.getElementById('audioToggle').classList.toggle('active', this.muted);
        this.render();
    },
    time(seconds) { return Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '--:--'; },
    render(message) {
        const button = document.getElementById('previewToggle');
        if (!button) return;
        const available = this.externalOnly ? /^https:\/\/music\.apple\.com\//i.test(this.config.sourceUrl || '') : Boolean(this.config.url);
        button.disabled = !available;
        button.classList.toggle('playing', this.playing);
        button.querySelector('i').className = this.externalOnly ? 'fa-solid fa-arrow-up-right-from-square' : this.playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
        button.title = this.externalOnly ? '在 Apple Music 打开官方试听，不作为站内循环音频' : 'Play / pause authorized preview';
        if (!this.playing) document.getElementById('previewProgress').style.width = '0%';
        document.getElementById('previewStatus').innerText = message || (available ? (this.externalOnly ? '官方试听 ↗ APPLE MUSIC' : this.muted ? 'PREVIEW MUTED' : 'READY · FADE / LOOP') : 'NO AUDIO');
        const source = document.getElementById('previewSource');
        const sourceUrl = this.config.sourceUrl || '';
        const safeSource = /^https?:\/\//i.test(sourceUrl);
        source.classList.toggle('hidden', !safeSource);
        if (safeSource) source.href = sourceUrl;
    }
};

const Render = {
    categoryError() {
        const grid = document.getElementById('categoryGrid');
        grid.innerHTML = `
            <div class="category-error" role="alert">
                <span>ARCHIVE DATA INTERRUPTED</span>
                <button type="button" onclick="Render.categoryGrid()">RETRY</button>
            </div>`;
        document.getElementById('catCount').innerText = 'ARCHIVE LOAD ERROR';
        PackScroller.refresh();
    },
    categoryGrid() {
        const grid = document.getElementById('categoryGrid');
        grid.innerHTML = '';
        const allChartCount = State.songs.reduce((sum, song) => sum + CHART_KEYS.filter(key => song.difficulties?.[key] !== undefined).length, 0);
        State.categories.forEach((cat, index) => {
            const card = document.createElement('div');

            const scopedSongs = cat === 'All Songs' || cat === 'Level'
                ? State.songs
                : cat === 'Favorites'
                    ? State.songs.filter(song => UserState.has(song.id))
                    : cat === 'WHIMSY'
                        ? State.songs.filter(song => song.difficulties.WMS !== undefined)
                        : State.songs.filter(song => song.category === cat);
            const songCount = scopedSongs.length;
            const chartCount = cat === 'WHIMSY'
                ? songCount
                : scopedSongs.reduce((sum, song) => sum + CHART_KEYS.filter(key => song.difficulties?.[key] !== undefined).length, 0);

            let stackClass = '';
            if (songCount > 8) stackClass = 'stack-3';
            else if (songCount > 4) stackClass = 'stack-2';
            
            card.className = `cat-card tilted ${stackClass} ${cat === 'Level' ? 'level-card' : ''}`;
            card.dataset.packIndex = String(index);
            card.style.setProperty('--r', Utils.randomTilt());
            
            const meta = State.meta.catMeta[cat] || {};
            const fallbackSongCover = scopedSongs[0]?.coverUrl || (['All Songs', 'Level'].includes(cat) ? State.songs[0]?.coverUrl : '');
            const cover = [meta.cover, DEFAULT_CAT_COVERS[cat], fallbackSongCover].find(url => Utils.isBrowserAsset(url)) || '';
            const isContain = meta.fit === 'contain';
            const isVirtual = ['All Songs', 'Favorites', 'Level', 'WHIMSY'].includes(cat);
            const tools = isVirtual ? '' : `
                <div class="cat-tools dev-only hidden">
                    <button class="btn-mini" data-action="prev" aria-label="Move pack left"><i class="fa-solid fa-arrow-left"></i></button>
                    <button class="btn-mini" data-action="edit" aria-label="Edit pack"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-mini" data-action="delete" aria-label="Delete pack"><i class="fa-solid fa-trash"></i></button>
                    <button class="btn-mini" data-action="next" aria-label="Move pack right"><i class="fa-solid fa-arrow-right"></i></button>
                </div>`;
            
            card.innerHTML = `
                <img class="cat-img ${isContain ? 'fit-contain' : ''}" src="${Utils.escapeHTML(cover)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                <div class="cat-index"><span>ARCHIVE ${String(index + 1).padStart(2, '0')}</span><span>${isVirtual ? 'SYSTEM' : 'PACK'}</span></div>
                <div class="cat-info">
                    <div class="cnt">${songCount} SONGS // ${chartCount} CHARTS</div>
                    <h3>${Utils.escapeHTML(cat)}</h3>
                    <div class="cat-subtitle">${Utils.escapeHTML(meta.sub || '')}</div>
                </div>
                ${tools}
            `;
            const image = card.querySelector('.cat-img');
            const placeholder = document.createElement('div');
            placeholder.className = 'cat-placeholder';
            placeholder.innerText = cat;
            card.prepend(placeholder);
            if (!cover) { image.classList.add('image-error'); card.classList.add('image-fallback'); }
            image.onerror = () => { image.classList.add('image-error'); card.classList.add('image-fallback'); };
            image.onload = () => card.classList.remove('image-fallback');
            card.querySelector('.cat-tools')?.addEventListener('click', event => {
                event.stopPropagation();
                const action = event.target.closest('[data-action]')?.dataset.action;
                if (action === 'prev') CatOps.move(cat, -1);
                if (action === 'next') CatOps.move(cat, 1);
                if (action === 'edit') CatOps.edit(cat);
                if (action === 'delete') CatOps.delete(cat);
            });
            card.onclick = () => { State.currCat = cat; SceneManager.switch('music'); };
            grid.appendChild(card);
        });
        document.getElementById('catCount').innerText = `${State.songs.length} SONGS // ${allChartCount} CHARTS // ${State.categories.length} ARCHIVES`;
        DevUI.sync();
        requestAnimationFrame(() => PackScroller.refresh());
    },

    songList() {
        const list = document.getElementById('songList');
        const filter = document.getElementById('searchInput').value.normalize('NFKC').trim().toLocaleLowerCase();
        list.innerHTML = '';
        const isFlatMode = State.sortMode === 'flat_alpha';
        document.getElementById('listCatName').innerText = State.isLevelCat ? 'LEVEL INDEX' : State.currCat;
        document.getElementById('listCatSub').innerText = State.isLevelCat
            ? 'ALL CHARTS / CONSTANT ORDER'
            : State.currCat === 'Favorites'
                ? 'PERSONAL FAVORITES'
                : (State.meta.catMeta[State.currCat]?.sub || (isFlatMode ? 'TITLE A→Z' : ''));

        let rawItems = State.songs.filter(s => {
            if (State.isLevelCat || State.currCat === 'All Songs') return true;
            if (State.currCat === 'Favorites') return UserState.has(s.id);
            if (State.currCat === 'WHIMSY') return s.difficulties.WMS !== undefined;
            return s.category === State.currCat;
        });

        let displayItems = State.isLevelCat
            ? rawItems.flatMap(song => ChartPolicy.levelEntries(song))
            : rawItems.map(song => ChartPolicy.ordinaryEntry(song)).filter(Boolean);

        const displayFields = item => {
            const { song, diff } = item;
            const title = diff === 'HYP' ? (song.hyperTitle || song.title) : diff === 'WMS' ? (song.difficulties.WMS_alias || song.title) : song.title;
            const artist = diff === 'HYP' ? (song.difficulties.HYP_artist || song.artist) : diff === 'WMS' ? (song.difficulties.WMS_artist || song.artist) : song.artist;
            return [song.title, song.alias, song.artist, title, artist, song.category, song.subgroup, song.hidden ? 'HIDDEN' : '', diff, item.val, item.fallback ? 'HYP MET FALLBACK' : '']
                .map(value => String(value || '').normalize('NFKC').toLocaleLowerCase());
        };
        if (filter) displayItems = displayItems.filter(item => displayFields(item).some(value => value.includes(filter)));

        if (State.sortMode === 'pack') {
            displayItems.sort((a, b) => {
                const idxA = State.categories.indexOf(a.song.category);
                const idxB = State.categories.indexOf(b.song.category);
                return idxA - idxB || (a.song.subgroup || '').localeCompare(b.song.subgroup || '', 'zh-CN', { numeric: true }) || a.song.title.localeCompare(b.song.title, 'zh-CN');
            });
        } else if (State.sortMode === 'subgroup') {
             displayItems.sort((a, b) => {
                const sa = a.song.subgroup || 'ZZZ';
                const sb = b.song.subgroup || 'ZZZ';
                const ca = a.song.category || '';
                const cb = b.song.category || '';
                const va = a.diff === 'WMS' ? Infinity : Number(a.val || 0);
                const vb = b.diff === 'WMS' ? Infinity : Number(b.val || 0);
                const order = (Number.isFinite(a.song.packOrder) ? a.song.packOrder : Infinity) - (Number.isFinite(b.song.packOrder) ? b.song.packOrder : Infinity);

                if (State.currCat === 'All Songs') {
                    return ca.localeCompare(cb) || sa.localeCompare(sb) || order || va - vb || a.song.title.localeCompare(b.song.title);
                }

                return sa.localeCompare(sb, 'zh-CN', { numeric: true }) || order || va - vb || a.song.title.localeCompare(b.song.title, 'zh-CN');
             });
        } else if (State.sortMode === 'flat_alpha') {
            displayItems.sort((a, b) => a.song.title.localeCompare(b.song.title, 'zh-CN', { numeric: true }));
        } else {
            displayItems.sort((a, b) => {
                let vA = a.diff === 'WMS' ? Infinity : Number(a.val);
                let vB = b.diff === 'WMS' ? Infinity : Number(b.val);
                const primary = State.sortMode === 'level_desc' ? vB - vA : vA - vB;
                return primary || a.song.title.localeCompare(b.song.title, 'zh-CN') || CHART_KEYS.indexOf(a.diff) - CHART_KEYS.indexOf(b.diff);
            });
        }

        State.visibleEntries = displayItems;
        const visibleSongCount = new Set(displayItems.map(item => item.song.id)).size;
        const help = document.getElementById('chartFilterHelp');
        const baseText = help.dataset.baseText || help.innerText || 'CHART FILTER';
        help.innerText = `${baseText} · ${visibleSongCount} SONGS / ${displayItems.length} CHARTS`;
        const randomButton = document.getElementById('randomSelect');
        randomButton.disabled = displayItems.length === 0 || State.batchMode;
        randomButton.title = State.batchMode ? 'RANDOM DISABLED IN BATCH MODE' : (displayItems.length ? `RANDOM FROM ${displayItems.length} CHARTS` : 'NO CHARTS TO RANDOMIZE');

        const currentVisible = displayItems.some(item => item.song.id === State.currSongId && item.diff === State.currDiff);
        if (!State.batchMode && !currentVisible) {
            const first = displayItems[0];
            if (first) {
                State.currSongId = first.song.id;
                State.currDiff = first.diff;
                Preview.select(first.song, false);
            } else {
                State.currSongId = null;
                Preview.stop();
            }
        }

        if (!displayItems.length) {
            State.currSongId = null;
            Preview.stop();
            list.innerHTML = '<div class="empty-list">NO CHARTS IN THE CURRENT FILTER<br>CHANGE PACK, DIFFICULTY OR SEARCH</div>';
            Render.emptyDetail();
            DevUI.sync();
            return;
        }

        const groups = Object.create(null);
        const groupOrder = [];

        displayItems.forEach(item => {
            const { song, diff, val } = item;
            let headerText = '';
            
            if (State.sortMode.startsWith('level')) {
                if (diff === 'WMS') headerText = 'WHIMSIES';
                else headerText = `LEVEL ${Utils.formatRough(val)}`;
            } else if (State.sortMode === 'pack') {
                headerText = song.category;
            } else if (State.sortMode === 'subgroup') {
                if (State.currCat === 'All Songs') {
                    headerText = `${song.category}: ${song.subgroup || 'OTHERS'}`;
                } else {
                    headerText = song.subgroup || 'OTHERS';
                }
            } else if (State.sortMode === 'flat_alpha') {
                const initial = song.title.trim().charAt(0).toUpperCase();
                headerText = /[A-Z0-9]/.test(initial) ? initial : '其他';
            }

            if (!groups[headerText]) {
                groups[headerText] = [];
                groupOrder.push(headerText);
            }
            groups[headerText].push(item);
        });

        groupOrder.forEach(headerText => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'list-group';
            
            const header = document.createElement('div');
            header.className = 'group-header';
            header.innerHTML = `<span>${State.sortMode.startsWith('level') ? headerText : Utils.escapeHTML(headerText)}<small> · ${groups[headerText].length} CHARTS</small></span>`;
            header.onclick = () => groupDiv.classList.toggle('collapsed');
            groupDiv.appendChild(header);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'group-content';

            groups[headerText].forEach(item => {
                const { song, diff, val } = item;
                const div = document.createElement('div');
                const isActive = State.currSongId === song.id && State.currDiff === diff; 
                const isSel = State.selectedSongs.has(song.id);
                const isHyp = diff === 'HYP';
                
                div.className = `song-row ${isActive ? 'active' : ''} ${isSel ? 'selected' : ''} ${isHyp && isActive ? 'hyp-active' : ''}`;
                div.dataset.fallback = item.fallback ? 'true' : 'false';
                div.dataset.songId = song.id;
                div.dataset.difficulty = diff;
                div.dataset.entryKey = `${song.id}::${diff}`;
                div.dataset.favorite = UserState.has(song.id) ? 'true' : 'false';
                
                let displayTitle = song.title;
                if (diff === 'HYP' && song.hyperTitle) {
                    displayTitle = song.hyperTitle;
                } else if (diff === 'WMS' && song.difficulties.WMS_alias) {
                    displayTitle = song.difficulties.WMS_alias;
                }
                const valStr = State.isPrecise ? Utils.formatPrecise(val) : Utils.formatRough(val);
                const color = CONFIG.colors[diff] || '#888';
                
                div.style.setProperty('--hl-solid', color);
                div.style.setProperty('--hl-bg', Utils.glassColor(color));

                div.innerHTML = `
                    <div class="s-meta">
                        ${song.subgroup || item.fallback ? `<span class="s-subgroup">${Utils.escapeHTML(song.subgroup || 'OTHERS')}${item.fallback ? ' · HYP→MET FALLBACK' : ''}</span>` : ''}
                        <span class="s-title">${Utils.escapeHTML(displayTitle)}${song.hidden ? '<small class="hidden-mark">HIDDEN</small>' : ''}${UserState.has(song.id) ? '<i class="fa-solid fa-star favorite-mark" title="Favorite"></i>' : ''}</span>
                    </div>
                    <div class="s-info">
                        <div class="rate-box">
                            <span class="rb-name">${diff}</span>
                            <span class="rb-val">${valStr}</span>
                        </div>
                    </div>
                `;
                div.onclick = () => {
                    if (State.batchMode) BatchOps.toggleSelection(song.id);
                    else ChartSelection.select(item, { autoplay: true });
                };
                contentDiv.appendChild(div);
            });

            groupDiv.appendChild(contentDiv);
            list.appendChild(groupDiv);
        });

        Render.songDetail();
        DevUI.sync();
    },

    emptyDetail() {
        const panel = document.getElementById('detailPanel');
        panel.classList.add('empty');
        document.getElementById('detailBg').style.backgroundImage = 'none';
        const cover = document.getElementById('detailCover');
        cover.removeAttribute('src');
        cover.classList.add('image-error');
        document.getElementById('detailTitle').innerText = 'NO CHARTS';
        document.getElementById('detailArtist').innerText = 'ADJUST THE CURRENT FILTER';
        document.getElementById('detailBpm').innerText = '—';
        document.getElementById('detailPack').innerText = '—';
        document.getElementById('detailChartCount').innerText = '0';
        document.getElementById('detailAnnotations').replaceChildren();
        document.getElementById('diffTabs').innerHTML = '';
        document.getElementById('stampLabel').innerText = 'NO DATA';
        document.getElementById('stampVal').innerText = '—';
        document.getElementById('wmsStripe').classList.add('hidden');
        document.getElementById('btnEditSong').disabled = true;
        UserState.renderFavorite();
        Preview.render();
    },

    songDetail() {
        const song = State.currentSong;
        if (!song) return;
        document.getElementById('detailPanel').classList.remove('empty');
        document.getElementById('btnEditSong').disabled = false;
        
        let dKey = State.isWhimsyCat ? 'WMS' : State.currDiff;
        if (song.difficulties[dKey] === undefined) {
             const entry = State.isLevelCat ? ChartPolicy.levelEntries(song)[0] : ChartPolicy.ordinaryEntry(song);
             dKey = entry?.diff || CHART_KEYS.find(key => song.difficulties[key] !== undefined);
        }
        if (!dKey) return;
        State.currDiff = dKey;
        const previewKey = `${song.id}::${Preview.config.url || ''}`;
        if (Preview.songId !== previewKey) Preview.select(song, false);

        const diffObj = song.difficulties;
        const dVal = diffObj[dKey];
        const color = CONFIG.colors[dKey];
        const labelFull = CONFIG.labels[dKey] || dKey;

        // Custom Alias & Cover & Artist
        let displayTitle = song.title;
        let displayCover = song.coverUrl;
        let displayArtist = song.artist;

        if (dKey === 'HYP') {
            if (song.hyperTitle) displayTitle = song.hyperTitle;
            if (diffObj.HYP_cover) displayCover = diffObj.HYP_cover;
            if (diffObj.HYP_artist) displayArtist = diffObj.HYP_artist;
        } else if (dKey === 'WMS') {
            if (diffObj.WMS_alias) displayTitle = diffObj.WMS_alias;
            if (diffObj.WMS_cover) displayCover = diffObj.WMS_cover;
            if (diffObj.WMS_artist) displayArtist = diffObj.WMS_artist;
        }

        document.getElementById('detailTitle').innerText = displayTitle;
        document.getElementById('detailArtist').innerText = displayArtist;
        document.getElementById('detailBpm').innerText = song.bpm ?? '—';
        const extra = document.getElementById('detailAnnotations');
        const duration = dKey === 'WMS' ? (song.WMS_durationMs || song.durationMs) : song.durationMs;
        extra.replaceChildren();
        for (const text of [song.hidden ? 'HIDDEN' : '', dKey === 'WMS' && diffObj.WMS === '全' ? 'FULL VERSION' : '', song.alias || '', duration ? `${Math.floor(duration / 60000)}:${String(Math.floor(duration / 1000) % 60).padStart(2, '0')}` : ''].filter(Boolean)) {
            const tag = document.createElement('span'); tag.textContent = text; extra.appendChild(tag);
        }
        document.getElementById('detailPack').innerText = song.category;
        document.getElementById('detailChartCount').innerText = CHART_KEYS.filter(key => song.difficulties[key] !== undefined).length;
        const detailCover = document.getElementById('detailCover');
        const usableCover = Utils.isBrowserAsset(displayCover) ? displayCover : '';
        detailCover.classList.toggle('image-error', !usableCover);
        let triedFallback = false;
        detailCover.onerror = () => {
            if (!triedFallback && Utils.isBrowserAsset(song.coverFallbackUrl) && song.coverFallbackUrl !== displayCover) {
                triedFallback = true; detailCover.src = song.coverFallbackUrl;
                document.getElementById('detailBg').style.backgroundImage = 'none';
                return;
            }
            detailCover.classList.add('image-error'); document.getElementById('detailBg').style.backgroundImage = 'none';
        };
        detailCover.onload = () => detailCover.classList.remove('image-error');
        if (usableCover) detailCover.src = usableCover;
        else detailCover.removeAttribute('src');
        document.getElementById('detailBg').style.backgroundImage = usableCover ? `url("${String(usableCover).replaceAll('"', '%22')}")` : 'none';

        const stamp = document.getElementById('ratingStamp');
        stamp.style.color = color;
        
        if (dKey === 'HYP') stamp.classList.add('hyp-style');
        else stamp.classList.remove('hyp-style');
        
         // 如果是 WMS 难度，添加专门的样式类
        if (dKey === 'WMS') stamp.classList.add('wms-style');
        else stamp.classList.remove('wms-style');

        let displayVal = Utils.formatRough(dVal);
        if (dKey === 'WMS' && typeof dVal === 'string') displayVal = Utils.escapeHTML(dVal);
        else if (State.isPrecise) displayVal = Utils.formatPrecise(dVal);

        document.getElementById('stampLabel').innerText = labelFull;
        document.getElementById('stampVal').innerHTML = displayVal;

        const tabs = document.getElementById('diffTabs');
        tabs.innerHTML = '';
        ['NUL', 'PHM', 'DEC', 'MET', 'HYP', 'WMS'].forEach(k => {
            if (State.isWhimsyCat && k !== 'WMS') return;
            if (song.difficulties[k] === undefined && (k === 'HYP' || k === 'WMS')) return;
            if (song.difficulties[k] === undefined) return;

            const btn = document.createElement('div');
            btn.className = `d-tab ${k === dKey ? 'active' : ''}`;
            btn.dataset.type = k;
            
            const kColor = CONFIG.colors[k];
            btn.style.setProperty('--col-ref', kColor);
            btn.style.setProperty('--tab-bg', Utils.glassColor(kColor));
            
            let tabVal = song.difficulties[k];
            let tabValStr = Utils.formatRough(tabVal);
            if (k === 'WMS' && typeof tabVal === 'string') tabValStr = Utils.escapeHTML(tabVal);

            btn.innerHTML = `
                <span class="d-tab-name">${k}</span>
                <span class="d-tab-val">${tabValStr}</span>
            `;
            btn.onclick = () => {
                if (State.isLevelCat) {
                    State.currDiff = k;
                    Render.songList();
                } else if (!State.isWhimsyCat) {
                    DifficultyFilter.select(k);
                }
            };
            tabs.appendChild(btn);
        });
        
        document.querySelector('.jacket-wrap').style.setProperty('--r', Utils.randomTilt());
        document.getElementById('wmsStripe').classList.toggle('hidden', dKey !== 'WMS');
        UserState.renderFavorite();
        Preview.render();
    }
};

const CatOps = {
    move(cat, dir) { 
        if (cat === 'All Songs' || cat === 'Favorites' || cat === 'Level' || cat === 'Original' || cat === 'WHIMSY') return;
        const metaArr = State.meta.catOrder;
        const metaIdx = metaArr.indexOf(cat);
        if (metaIdx > -1) {
            const swapIdx = metaIdx + dir;
            if (swapIdx >= 0 && swapIdx < metaArr.length) {
                const targetCat = metaArr[swapIdx];
                if (!['All Songs', 'Favorites', 'Level', 'Original', 'WHIMSY'].includes(targetCat)) {
                    [metaArr[metaIdx], metaArr[swapIdx]] = [metaArr[swapIdx], metaArr[metaIdx]];
                    DB.save(); Render.categoryGrid();
                }
            }
        }
    },
    edit(cat) { CatEditor.open(cat); },
    delete(cat) {
        if (cat === 'All Songs' || cat === 'Favorites' || cat === 'Level' || cat === 'Original' || cat === 'WHIMSY') return alert("Protected.");
        if (State.songs.some(s => s.category === cat)) return alert("Not empty.");
        if (confirm(`Delete ${cat}?`)) {
            State.meta.catOrder = State.meta.catOrder.filter(c => c !== cat);
            delete State.meta.catMeta[cat];
            DB.save(); Render.categoryGrid();
        }
    }
};

const CatEditor = {
    targetCat: null,
    open(cat) {
        this.targetCat = cat;
        const meta = State.meta.catMeta[cat] || {};
        document.getElementById('catEditModal').classList.add('open');
        document.getElementById('oldCatName').value = cat;
        document.getElementById('catName').value = cat;
        document.getElementById('catSub').value = meta.sub || "";
        document.getElementById('catCover').value = meta.cover || "";
        
        const fit = meta.fit || "cover";
        const radios = document.getElementsByName('catFit');
        for(const r of radios) r.checked = (r.value === fit);
    },
    close() { document.getElementById('catEditModal').classList.remove('open'); },
    async magicSearch() {
        const term = document.getElementById('catName').value;
        if(!term) return;
        const btn = document.querySelector('#catEditModal .btn-magic i');
        btn.className = "fa-solid fa-spinner fa-spin";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=10`, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP_${res.status}`);
            const data = await res.json();
            const normalize = value => String(value).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
            const match = data.results?.find(app => normalize(app.trackName) === normalize(term));
            if (match?.artworkUrl512) {
                document.getElementById('catCover').value = match.artworkUrl512;
            } else {
                alert("No game icon found. Try web search.");
            }
        } catch { alert("Search error."); }
        finally { clearTimeout(timeout); btn.className = "fa-solid fa-gamepad"; }
    },
    delete() { CatOps.delete(this.targetCat); this.close(); },
    save(e) {
        if(e) e.preventDefault();
        const oldName = document.getElementById('oldCatName').value;
        const newName = document.getElementById('catName').value;
        if(!newName) return;
        if (['All Songs', 'Favorites', 'Level', 'WHIMSY'].includes(newName) && newName !== oldName) return alert('This archive name is reserved.');

        // Update Name
        if (newName !== oldName) {
            State.songs.forEach(s => { if(s.category === oldName) s.category = newName; });
            const idx = State.meta.catOrder.indexOf(oldName);
            if (idx > -1) State.meta.catOrder[idx] = newName;
            State.meta.catMeta[newName] = State.meta.catMeta[oldName] || {};
            delete State.meta.catMeta[oldName];
        }

        const meta = State.meta.catMeta[newName] || {};
        meta.sub = document.getElementById('catSub').value;
        meta.cover = document.getElementById('catCover').value;
        const radios = document.getElementsByName('catFit');
        for(const r of radios) if(r.checked) meta.fit = r.value;
        
        State.meta.catMeta[newName] = meta;
        DB.save(); Render.categoryGrid(); this.close();
    }
};

const BatchOps = {
    renderUI() {
        document.getElementById('batchBar').classList.add('hidden');
    },
    toggle(enable) {
        State.batchMode = enable;
        if (!enable) State.selectedSongs.clear();
        document.getElementById('batchBar').classList.toggle('hidden', !enable);
        Render.songList();
    },
    toggleSelection(id) {
        if (State.selectedSongs.has(id)) State.selectedSongs.delete(id);
        else State.selectedSongs.add(id);
        document.getElementById('batchCount').innerText = `${State.selectedSongs.size} SELECTED`;
        Render.songList();
    },
    delete() {
        if (confirm(`Delete ${State.selectedSongs.size} items?`)) {
            State.songs = State.songs.filter(s => !State.selectedSongs.has(s.id));
            DB.save(); this.toggle(false);
        }
    },
    move() {
        const target = prompt("Target Category Name:");
        if (target) {
            State.songs.forEach(s => { if(State.selectedSongs.has(s.id)) s.category = target; });
            DB.save(); this.toggle(false);
        }
    }
};

const Editor = {
    mode: 'song', targetId: null,
    init() {
        Juni.init();
        PackScroller.init();
        document.getElementById('devToggle').onclick = () => {
            State.devMode = !State.devMode;
            const scene = document.querySelector('.scene.active').id;
            if(scene === 'scene-menu') {
                Juni.applyConfig();
            }
            if(scene === 'scene-category') Render.categoryGrid();
            if(scene === 'scene-music') Render.songList();
            DevUI.sync();
        };

        // Modal triggers
        document.getElementById('btnEditSong').onclick = () => { if (State.currentSong) this.openSongModal(State.currentSong); };
        document.getElementById('favoriteToggle').onclick = () => UserState.toggle();
        document.getElementById('randomSelect').onclick = () => RandomSelect.pick();
        document.getElementById('editForm').onsubmit = (e) => this.save(e);
        document.getElementById('catForm').onsubmit = (e) => CatEditor.save(e);
        
        // Import/Export
        document.getElementById('btnImport').onclick = () => document.getElementById('importFile').click();
        document.getElementById('importFile').onchange = (e) => {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if(data.songs) State.songs = DB.normalizeSongs(data.songs);
                    if(data.meta) State.meta = DB.buildMeta(data.meta);
                    DB.save();
                    location.reload();
                } catch(e) { alert("Invalid JSON"); }
            };
            reader.readAsText(file);
        };
        
        // Export the generated data bundle without altering the application source.
        document.getElementById('btnExportJS').onclick = () => {
            const seed = { songs: State.songs, meta: State.meta };
            const blob = new Blob([`globalThis.QUALITHM_SEED = ${JSON.stringify(seed, null, 2)};\n`], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = 'seed-fallback.js'; link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };

        document.getElementById('btnDelete').onclick = () => this.delete();
        document.getElementById('checkHYP').onchange = (e) => {
            const enabled = e.target.checked;
            document.getElementById('valHYP').disabled = !enabled;
            document.getElementById('titleHYP').disabled = !enabled;
            document.getElementById('artistHYP').disabled = !enabled;
            document.getElementById('coverHYP').disabled = !enabled;
        };
        document.getElementById('checkWMS').onchange = (e) => {
            const enabled = e.target.checked;
            document.getElementById('valWMS').disabled = !enabled;
            document.getElementById('aliasWMS').disabled = !enabled;
            document.getElementById('artistWMS').disabled = !enabled;
            document.getElementById('coverWMS').disabled = !enabled;
        };
        document.getElementById('sortToggle').onclick = () => {
            if (State.isLevelCat) {
                State.sortMode = State.sortMode === 'level_desc' ? 'level_asc' : 'level_desc';
            } else {
                const modes = ['subgroup', 'pack', 'flat_alpha', 'level_desc', 'level_asc'];
                State.sortMode = modes[(modes.indexOf(State.sortMode) + 1) % modes.length];
            }
            Render.songList();
        };
        document.getElementById('quickPackSelect').onchange = event => QuickPack.select(event.target.value);
        document.getElementById('quickPackPrev').onclick = () => QuickPack.step(-1);
        document.getElementById('quickPackNext').onclick = () => QuickPack.step(1);
        document.getElementById('chartFilterOptions').onclick = event => {
            const button = event.target.closest('[data-diff]');
            if (button && !State.isLevelCat && !State.isWhimsyCat) DifficultyFilter.select(button.dataset.diff);
        };
    },
    addCategory() {
        const name = prompt("New Category Name:");
        const reserved = ['All Songs', 'Favorites', 'Level', 'WHIMSY'];
        if(name && !reserved.includes(name) && !State.meta.catOrder.includes(name)) {
            State.meta.catOrder.push(name);
            State.meta.catMeta[name] = {};
            DB.save(); Render.categoryGrid();
        }
    },
    editDialogues() {
        const txt = prompt("Enter dialogues separated by |", State.meta.dialogues.join('|'));
        if (txt) { State.meta.dialogues = txt.split('|'); DB.save(); }
    },
    editGlobalAssets(type) {
        const url = prompt("Juni Image URL:", State.meta.juniUrl);
        if(url) { State.meta.juniUrl = url; DB.save(); Juni.applyConfig(); }
    },
    openSongModal(s) {
        if (!s) return;
        this.targetId = s.id;
        document.getElementById('editModal').classList.add('open');
        document.getElementById('editTitle').value = s.title;
        document.getElementById('editArtist').value = s.artist;
        document.getElementById('editCover').value = s.coverUrl;
        document.getElementById('editBpm').value = s.bpm;
        document.getElementById('editSubgroup').value = s.subgroup || '';
        document.getElementById('editAlias').value = s.alias || '';
        document.getElementById('editPackOrder').value = s.packOrder ?? '';
        document.getElementById('editHidden').checked = s.hidden === true;
        document.getElementById('editWMSPreviewUrl').value = s.WMS_previewUrl || '';
        document.getElementById('editPreviewUrl').value = s.preview?.url || '';
        document.getElementById('editPreviewStart').value = s.preview?.start || 0;
        document.getElementById('editPreviewEnd').value = s.preview?.end || '';
        this.previewCandidate = null;
        
        ['NUL', 'PHM', 'DEC', 'MET'].forEach(k => document.getElementById(`val${k}`).value = s.difficulties[k] || '');
        
        // HYP
        const hasHyp = !!s.difficulties.HYP;
        document.getElementById('checkHYP').checked = hasHyp;
        document.getElementById('valHYP').value = hasHyp ? s.difficulties.HYP : '';
        document.getElementById('titleHYP').value = s.hyperTitle || '';
        document.getElementById('artistHYP').value = s.difficulties.HYP_artist || '';
        document.getElementById('coverHYP').value = s.difficulties.HYP_cover || '';
        
        document.getElementById('valHYP').disabled = !hasHyp;
        document.getElementById('titleHYP').disabled = !hasHyp;
        document.getElementById('artistHYP').disabled = !hasHyp;
        document.getElementById('coverHYP').disabled = !hasHyp;

        // WMS
        const hasWms = !!s.difficulties.WMS;
        document.getElementById('checkWMS').checked = hasWms;
        document.getElementById('valWMS').value = hasWms ? s.difficulties.WMS : '';
        document.getElementById('aliasWMS').value = s.difficulties.WMS_alias || '';
        document.getElementById('artistWMS').value = s.difficulties.WMS_artist || '';
        document.getElementById('coverWMS').value = s.difficulties.WMS_cover || '';

        document.getElementById('valWMS').disabled = !hasWms;
        document.getElementById('aliasWMS').disabled = !hasWms;
        document.getElementById('artistWMS').disabled = !hasWms;
        document.getElementById('coverWMS').disabled = !hasWms;
    },
    save(e) {
        e.preventDefault();
        const s = State.songs.find(x => x.id === this.targetId);
        if(s) {
            s.title = document.getElementById('editTitle').value;
            s.artist = document.getElementById('editArtist').value;
            s.coverUrl = document.getElementById('editCover').value;
            const bpmInput = document.getElementById('editBpm').value.trim();
            s.bpm = bpmInput === '' ? null : Number.isFinite(Number(bpmInput)) ? Number(bpmInput) : bpmInput;
            s.subgroup = document.getElementById('editSubgroup').value;
            s.alias = document.getElementById('editAlias').value.trim();
            s.hidden = document.getElementById('editHidden').checked;
            const packOrder = Number(document.getElementById('editPackOrder').value);
            if (Number.isSafeInteger(packOrder) && packOrder > 0) s.packOrder = packOrder;
            else delete s.packOrder;
            const wmsPreview = document.getElementById('editWMSPreviewUrl').value.trim();
            if (wmsPreview !== (s.WMS_previewUrl || '')) delete s.WMS_previewSourceUrl;
            if (wmsPreview || Object.hasOwn(s, 'WMS_previewUrl')) s.WMS_previewUrl = wmsPreview;
            const previewStart = Math.max(0, parseFloat(document.getElementById('editPreviewStart').value) || 0);
            const rawPreviewEnd = parseFloat(document.getElementById('editPreviewEnd').value);
            const previousPreviewUrl = s.preview?.url || '';
            s.preview = {
                ...(s.preview || {}),
                url: document.getElementById('editPreviewUrl').value.trim(),
                start: previewStart,
                end: Number.isFinite(rawPreviewEnd) && rawPreviewEnd > previewStart ? rawPreviewEnd : null
            };
            delete s.previewUrl; delete s.previewStart; delete s.previewEnd;
            if (this.previewCandidate && s.preview.url === this.previewCandidate.previewUrl) {
                s.preview.source = 'iTunes';
                s.preview.sourceUrl = this.previewCandidate.trackViewUrl || '';
            } else if (s.preview.url !== previousPreviewUrl) {
                delete s.preview.source;
                delete s.preview.sourceUrl;
            }
            
            ['NUL', 'PHM', 'DEC', 'MET'].forEach(k => {
                const v = parseFloat(document.getElementById(`val${k}`).value);
                if(!isNaN(v)) s.difficulties[k] = v;
            });

            // HYP Logic
            if(document.getElementById('checkHYP').checked) {
                s.difficulties.HYP = parseFloat(document.getElementById('valHYP').value) || 15;
                const hTitle = document.getElementById('titleHYP').value;
                const hArtist = document.getElementById('artistHYP').value;
                const hCover = document.getElementById('coverHYP').value;
                
                if(hTitle) s.hyperTitle = hTitle; else delete s.hyperTitle;
                if(hArtist) s.difficulties.HYP_artist = hArtist; else delete s.difficulties.HYP_artist;
                if(hCover) s.difficulties.HYP_cover = hCover; else delete s.difficulties.HYP_cover;
            } else {
                delete s.difficulties.HYP;
                delete s.hyperTitle;
                delete s.difficulties.HYP_artist;
                delete s.difficulties.HYP_cover;
            }

            // WMS Logic
            if(document.getElementById('checkWMS').checked) {
                s.difficulties.WMS = document.getElementById('valWMS').value || '?';
                const wAlias = document.getElementById('aliasWMS').value;
                const wArtist = document.getElementById('artistWMS').value;
                const wCover = document.getElementById('coverWMS').value;
                
                if(wAlias) s.difficulties.WMS_alias = wAlias; else delete s.difficulties.WMS_alias;
                if(wArtist) s.difficulties.WMS_artist = wArtist; else delete s.difficulties.WMS_artist;
                if(wCover) s.difficulties.WMS_cover = wCover; else delete s.difficulties.WMS_cover;
            } else {
                delete s.difficulties.WMS;
                delete s.difficulties.WMS_alias;
                delete s.difficulties.WMS_artist;
                delete s.difficulties.WMS_cover;
            }

            DB.save(); Preview.stop(true); Preview.songId = null; Render.songList(); Render.songDetail(); Editor.close();
        }
    },
    addSong() {
        const cat = ['All Songs', 'Favorites', 'Level', 'WHIMSY'].includes(State.currCat) ? 'Original' : State.currCat;
        const newSong = fillLowDiffs({ 
            id: crypto.randomUUID(), title: 'NEW', artist: '', category: cat, 
            difficulties: {...CONFIG.defaultDifficulties}, preview: { url: '', start: 0, end: null }
        });
        State.songs.push(newSong); DB.save(); this.openSongModal(newSong);
    },
    async magicSearch() {
        const btn = document.querySelector('#editModal .f-group .btn-magic i');
        btn.className = "fa-solid fa-spinner fa-spin";
        try {
            const candidates = await this.itunesSearch();
            const track = this.chooseCandidate(candidates, 'Select cover candidate');
            if (!track) return;
            if (track.artworkUrl100) document.getElementById('editCover').value = track.artworkUrl100.replace('100x100bb', '600x600bb');
            if (!document.getElementById('editArtist').value && track.artistName) document.getElementById('editArtist').value = track.artistName;
        } catch (error) {
            alert(navigator.onLine ? 'No reliable match found. Existing value was kept.' : 'Offline. Use a local relative path or retry later.');
        } finally {
            btn.className = "fa-solid fa-wand-magic-sparkles";
        }
    },
    async magicPreviewSearch() {
        const icon = document.querySelector('#btnPreviewMagic i');
        icon.className = 'fa-solid fa-spinner fa-spin';
        document.getElementById('btnPreviewMagic').disabled = true;
        try {
            const candidates = await this.itunesSearch();
            const track = this.chooseCandidate(candidates, 'Select preview candidate');
            if (!track?.previewUrl) return alert('This candidate has no preview audio.');
            document.getElementById('editPreviewUrl').value = track.previewUrl;
            document.getElementById('editPreviewStart').value = 0;
            document.getElementById('editPreviewEnd').value = '';
            this.previewCandidate = track;
        } catch (error) {
            alert(navigator.onLine ? 'Preview lookup failed. Your current URL was kept.' : 'Offline. You can still use a local audio path.');
        } finally {
            icon.className = 'fa-solid fa-music';
            document.getElementById('btnPreviewMagic').disabled = false;
        }
    },
    supplementPreviews() {
        const entries = DB.previewSupplements(State.songs);
        if (!entries.length) return alert('没有可补全的空白试听。已有 URL、区间或修改过曲名／作者的曲目不会覆盖。');
        if (!confirm(`为 ${entries.length} 首曲目补全已核对的 Apple 试听？仅写入空白试听，不修改其他歌曲数据。当前编辑器中尚未保存的试听输入会保留。`)) return;
        for (const { song, seed } of entries) {
            song.preview = { ...seed.preview };
            song.previewEdition = seed.previewEdition || '';
        }
        DB.save();
        const current = entries.find(entry => entry.song.id === this.targetId);
        if (current && !document.getElementById('editPreviewUrl').value.trim()) {
            document.getElementById('editPreviewUrl').value = current.song.preview.url;
            document.getElementById('editPreviewStart').value = 0;
            document.getElementById('editPreviewEnd').value = '';
        }
        Preview.stop(true); Preview.songId = null; Render.songDetail();
        alert(`已补全 ${entries.length} 首试听。`);
    },
    async itunesSearch() {
        const title = document.getElementById('editTitle').value.trim();
        const artist = document.getElementById('editArtist').value.trim();
        if (!title) throw new Error('TITLE_REQUIRED');
        const song = State.songs.find(s => s.id === this.targetId);
        const matches = await MetadataLookup.search({ title, artist, category: song?.category, alias: song?.alias });
        if (!matches.length) throw new Error('NO_RELIABLE_MATCH');
        return matches;
    },
    chooseCandidate(candidates, heading) {
        if (!candidates?.length) return null;
        const lines = candidates.map((track, index) => `${index + 1}. ${track.trackName} — ${track.artistName}${track.collectionName ? ` / ${track.collectionName}` : ''}`);
        const selected = prompt(`${heading}\n\n${lines.join('\n')}\n\nEnter 1-${candidates.length}; Cancel keeps existing data.`, '1');
        if (selected === null) return null;
        const index = Number(selected) - 1;
        return candidates[index] || null;
    },
    webSearch() {
        const term = document.getElementById('editTitle').value;
        if(!term) return;
        window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(term + ' Rhythm Game')}`, '_blank');
    },
    delete() { if(confirm("Delete song?")) { State.songs = State.songs.filter(s => s.id !== this.targetId); DB.save(); Render.songList(); Editor.close(); } },
    close() { document.getElementById('editModal').classList.remove('open'); }
};

document.getElementById('themeToggle').onclick = Utils.toggleTheme;
document.getElementById('audioToggle').onclick = () => Preview.toggleMute();
document.getElementById('previewToggle').onclick = () => Preview.toggle();
document.getElementById('dlDataBtn').onclick = Utils.exportData;
document.getElementById('preciseToggle').onclick = function() {
    State.isPrecise = !State.isPrecise;
    this.classList.toggle('active', State.isPrecise);
    Render.songList(); Render.songDetail();
};
document.getElementById('searchInput').addEventListener('input', () => Render.songList());
window.addEventListener('DOMContentLoaded', async () => {
    ViewportManager.init();
    Preview.init();
    UserState.init();
    await DB.init();
    Editor.init();
    SceneManager.switch('menu');
});
