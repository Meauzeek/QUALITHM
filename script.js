/* =========================================
   CONFIG
   ========================================= */
const DIFF_CONFIG = {
    NUL: { label: 'NULL', colorVar: '--c-null' },
    PHM: { label: 'PHANTOM', colorVar: '--c-phantom' },
    DEC: { label: 'DECAY', colorVar: '--c-decay' },
    MET: { label: 'META', colorVar: '--c-meta' },
    HYP: { label: 'HYPER', colorVar: '--c-hyper-acc' },
    WMS: { label: 'WHIMSY', colorVar: '--c-whimsy-bor' }
};

const SEED_DATA_TEXT = `
Category: maimai DX
Panopticon (MET 14.4, HYP 15.1)
躯樹の墓守 (MET 15.7)
raputa (MET 15.9)
sølips (MET 14.9, HYP 16.3)
CYCLES (MET 12.4, HYP 14.0)
Caliburne Story of the Legendary sword (MET 15.6)
AMAZING MIGHTYYYY!!!! (MET 15.8)
AFTER PANDORA (MET 15.2)
Selector (MET 13.9)
渦状銀河のシンフォニエッタ (MET 15.5)
World's end loneliness (MET 16.0)
ヨミビトシラズ (MET 14.8) -> Ref:rain. (HYP 15.2)

Category: CHUNITHM
白庭 (MET 13.8)
TECHNOPOLIS 2085 (MET 14.5, HYP 15.0)
Everything Will Be One (MET 15.6)
macrocosmos (MET 16.1)
再生不能 (MET 13.4)
Scythe of Death (MET 14.9, HYP 15.7)
The Metaverse (MET 16.2)
TiamaT: F minor (MET 15.5) -> TiamaT: F minor -Zeit Ende- (HYP 16.0)

Category: O.N.G.E.K.I.
Event Horizon (MET 12.8)
FLUFFY FLASH (MET 14.3, HYP 15.2)
Diamond Dust (MET 15.4)
girls.exe (MET 15.5, HYP 16.0)
Opfer (MET 14.9) -> Opfer 有栖の生贄 (HYP 15.7)
MeteorSnow (MET 15.3, HYP 15.8)
Apollo (MET 15.9, HYP 16.2)
怨撃 (MET 14.4, HYP 16.0)

Category: Arcaea
Hotarubi no Yuki (MET 13.3)
ultradiaxon-N3 (MET 14.4)
To the Milky Way (MET 15.5)
Aegleseeker (MET 16.1)
魔王 (World Ender) (MET 13.8, HYP 15.8)
ANDORXOR (MET 14.7, HYP 15.7)
Astral Quantization (MET 15.4)
多次元宇宙融合論 (MET 16.2)
`;

/* =========================================
   STATE
   ========================================= */
const State = {
    songs: [],
    categories: [],
    currentCategory: null,
    currentSongId: null,
    currentDifficulty: 'MET',
    devMode: false
};

/* =========================================
   DATA & UTILS
   ========================================= */
const Utils = {
    // Generate random float between min and max for CSS tilts
    randomTilt() {
        return (Math.random() * 4 - 2).toFixed(2) + 'deg';
    },

    formatLevel(val) {
        if (!val) return '0';
        // Check if value is a string (For Whimsy labels like "狂")
        if (typeof val === 'string') return val;

        const intPart = Math.floor(val);
        const decPart = val - intPart;
        const roundedDec = Math.round(decPart * 10) / 10;
        return roundedDec >= 0.5 ? `${intPart}+` : `${intPart}`;
    },

    getSongTitle(song, diff) {
        if (diff === 'HYP' && song.hyperTitle) return song.hyperTitle;
        return song.title;
    }
};

const DataManager = {
    init() {
        const stored = localStorage.getItem('QUALITHM_DB_V2');
        if (stored) {
            State.songs = JSON.parse(stored);
            this.extractCategories();
        } else {
            this.parseSeedData();
            this.save();
        }
    },

    save() {
        localStorage.setItem('QUALITHM_DB_V2', JSON.stringify(State.songs));
        this.extractCategories();
    },

    extractCategories() {
        const cats = new Set(State.songs.map(s => s.category));
        State.categories = ['All Songs', ...Array.from(cats)];
    },

    parseSeedData() {
        // Same parsing logic as before, extended implicitly by Editor
        const lines = SEED_DATA_TEXT.trim().split('\n').filter(l => l.trim() !== '');
        let currentCat = 'Original';
        let parsedSongs = [];

        lines.forEach(line => {
            if (line.startsWith('Category:')) {
                currentCat = line.replace('Category:', '').trim();
                return;
            }
            // Basic Parse (Simplified for brevity, same regex logic as previous answer)
            const parts = line.split('->');
            const mainPart = parts[0].trim();
            const hyperPart = parts[1] ? parts[1].trim() : null;
            const match = mainPart.match(/^(.*)\s\((.*)\)$/);

            if (match) {
                const song = {
                    id: crypto.randomUUID(),
                    title: match[1].trim(),
                    artist: "Unknown Artist", 
                    category: currentCat,
                    bpm: 150 + Math.floor(Math.random()*50),
                    coverUrl: `https://placehold.co/400x400/eeeeee/333333?text=${encodeURIComponent(match[1].trim().substring(0,2))}`,
                    difficulties: { NUL: 1.0, PHM: 5.0, DEC: 10.0 },
                    hyperTitle: null
                };
                this.parseDiffString(match[2], song.difficulties);

                if (hyperPart) {
                    const hyperMatch = hyperPart.match(/^(.*)\s\((.*)\)$/);
                    if (hyperMatch) {
                        song.hyperTitle = hyperMatch[1].trim();
                        this.parseDiffString(hyperMatch[2], song.difficulties);
                    }
                }
                parsedSongs.push(song);
            }
        });
        State.songs = parsedSongs;
        this.extractCategories();
    },

    parseDiffString(str, targetObj) {
        str.split(',').forEach(item => {
            const [type, val] = item.trim().split(' ');
            if (type && val) targetObj[type] = parseFloat(val);
        });
    }
};

/* =========================================
   RENDERER
   ========================================= */
const Renderer = {
    renderCategories() {
        const grid = document.getElementById('categoryGrid');
        grid.innerHTML = '';
        State.categories.forEach((cat, idx) => {
            const card = document.createElement('div');
            card.className = 'cat-card tilted-element';
            card.style.setProperty('--r', Utils.randomTilt()); // Random Tilt
            card.innerHTML = `<div class="idx">0${idx}</div><div>${cat}</div>`;
            card.onclick = () => {
                State.currentCategory = cat;
                SceneManager.switch('music');
            };
            grid.appendChild(card);
        });
    },

    renderSongList() {
        const list = document.getElementById('songList');
        const filter = document.getElementById('searchInput').value.toLowerCase();
        list.innerHTML = '';

        let songsToRender = State.songs;
        if (State.currentCategory !== 'All Songs') {
            songsToRender = songsToRender.filter(s => s.category === State.currentCategory);
        }
        if (filter) {
            songsToRender = songsToRender.filter(s => 
                s.title.toLowerCase().includes(filter) || s.artist.toLowerCase().includes(filter)
            );
        }

        document.getElementById('countDisplay').innerText = songsToRender.length.toString().padStart(2, '0');

        songsToRender.forEach(song => {
            const div = document.createElement('div');
            // Check if current diff exists, else fallback
            let val = song.difficulties[State.currentDifficulty];
            if (!val && State.currentDifficulty === 'HYP') val = null; 
            
            const displayVal = val ? Utils.formatLevel(val) : '-';
            
            div.className = `song-row ${State.currentSongId === song.id ? 'active' : ''}`;
            div.style.setProperty('--r', Utils.randomTilt()); // Subtle tilt for list items
            
            div.innerHTML = `
                <span class="song-title">${song.title}</span>
                <span class="song-level-tag">${displayVal}</span>
            `;
            div.onclick = () => {
                State.currentSongId = song.id;
                this.renderSongList(); 
                this.renderSongDetails();
            };
            list.appendChild(div);
        });

        // Auto select
        if (!State.currentSongId && songsToRender.length > 0) {
            State.currentSongId = songsToRender[0].id;
            this.renderSongList();
            this.renderSongDetails();
        }
    },

    renderSongDetails() {
        const song = State.songs.find(s => s.id === State.currentSongId);
        if (!song) return;

        // Fallback logic: If on HYP/WMS but song doesn't have it, switch to MET
        if ((State.currentDifficulty === 'HYP' && !song.difficulties.HYP) ||
            (State.currentDifficulty === 'WMS' && !song.difficulties.WMS)) {
            State.currentDifficulty = 'MET';
        }

        // DOM
        const els = {
            cover: document.getElementById('detailCover'),
            title: document.getElementById('detailTitle'),
            artist: document.getElementById('detailArtist'),
            bpm: document.getElementById('detailBpm'),
            diffBadge: document.getElementById('detailDiffBadge'),
            diffLabel: document.getElementById('diffLabel'),
            diffVal: document.getElementById('diffVal'),
            tabs: document.getElementById('diffTabs'),
            stage: document.querySelector('.jacket-stage'),
            detailZone: document.querySelector('.detail-zone')
        };

        // Data Fill
        els.title.innerText = Utils.getSongTitle(song, State.currentDifficulty);
        els.artist.innerText = song.artist;
        els.bpm.innerText = song.bpm;
        els.cover.src = song.coverUrl;

        // Badge
        const rawLevel = song.difficulties[State.currentDifficulty];
        els.diffVal.innerText = Utils.formatLevel(rawLevel);
        els.diffLabel.innerText = State.currentDifficulty;
        els.diffBadge.style.color = `var(${DIFF_CONFIG[State.currentDifficulty].colorVar})`;

        // Styles for Special Modes
        els.stage.classList.remove('hyper-active', 'whimsy-active');
        if (State.currentDifficulty === 'HYP') els.stage.classList.add('hyper-active');
        if (State.currentDifficulty === 'WMS') els.stage.classList.add('whimsy-active');

        // TABS RENDER
        els.tabs.innerHTML = '';
        const order = ['NUL', 'PHM', 'DEC', 'MET', 'HYP', 'WMS'];
        
        order.forEach(key => {
            // Logic: Show NUL-MET always. Show HYP/WMS only if they exist OR we are in Dev Mode (so we can see we don't have them yet?)
            // Actually, for UI, show HYP/WMS only if exist. Dev mode adds them via modal, not by clicking an empty tab.
            const hasDiff = song.difficulties.hasOwnProperty(key);
            
            if (!hasDiff) return;

            const btn = document.createElement('button');
            const dConf = DIFF_CONFIG[key];
            btn.className = `tab-btn ${State.currentDifficulty === key ? 'active' : ''}`;
            btn.dataset.type = key;
            btn.style.setProperty('--t-col', `var(${dConf.colorVar})`);
            btn.innerText = key;
            
            btn.onclick = () => {
                State.currentDifficulty = key;
                this.renderSongDetails();
                this.renderSongList();
            };
            els.tabs.appendChild(btn);
        });
        
        // Tilt Effect for Jacket
        els.stage.style.setProperty('--r', Utils.randomTilt());
    }
};

/* =========================================
   SCENE & EDITOR
   ========================================= */
const SceneManager = {
    switch(sceneName) {
        document.querySelectorAll('.scene').forEach(el => el.classList.remove('active'));
        document.getElementById(`scene-${sceneName}`).classList.add('active');
        
        if (sceneName === 'category') Renderer.renderCategories();
        if (sceneName === 'music') Renderer.renderSongList();
    }
};

const Editor = {
    init() {
        // Toggle Dev Mode
        document.getElementById('devToggle').onclick = () => {
            State.devMode = !State.devMode;
            document.getElementById('devToggle').style.opacity = State.devMode ? '1' : '0.4';
            document.getElementById('btnEditSong').classList.toggle('hidden', !State.devMode);
        };

        // Open Modal
        document.getElementById('btnEditSong').onclick = () => {
            const song = State.songs.find(s => s.id === State.currentSongId);
            if (!song) return;
            
            document.getElementById('editId').value = song.id;
            document.getElementById('editTitle').value = Utils.getSongTitle(song, State.currentDifficulty);
            document.getElementById('editArtist').value = song.artist;
            document.getElementById('editCover').value = song.coverUrl;

            // Handle Difficulty Inputs
            const level = song.difficulties[State.currentDifficulty];
            // If current view is WMS, put the string in WMS Label, else put number in Level
            if (State.currentDifficulty === 'WMS') {
                 document.getElementById('editWmsLabel').value = level || '';
                 document.getElementById('editLevel').value = 0;
            } else {
                 document.getElementById('editLevel').value = (typeof level === 'number') ? level : 0;
                 document.getElementById('editWmsLabel').value = '';
            }

            // Checkbox States
            const hasHyp = song.difficulties.hasOwnProperty('HYP');
            const hasWms = song.difficulties.hasOwnProperty('WMS');
            
            document.getElementById('checkHyp').checked = hasHyp;
            document.getElementById('checkWms').checked = hasWms;
            
            this.toggleWmsInput(hasWms);

            document.getElementById('editModal').classList.add('open');
        };

        // WMS Toggle Listener
        document.getElementById('checkWms').addEventListener('change', (e) => {
            this.toggleWmsInput(e.target.checked);
        });

        // Save
        document.getElementById('editForm').onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('editId').value;
            const song = State.songs.find(s => s.id === id);
            
            if (song) {
                // Basic Info
                if (State.currentDifficulty === 'HYP') song.hyperTitle = document.getElementById('editTitle').value;
                else song.title = document.getElementById('editTitle').value;
                
                song.artist = document.getElementById('editArtist').value;
                song.coverUrl = document.getElementById('editCover').value;

                // Difficulty Value Update
                // Only update the CURRENT viewing difficulty value from the inputs
                if (State.currentDifficulty === 'WMS') {
                    song.difficulties.WMS = document.getElementById('editWmsLabel').value;
                } else {
                    song.difficulties[State.currentDifficulty] = parseFloat(document.getElementById('editLevel').value);
                }

                // Handle HYP Enable/Disable
                const hypChecked = document.getElementById('checkHyp').checked;
                if (hypChecked && !song.difficulties.HYP) song.difficulties.HYP = 15.0; // Default seed
                if (!hypChecked && song.difficulties.HYP) delete song.difficulties.HYP;

                // Handle WMS Enable/Disable
                const wmsChecked = document.getElementById('checkWms').checked;
                // If checking WMS, we need to read the label input, if it's empty give default
                if (wmsChecked) {
                    const label = document.getElementById('editWmsLabel').value || '?';
                    song.difficulties.WMS = label;
                } else if (!wmsChecked && song.difficulties.WMS) {
                    delete song.difficulties.WMS;
                }

                // Logic: If we disabled the difficulty we are currently looking at, switch to MET
                if (State.currentDifficulty === 'HYP' && !hypChecked) State.currentDifficulty = 'MET';
                if (State.currentDifficulty === 'WMS' && !wmsChecked) State.currentDifficulty = 'MET';

                DataManager.save();
                Renderer.renderSongList();
                Renderer.renderSongDetails();
                this.close();
            }
        };
    },

    toggleWmsInput(show) {
        const group = document.getElementById('wmsGroup');
        if (show) group.classList.remove('hidden');
        else group.classList.add('hidden');
    },

    close() {
        document.getElementById('editModal').classList.remove('open');
    }
};

/* =========================================
   BOOTSTRAP
   ========================================= */
window.addEventListener('DOMContentLoaded', () => {
    DataManager.init();
    Editor.init();
});