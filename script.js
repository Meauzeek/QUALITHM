/* =========================================
   CONFIG & UTILS
   ========================================= */
const CONFIG = {
    colors: {
        NUL: '#ff7f50', PHM: '#d4af37', DEC: '#2e8b57',
        MET: '#8a2be2', HYP: '#d500ff', WMS: '#888888'
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

const Utils = {
    randomTilt: () => (Math.random() * 4 - 2).toFixed(2) + 'deg',
    formatRough(val) {
        if (typeof val === 'string') return val;
        if (val === 999) return 'WHIMSY'; 
        if (!val && val !== 0) return '-';
        const int = Math.floor(val);
        return (val - int) >= 0.5 ? `${int}<span class="plus-symbol">+</span>` : `${int}`;
    },
    formatPrecise: (val) => {
        if (typeof val === 'string') return val;
        if (val === 999) return '???';
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

// Seed data
const SEED_SONGS = [
    {
        "id": "m1",
        "title": "Panopticon",
        "artist": "Cybermiso",
        "category": "maimai DX",
        "subgroup": "PHASE I",
        "bpm": 110,
        "coverUrl": "https://i1.sndcdn.com/artworks-000341810658-de9jx3-t500x500.jpg",
        "difficulties": {
            "NUL": 4,
            "MET": 14.4,
            "HYP": 15.1,
            "PHM": 8,
            "DEC": 12.1
        }
    },
    {
        "id": "m2",
        "title": "躯樹の墓守",
        "artist": "隣の庭は青い(庭師+Aoi)",
        "category": "maimai DX",
        "subgroup": "PHASE II",
        "bpm": 211,
        "coverUrl": "https://static.wikia.nocookie.net/maimai/images/b/b0/202202103_mms_tgskeleton.png/revision/latest?cb=20220323162633&path-prefix=zh",
        "difficulties": {
            "MET": 15.7,
            "NUL": 6,
            "PHM": 11,
            "DEC": 13.6,
            "WMS": "墓"
        }
    },
    {
        "id": "m3",
        "title": "raputa",
        "artist": "sasakure.UK & TJ.hangneil",
        "category": "maimai DX",
        "subgroup": "PHASE II",
        "bpm": 339,
        "coverUrl": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2f/d5/b9/2fd5b9b0-dd98-fd37-de0b-9fc48b076295/3617222440230_cover.png/600x600bb.jpg",
        "difficulties": {
            "MET": 15.8,
            "NUL": 7.5,
            "PHM": 10.4,
            "DEC": 14,
            "HYP": 16.1
        }
    },
    {
        "id": "m4",
        "title": "sølips",
        "artist": "rintaro soma",
        "category": "maimai DX",
        "subgroup": "PHASE II",
        "bpm": 199,
        "coverUrl": "https://i.namu.wiki/i/gvwQ7tGvRxoNNTWZwbbBgC2hC4UHIlzpl2nIpszFooQi-_Tb24mnZVu6BSDfSxKfN2GPuLMWEN0865dZUM1L_w.webp",
        "difficulties": {
            "MET": 14.9,
            "HYP": 16.3,
            "WMS": "我",
            "NUL": 8.2,
            "PHM": 11.5,
            "DEC": 14
        }
    },
    {
        "id": "m5",
        "title": "CYCLES",
        "artist": "Masayoshi Minoshima feat. Ayakura Mei",
        "category": "maimai DX",
        "subgroup": "PHASE I",
        "bpm": 135,
        "coverUrl": "https://storage.moegirl.org.cn/moegirl/commons/9/9a/MaiSong_cycles.jpg",
        "difficulties": {
            "MET": 12.4,
            "HYP": 14,
            "NUL": 1,
            "PHM": 6,
            "DEC": 8.9
        }
    },
    {
        "id": "m6",
        "title": "Caliburne ~Story of the Legendary sword~",
        "artist": "Project Grimoire",
        "category": "maimai DX",
        "subgroup": "PHASE I",
        "bpm": 190,
        "coverUrl": "https://storage.moegirl.org.cn/moegirl/commons/f/f8/Maisong_caliburne.jpg",
        "difficulties": {
            "MET": 15.6,
            "NUL": 3,
            "PHM": 7,
            "DEC": 12.9
        }
    },
    {
        "id": "m7",
        "title": "AMAZING MIGHTYYYY!!!!",
        "artist": "WAiKURO",
        "category": "maimai DX",
        "subgroup": "PHASE I",
        "bpm": 185,
        "coverUrl": "https://storage.moegirl.org.cn/moegirl/commons/d/da/Arcsong_amazing_mightyyyy.jpg",
        "difficulties": {
            "MET": 15.8,
            "WMS": "耐",
            "WMS_alias": "AMAZING MIGHTYYYY!!!! (ULT!MATE EXTENDED)",
            "WMS_cover": "https://i1.sndcdn.com/artworks-NH8x3oHEZz6MIF6C-bA7q9A-t500x500.jpg",
            "NUL": 6,
            "PHM": 10.7,
            "DEC": 13.7
        }
    },
    {
        "id": "c1",
        "title": "TiamaT: F minor",
        "hyperTitle": "TiamaT: F minor -Zeit Ende-",
        "artist": "Team Grimoire",
        "category": "CHUNITHM",
        "subgroup": "PHASE I",
        "bpm": 215,
        "coverUrl": "https://silentblue.remywiki.com/images/thumb/a/ae/TiamaT-F_minor.png/300px-TiamaT-F_minor.png",
        "difficulties": {
            "MET": 15.5,
            "HYP": 16,
            "HYP_cover": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/c5/22/91/c5229155-e643-540c-bbfc-b257b17ceb38/4571164388946_cover.jpg/600x600bb.jpg",
            "WMS": "狂",
            "NUL": 7.5,
            "PHM": 11.8,
            "DEC": 13.7
        }
    },
    {
        "id": "c2",
        "title": "白庭",
        "artist": "くるぶっこちゃん",
        "category": "CHUNITHM",
        "subgroup": "PHASE I",
        "bpm": 111,
        "coverUrl": "https://i1.sndcdn.com/artworks-rZxbLuDuukWR9tvm-Ndy3MA-t500x500.jpg",
        "difficulties": {
            "MET": 13.8,
            "NUL": 2,
            "PHM": 7,
            "DEC": 12.6
        }
    },
    {
        "id": "c3",
        "title": "TECHNOPOLIS 2085",
        "artist": "PRASTIK DANCEFLOOR",
        "category": "CHUNITHM",
        "subgroup": "PHASE I",
        "bpm": 134,
        "coverUrl": "https://sdvx.in/chunithm/06/jacket/06125.png",
        "difficulties": {
            "MET": 14.5,
            "HYP": 15,
            "NUL": 3,
            "PHM": 7.5,
            "DEC": 12.1,
            "WMS": "招"
        }
    },
    {
        "id": "c4",
        "title": "Everything Will Be One",
        "artist": "void (Mournfinale)",
        "category": "CHUNITHM",
        "subgroup": "PHASE I",
        "bpm": 170,
        "coverUrl": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/49/0d/c8/490dc8db-bbcd-fee7-da34-98908e119f7c/4550712375133_cover.png/600x600bb.jpg",
        "difficulties": {
            "MET": 15.6,
            "NUL": 5,
            "PHM": 9,
            "DEC": 13.8
        }
    },
    {
        "id": "c5",
        "title": "macrocosmos",
        "artist": "LeaF",
        "category": "CHUNITHM",
        "subgroup": "PHASE II",
        "bpm": 42,
        "coverUrl": "https://silentblue.remywiki.com/images/thumb/9/94/macrocosmos.png/300px-macrocosmos.png",
        "difficulties": {
            "MET": 15.8,
            "NUL": 7,
            "PHM": 11.2,
            "DEC": 13.9
        }
    },
    {
        "id": "c6",
        "title": "Scythe of Death",
        "artist": "Masahiro \"Godspeed\" Aoki",
        "category": "CHUNITHM",
        "subgroup": "PHASE II",
        "bpm": 130,
        "coverUrl": "https://sdvx.in/chunithm/07/jacket/07183.png",
        "difficulties": {
            "MET": 14.9,
            "HYP": 15.7,
            "NUL": 6,
            "PHM": 10.7,
            "DEC": 13.9
        }
    },
    {
        "id": "c7",
        "title": "The Metaverse -First story of the SeelischTact-",
        "artist": "CHUNITHM",
        "category": "CHUNITHM",
        "subgroup": "PHASE II",
        "bpm": 190,
        "coverUrl": "https://silentblue.remywiki.com/images/f/fc/The_Metaverse_-First_story_of_the_SeelischTact-.png",
        "difficulties": {
            "MET": 16.2,
            "NUL": 8.8,
            "PHM": 12.2,
            "DEC": 14.5
        }
    },
    {
        "id": "o1",
        "title": "Apollo",
        "artist": "ONGEKI",
        "category": "O.N.G.E.K.I.",
        "subgroup": "PHASE II",
        "bpm": 339,
        "coverUrl": "https://i.namu.wiki/i/u2kXibx_039EXVA4J_pu0sJfvEvdLfMt1JBRNzlLcZ6CiYTpG-3po1KE6Gfarsr-gAEucEJBN4x9niUwtRErvQ.webp",
        "difficulties": {
            "MET": 15.6,
            "HYP": 16,
            "NUL": 8.9,
            "PHM": 13.1,
            "DEC": 14.3
        }
    },
    {
        "id": "o2",
        "title": "Opfer",
        "hyperTitle": "Opfer ~有栖の生贄~",
        "artist": "かねこちはる",
        "category": "O.N.G.E.K.I.",
        "subgroup": "PHASE II",
        "bpm": 175,
        "coverUrl": "https://i1.sndcdn.com/artworks-000620646406-g27zvu-t1080x1080.jpg",
        "difficulties": {
            "MET": 14.9,
            "HYP": 15.7,
            "HYP_cover": "https://i.ytimg.com/vi/PhP5SUm4agw/maxresdefault.jpg",
            "NUL": 6,
            "PHM": 11.6,
            "DEC": 13.5
        }
    },
    {
        "id": "o3",
        "title": "Event Horizon",
        "artist": "5u5h1 feat. 三角 葵(CV:春野 杏)",
        "category": "O.N.G.E.K.I.",
        "subgroup": "PHASE I",
        "bpm": 135,
        "coverUrl": "https://sdvx.in/ongeki/04/jacket/04294.png",
        "difficulties": {
            "MET": 13.2,
            "NUL": 2,
            "PHM": 6,
            "DEC": 8.7
        }
    },
    {
        "id": "o4",
        "title": "FLUFFY FLASH",
        "artist": "Kobaryo",
        "category": "O.N.G.E.K.I.",
        "subgroup": "PHASE I",
        "bpm": 252,
        "coverUrl": "https://i1.sndcdn.com/artworks-VkVg5BDGgVvhwab9-OYCzcA-t1080x1080.jpg",
        "difficulties": {
            "MET": 14.7,
            "HYP": 15.5,
            "HYP_cover": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/dc/ff/a3/dcffa398-10d7-8ea8-a56e-874132f0b283/859759618345_cover.png/600x600bb.jpg",
            "NUL": 5,
            "PHM": 9.1,
            "DEC": 12.8
        },
        "hyperTitle": "FLUFFY FLASH (FLOWERING Version)"
    },
    {
        "id": "o5",
        "title": "Diamond Dust",
        "artist": "Masahiro \"Godspeed\" Aoki",
        "category": "O.N.G.E.K.I.",
        "subgroup": "PHASE I",
        "bpm": 200,
        "coverUrl": "https://i.namu.wiki/i/eK7O6yXRyBpNH5Fqrehs_5daiUdHvAbvRWQLkJuxMX5AXvGskk2CFGdLhzhvXJqEqjqF_aSbznamcZOR9fYBeg.webp",
        "difficulties": {
            "MET": 15.4,
            "NUL": 4,
            "PHM": 8.4,
            "DEC": 12.6
        }
    },
    {
        "id": "o6",
        "title": "girls.exe",
        "artist": "rintaro soma",
        "category": "O.N.G.E.K.I.",
        "subgroup": "PHASE II",
        "bpm": 188,
        "coverUrl": "https://sdvx.in/ongeki/05/jacket/05061.png",
        "difficulties": {
            "MET": 15.5,
            "HYP": 16.1,
            "NUL": 6,
            "PHM": 10.9,
            "DEC": 13.8
        }
    },
    {
        "id": "o7",
        "title": "MeteorSnow",
        "artist": "Azupiano",
        "category": "O.N.G.E.K.I.",
        "subgroup": "PHASE I",
        "bpm": 220,
        "coverUrl": "https://sdvx.in/ongeki/04/jacket/04253.png",
        "difficulties": {
            "MET": 15.8,
            "NUL": 4,
            "PHM": 9.6,
            "DEC": 14.1
        }
    },
    {
        "id": "o8",
        "title": "怨撃",
        "artist": "Shinji Hosoe",
        "category": "O.N.G.E.K.I.",
        "subgroup": "PHASE II",
        "bpm": 220,
        "coverUrl": "https://i1.sndcdn.com/artworks-OZsCJs44H1B27JBK-JCvWLg-t1080x1080.jpg",
        "difficulties": {
            "MET": 14.4,
            "HYP": 15.9,
            "WMS": "招",
            "NUL": 5,
            "PHM": 9.9,
            "DEC": 12.8,
            "WMS_alias": "怨撃·真",
            "WMS_cover": "https://cdn.gamerch.com/resize/eyJidWNrZXQiOiJnYW1lcmNoLWltZy1jb250ZW50cyIsImtleSI6Indpa2lcLzEzXC9lbnRyeVwvMTY1Njc1ODE3Ni5qcGciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjIwMCwiZml0IjoiY292ZXIifSwianBlZyI6eyJxdWFsaXR5Ijo4NX19fQ=="
        }
    },
    {
        "id": "a1",
        "title": "Aegleseeker",
        "artist": "Silentroom & Frums",
        "category": "Arcaea",
        "subgroup": "PHASE I",
        "bpm": 234,
        "coverUrl": "https://static.wikia.nocookie.net/maimai/images/9/9e/202303023_mms_aegleseeker.png/revision/latest?cb=20230423205124&path-prefix=zh",
        "difficulties": {
            "MET": 16,
            "NUL": 7.5,
            "PHM": 10.1,
            "DEC": 13.9,
            "WMS": "全",
            "WMS_cover": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/d7/dd/41/d7dd4141-1e0c-0fab-41e9-afc581ee3186/859758180157_cover.jpg/600x600bb.jpg",
            "WMS_alias": "Aegleseeker (\"Afterworld\" Full Version)"
        }
    },
    {
        "id": "a2",
        "title": "魔王 (World Ender)",
        "artist": "sasakure.UK & TJ.hangneil",
        "category": "Arcaea",
        "subgroup": "PHASE II",
        "bpm": 190,
        "coverUrl": "https://wiki.arcaea.cn/images/thumb/4/43/Songs_worldender.jpg/256px-Songs_worldender.jpg",
        "difficulties": {
            "MET": 13.8,
            "HYP": 15.8,
            "NUL": 6,
            "PHM": 9.5,
            "DEC": 12.3,
            "HYP_cover": "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f7/49/c2/f749c20e-94fe-0da8-03a7-46969fc69f7a/859758456252_cover.png/600x600bb.jpg"
        },
        "hyperTitle": "魔王"
    },
    {
        "id": "a3",
        "title": "蛍火の雪",
        "artist": "ETIA.",
        "category": "Arcaea",
        "subgroup": "PHASE I",
        "bpm": 159,
        "coverUrl": "https://static.wikia.nocookie.net/iowiro/images/3/37/Hotaru.jpg/revision/latest?cb=20240112005334",
        "difficulties": {
            "MET": 13.3,
            "NUL": 1,
            "PHM": 5,
            "DEC": 9.6
        }
    },
    {
        "id": "a4",
        "title": "ultradiaxon-N3",
        "artist": "nitro (lowiro)",
        "category": "Arcaea",
        "subgroup": "PHASE I",
        "bpm": 150,
        "coverUrl": "https://static.wikia.nocookie.net/iowiro/images/6/60/Ultradiaxon.jpg/revision/latest?cb=20240402012631",
        "difficulties": {
            "MET": 14.6,
            "NUL": 4,
            "PHM": 9.8,
            "DEC": 12.4
        }
    },
    {
        "id": "a5",
        "title": "To the Milky Way",
        "artist": "黒魔",
        "category": "Arcaea",
        "subgroup": "PHASE I",
        "bpm": 186,
        "coverUrl": "https://static.wikia.nocookie.net/iowiro/images/0/0e/Tothemilkyway.jpg/revision/latest?cb=20230927211839",
        "difficulties": {
            "MET": 15.3,
            "NUL": 5,
            "PHM": 10.3,
            "DEC": 12.7
        }
    },
    {
        "id": "a6",
        "title": "ANDORXOR",
        "artist": "Sobrem",
        "category": "Arcaea",
        "subgroup": "PHASE II",
        "bpm": 148,
        "coverUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbXuf5SNNCdBTVPLO-ESGwN0K5zbZ919P0pg&s",
        "difficulties": {
            "MET": 14.8,
            "HYP": 15.7,
            "NUL": 4,
            "PHM": 9.7,
            "DEC": 12.8
        }
    },
    {
        "id": "a7",
        "title": "Astral Quantization",
        "artist": "Dj Grimoire",
        "category": "Arcaea",
        "subgroup": "PHASE II",
        "bpm": 185,
        "coverUrl": "https://static.wikia.nocookie.net/iowiro/images/7/70/Astralq.jpg/revision/latest?cb=20241121054106",
        "difficulties": {
            "MET": 15.4,
            "WMS": "止",
            "NUL": 6,
            "PHM": 8.7,
            "DEC": 13.6
        }
    },
    {
        "id": "a8",
        "title": "多次元宇宙融合論",
        "artist": "TAKIO feat つぐ",
        "category": "Arcaea",
        "subgroup": "PHASE II",
        "bpm": 180,
        "coverUrl": "https://p2.music.126.net/veU0hhNGHEg4_V-Ny6KhsA==/109951171525664321.jpg",
        "difficulties": {
            "MET": 15.7,
            "NUL": 7,
            "PHM": 10,
            "DEC": 13.4,
            "HYP": 16.1
        }
    },
    {
        "id": "w1",
        "title": "Aleph-0",
        "artist": "LeaF",
        "category": "VARIETY",
        "subgroup": "OTHERS",
        "bpm": 250,
        "coverUrl": "https://storage.moegirl.org.cn/moegirl/commons/4/43/Aleph0.jpg",
        "difficulties": {
            "WMS": "数",
            "MET": 15,
            "HYP": 15.9,
            "NUL": 8.5,
            "PHM": 12.5,
            "DEC": 13.8
        }
    },
    {
        "NUL": 3,
        "PHM": 7,
        "DEC": 10.5,
        "id": "6f1a00cd-4ce4-4f62-92eb-2f9a83e24b2a",
        "title": "God is [In] a girl",
        "artist": "nanoViDA feat. Juno",
        "category": "Original",
        "difficulties": {
            "NUL": 7,
            "PHM": 12.9,
            "DEC": 14.5,
            "MET": 15.4,
            "HYP": 16.5,
            "WMS": "墓"
        },
        "coverUrl": "N:\\桌面归档\\Picture\\Chugekimai\\G[In]G.jpg",
        "bpm": 49,
        "subgroup": ""
    },
    {
        "NUL": 3,
        "PHM": 7,
        "DEC": 10.5,
        "id": "3d9748d0-df91-4bc2-a53c-5cb575e18620",
        "title": "再生不能",
        "artist": "ろくろ feat.鹿乃",
        "category": "CHUNITHM",
        "difficulties": {
            "NUL": 2,
            "PHM": 5,
            "DEC": 10.2,
            "MET": 13.2,
            "HYP": 14
        },
        "coverUrl": "https://i1.sndcdn.com/artworks-lWVTzQf6Oz2P7XNT-q6AqzQ-t1080x1080.jpg",
        "bpm": 236,
        "subgroup": "PHASE II"
    },
    {
        "NUL": 3,
        "PHM": 7,
        "DEC": 10.5,
        "id": "6101f682-5528-4355-b00d-a4c697cff4cc",
        "title": "ヨミビトシラズ",
        "artist": "Limonène (サノカモメ+月島春果)",
        "category": "maimai DX",
        "difficulties": {
            "NUL": 3,
            "PHM": 6,
            "DEC": 10.3,
            "MET": 13.9,
            "HYP": 15,
            "HYP_artist": "カモメサノエレクトリックオーケストラ include Limonène",
            "HYP_cover": "https://silentblue.remywiki.com/images/thumb/e/ee/Ref-rain_%28for_7th_Heaven%29.png/1024px-Ref-rain_%28for_7th_Heaven%29.png"
        },
        "coverUrl": "https://i.namu.wiki/i/AacPAKAasQ2IxiP5l_2_J99sNHbo5ZNSFTtgVPIBra_xQsNIQBxupIHK6bKfUzWgqAkMK_kBghP0QV-qRqWzRA.webp",
        "bpm": 188,
        "subgroup": "PHASE II",
        "hyperTitle": "Ref:rain (for 7th Heaven)"
    },
    {
        "NUL": 3,
        "PHM": 7,
        "DEC": 10.5,
        "id": "dd3818dd-89ee-4589-96b3-127e85a53bec",
        "title": "驟雨の狭間",
        "artist": "Silentroom",
        "category": "VARIETY",
        "difficulties": {
            "NUL": 7.5,
            "PHM": 11.9,
            "DEC": 14.2,
            "MET": 15.7,
            "HYP": 15.6
        },
        "coverUrl": "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/aa/b6/25/aab625bd-dfd6-ab26-f05c-eba093312a22/859755527009_cover.jpg/600x600bb.jpg",
        "bpm": null,
        "subgroup": ""
    },
    {
        "NUL": 3,
        "PHM": 7,
        "DEC": 10.5,
        "id": "474d5c7c-1010-49b3-8e8e-7c877f9ce0ac",
        "title": "XL TECHNO -More Dance Remix-",
        "artist": "高田聡 (from PACA PACA PASSION SPECIAL)",
        "category": "VARIETY",
        "difficulties": {
            "NUL": 2,
            "PHM": 7,
            "DEC": 14.5,
            "MET": 14.4,
            "HYP": 15.2
        },
        "coverUrl": "https://silentblue.remywiki.com/images/6/62/XL_TECHNO_-More_Dance_Remix-.png",
        "bpm": 150,
        "subgroup": "PACA PACA PASSION",
        "hyperTitle": "XL TECHNO -More Dance Remix- (Full Version)"
    },
    {
        "NUL": 3,
        "PHM": 7,
        "DEC": 10.5,
        "id": "16150cf2-714c-42aa-a075-f02da9b1d426",
        "title": "《髓星》 -Doppelkonzert für Violine und Violoncello Nr. 7, Markstern-",
        "artist": "削除 vs. virkato",
        "category": "Original",
        "difficulties": {
            "NUL": 9,
            "PHM": 13.2,
            "DEC": 15,
            "MET": 16,
            "HYP": 16.4,
            "WMS": "奏"
        },
        "coverUrl": "N:\\Edge Download\\已生成图像 (43).png",
        "bpm": 184,
        "subgroup": ""
    }
];

const SEED_META = {
    juniUrl: 'http://scpsandboxcn.wikidot.com/local--files/zampona/Juni_Kanban.png',
    juniConfig: { x: 0, y: 22, s: 1.1 },
    dialogues: [...CONFIG.defaultDialogues],
    catOrder: [],
    catMeta: {}
};

const DEFAULT_CAT_COVERS = {
    'All Songs': 'https://images.igdb.com/igdb/image/upload/t_720p/co3d6d.jpg',
    'Original': 'https://media.vgm.io/releases/87/36878/36878-1758238366.jpg',
    'maimai DX': 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/55/71/b0/5571b048-d811-a14e-51ab-f4dae0477c14/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg',
    'CHUNITHM': 'https://chunithm.sega.jp/$site/images/ogimage.jpg',
    'O.N.G.E.K.I.': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/b3/16/f9/b316f90e-9252-4e00-0968-89c85c806b22/logo_youtube_music_2024_q4_color-0-1x_U007emarketing-0-0-0-7-0-0-0-85-220-0.png/512x512bb.jpg',
    'VARIETY': 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/2c/50/00/2c5000d8-01ea-82df-767b-8d8a8e5a08ca/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/512x512bb.jpg'
};

const DB = {
    key: 'QUALITHM_DB_V8',
    async init() {
        const raw = localStorage.getItem(this.key);
        if (raw) {
            const data = JSON.parse(raw);
            State.songs = data.songs || SEED_SONGS;
            State.meta = this.buildMeta(data.meta);
        } else {
            const imported = await this.loadLocalBootstrap();
            State.songs = JSON.parse(JSON.stringify(imported?.songs || SEED_SONGS));
            State.meta = this.buildMeta(imported?.meta);
            this.save();
        }
        this.refreshCategories();
        setInterval(() => {
            const d = new Date();
            document.getElementById('sysTime').innerText = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        }, 1000);
    },
    buildMeta(meta = {}) {
        const mergedMeta = {
            ...JSON.parse(JSON.stringify(SEED_META)),
            ...meta,
            juniConfig: {
                ...SEED_META.juniConfig,
                ...(meta.juniConfig || {})
            }
        };

        if (!mergedMeta.juniUrl || mergedMeta.juniUrl.includes('placehold.co')) {
            mergedMeta.juniUrl = SEED_META.juniUrl;
        }

        return mergedMeta;
    },
    async loadLocalBootstrap() {
        try {
            const response = await fetch('./qualia_info.json', { cache: 'no-store' });
            if (!response.ok) return null;
            const data = await response.json();
            if (!data || typeof data !== 'object') return null;
            return data;
        } catch (e) {
            console.warn('qualia_info.json auto-import skipped:', e);
            return null;
        }
    },
    save() {
        localStorage.setItem(this.key, JSON.stringify({ songs: State.songs, meta: State.meta }));
        this.refreshCategories();
    },
    refreshCategories() {
        const songCats = new Set(State.songs.map(s => s.category));
        let mergedSet = new Set([...songCats, ...State.meta.catOrder]);
        let arr = Array.from(mergedSet).filter(c => c !== 'WHIMSY').sort();
        
        if (State.meta.catOrder.length > 0) {
            arr.sort((a, b) => {
                const idxA = State.meta.catOrder.indexOf(a);
                const idxB = State.meta.catOrder.indexOf(b);
                const posA = idxA === -1 ? 9999 : idxA;
                const posB = idxB === -1 ? 9999 : idxB;
                return posA - posB;
            });
        }
        
        arr = arr.filter(c => c !== 'Original' && c !== 'All Songs');
        arr.unshift('Original'); arr.unshift('All Songs');
        if (State.songs.some(s => s.difficulties.WMS)) arr.push('WHIMSY');
        
        State.categories = arr;
        if(State.meta.catOrder.length === 0) State.meta.catOrder = arr;
    }
};

const State = {
    songs: [], meta: {}, categories: [],
    currCat: null, currSongId: null, currDiff: 'MET',
    sortMode: 'level_desc', isPrecise: false, devMode: false, batchMode: false,
    selectedSongs: new Set(),
    
    get currentSong() { return this.songs.find(s => s.id === this.currSongId); },
    get isWhimsyCat() { return this.currCat === 'WHIMSY'; }
};

const SceneManager = {
    switch(id) {
        document.querySelectorAll('.scene').forEach(el => el.classList.remove('active'));
        document.getElementById(`scene-${id}`).classList.add('active');
        
        const sysInfo = document.getElementById('mainSysInfo');
        if (id === 'menu') sysInfo.classList.remove('hidden');
        else sysInfo.classList.add('hidden');

        if (id === 'menu') Juni.applyConfig();
        if (id === 'category') Render.categoryGrid();
        if (id === 'music') {
            State.batchMode = false;
            if (State.currCat === 'All Songs') {
                State.sortMode = 'level_desc';
            } else {
                State.sortMode = 'subgroup';
            }
            BatchOps.renderUI();
            Render.songList();
        }
    }
};

const Juni = {
    init() {
        this.applyConfig();
        document.getElementById('charContainer').onclick = () => { if(!State.devMode) this.speak(); };
        setInterval(() => { if (Math.random() > 0.7 && !State.devMode) this.speak(); }, 15000);
    },
    applyConfig() {
        const img = document.getElementById('heroImage');
        const cfg = State.meta.juniConfig;
        img.src = State.meta.juniUrl;
        img.style.transform = `translate(calc(-50% + ${cfg.x}px), calc(-50% + ${cfg.y}px)) scale(${cfg.s})`;
        if(State.devMode) {
            document.getElementById('juniX').value = cfg.x;
            document.getElementById('juniY').value = cfg.y;
            document.getElementById('juniS').value = cfg.s;
        }
    },
    updateConfig() {
        State.meta.juniConfig = {
            x: parseInt(document.getElementById('juniX').value),
            y: parseInt(document.getElementById('juniY').value),
            s: parseFloat(document.getElementById('juniS').value)
        };
        this.applyConfig(); DB.save();
    },
    speak() {
        const lines = State.meta.dialogues; if (!lines || lines.length === 0) return;
        const line = lines[Math.floor(Math.random() * lines.length)];
        const box = document.getElementById('dialogueBox');
        document.getElementById('dialogueText').innerText = line;
        box.classList.remove('hidden');
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => box.classList.add('hidden'), 4000);
    }
};

const Render = {
    categoryGrid() {
        const grid = document.getElementById('categoryGrid');
        grid.innerHTML = '';
        State.categories.forEach(cat => {
            const card = document.createElement('div');
            
            let count = (cat === 'All Songs') ? State.songs.length : 
                        (cat === 'WHIMSY') ? State.songs.filter(s => s.difficulties.WMS).length :
                        State.songs.filter(s => s.category === cat).length;

            let stackClass = '';
            if (count > 8) stackClass = 'stack-3';
            else if (count > 4) stackClass = 'stack-2';
            
            card.className = `cat-card tilted ${stackClass}`;
            card.style.setProperty('--r', Utils.randomTilt());
            
            const meta = State.meta.catMeta[cat] || {};
            const fallbackSongCover = State.songs.find(s => s.category === cat)?.coverUrl;
            const cover = meta.cover || DEFAULT_CAT_COVERS[cat] || fallbackSongCover || `https://placehold.co/300x500/eee/333?text=${cat.substring(0,2)}`;
            const isContain = meta.fit === 'contain';
            
            card.innerHTML = `
                <img class="cat-img ${isContain ? 'fit-contain' : ''}" src="${cover}">
                <div class="cat-info">
                    <div class="cnt">${count} TRACKS</div>
                    <h3>${cat}</h3>
                    <div class="cat-subtitle">${meta.sub || ''}</div>
                </div>
                <div class="cat-tools dev-only hidden">
                    <button class="btn-mini" onclick="CatOps.move('${cat}', -1)"><i class="fa-solid fa-arrow-left"></i></button>
                    <button class="btn-mini" onclick="CatOps.edit('${cat}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-mini" onclick="CatOps.delete('${cat}')"><i class="fa-solid fa-trash"></i></button>
                    <button class="btn-mini" onclick="CatOps.move('${cat}', 1)"><i class="fa-solid fa-arrow-right"></i></button>
                </div>
            `;
            card.querySelector('.cat-tools').addEventListener('click', e => e.stopPropagation());
            card.onclick = () => { State.currCat = cat; SceneManager.switch('music'); };
            grid.appendChild(card);
        });
        document.getElementById('catCount').innerText = `${State.categories.length} ARCHIVES`;
        document.querySelectorAll('.dev-only').forEach(el => el.classList.toggle('hidden', !State.devMode));
    },

    songList() {
        const list = document.getElementById('songList');
        const filter = document.getElementById('searchInput').value.toLowerCase();
        list.innerHTML = '';
        const isFlatMode = State.sortMode === 'flat_alpha';
        document.getElementById('listCatName').innerText = isFlatMode ? 'NO CATEGORY MODE' : State.currCat;
        document.getElementById('listCatSub').innerText = isFlatMode ? 'ALL PACKS / TITLE A→Z' : (State.meta.catMeta[State.currCat]?.sub || "");

        let rawItems = State.songs.filter(s => {
            if (isFlatMode || State.currCat === 'All Songs') return true;
            if (State.currCat === 'WHIMSY') return s.difficulties.WMS !== undefined;
            return s.category === State.currCat;
        });
        if (filter) rawItems = rawItems.filter(s => s.title.toLowerCase().includes(filter));

        let displayItems = [];
        rawItems.forEach(song => {
            if (State.currCat === 'All Songs' && State.sortMode.startsWith('level')) {
                if (song.difficulties.HYP) displayItems.push({ song, diff: 'HYP', val: song.difficulties.HYP });
                if (song.difficulties.MET) displayItems.push({ song, diff: 'MET', val: song.difficulties.MET });
                if (song.difficulties.DEC) displayItems.push({ song, diff: 'DEC', val: song.difficulties.DEC });
                if (song.difficulties.PHM) displayItems.push({ song, diff: 'PHM', val: song.difficulties.PHM });
                if (song.difficulties.NUL) displayItems.push({ song, diff: 'NUL', val: song.difficulties.NUL });
                if (song.difficulties.WMS) displayItems.push({ song, diff: 'WMS', val: 999 });
            } else {
                let dKey = State.isWhimsyCat ? 'WMS' : State.currDiff;
                if (!song.difficulties[dKey] && dKey !== 'WMS') {
                    if (song.difficulties.HYP) dKey = 'HYP';
                    else if (song.difficulties.MET) dKey = 'MET';
                    else if (song.difficulties.DEC) dKey = 'DEC';
                    else dKey = Object.keys(song.difficulties)[0];
                }
                
                let v = song.difficulties[dKey] || 0;
                displayItems.push({ song, diff: dKey, val: v });
            }
        });

        if (State.sortMode === 'pack') {
            displayItems.sort((a, b) => {
                const idxA = State.categories.indexOf(a.song.category);
                const idxB = State.categories.indexOf(b.song.category);
                return idxA - idxB || a.song.title.localeCompare(b.song.title);
            });
        } else if (State.sortMode === 'subgroup') {
             displayItems.sort((a, b) => {
                const sa = a.song.subgroup || 'ZZZ';
                const sb = b.song.subgroup || 'ZZZ';
                const ca = a.song.category || '';
                const cb = b.song.category || '';
                const va = typeof a.val === 'string' ? 999 : Number(a.val || 0);
                const vb = typeof b.val === 'string' ? 999 : Number(b.val || 0);

                if (State.currCat === 'All Songs') {
                    return ca.localeCompare(cb) || sa.localeCompare(sb) || va - vb || a.song.title.localeCompare(b.song.title);
                }

                return sa.localeCompare(sb) || va - vb || a.song.title.localeCompare(b.song.title);
             });
        } else if (State.sortMode === 'flat_alpha') {
            displayItems.sort((a, b) => {
                const sa = a.song.subgroup || 'ZZZ';
                const sb = b.song.subgroup || 'ZZZ';
                return sa.localeCompare(sb) || a.song.title.localeCompare(b.song.title);
            });
        } else {
            displayItems.sort((a, b) => {
                let vA = (typeof a.val === 'string') ? 999 : a.val;
                let vB = (typeof b.val === 'string') ? 999 : b.val;
                return State.sortMode === 'level_desc' ? vB - vA : vA - vB;
            });
        }

        const groups = {};
        const groupOrder = [];

        displayItems.forEach(item => {
            const { song, diff, val } = item;
            let headerText = '';
            
            if (State.sortMode.startsWith('level')) {
                if (val === 999 || diff === 'WMS') headerText = 'WHIMSIES'; 
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
                headerText = song.subgroup || 'OTHERS';
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
            header.innerHTML = `<span>${headerText}</span>`;
            header.onclick = () => groupDiv.classList.toggle('collapsed');
            groupDiv.appendChild(header);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'group-content';

            groups[headerText].forEach(item => {
                const { song, diff, val } = item;
                const div = document.createElement('div');
                const isActive = State.currSongId === song.id && (State.currCat === 'All Songs' ? State.currDiff === diff : true); 
                const isSel = State.selectedSongs.has(song.id);
                const isHyp = diff === 'HYP';
                
                div.className = `song-row ${isActive ? 'active' : ''} ${isSel ? 'selected' : ''} ${isHyp && isActive ? 'hyp-active' : ''}`;
                
                let displayTitle = song.title;
                if (diff === 'HYP' && song.hyperTitle) {
                    displayTitle = song.hyperTitle;
                } else if (diff === 'WMS' && song.difficulties.WMS_alias) {
                    displayTitle = song.difficulties.WMS_alias;
                }
                const valStr = (diff === 'WMS' && typeof song.difficulties.WMS === 'string') ? song.difficulties.WMS : (State.isPrecise ? Utils.formatPrecise(val) : Utils.formatRough(val));
                const color = CONFIG.colors[diff] || '#888';
                
                div.style.setProperty('--hl-solid', color);
                div.style.setProperty('--hl-bg', Utils.glassColor(color));

                div.innerHTML = `
                    <div class="s-meta">
                        ${song.subgroup ? `<span class="s-subgroup">${song.subgroup}</span>` : ''}
                        <span class="s-title">${displayTitle}</span>
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
                    else {
                        State.currSongId = song.id;
                        State.currDiff = diff; 
                        Render.songList(); Render.songDetail();
                    }
                };
                contentDiv.appendChild(div);
            });

            groupDiv.appendChild(contentDiv);
            list.appendChild(groupDiv);
        });

        if (!State.batchMode && !displayItems.some(i => i.song.id === State.currSongId && (State.currCat === 'All Songs' ? i.diff === State.currDiff : true)) && displayItems.length > 0) {
            State.currSongId = displayItems[0].song.id; 
            State.currDiff = displayItems[0].diff;
            setTimeout(() => { Render.songList(); Render.songDetail(); }, 0);
        }
    },

    songDetail() {
        const song = State.currentSong;
        if (!song) return;
        
        let dKey = State.isWhimsyCat ? 'WMS' : State.currDiff;
        if (!song.difficulties[dKey] && !State.isWhimsyCat) {
             dKey = song.difficulties.MET ? 'MET' : Object.keys(song.difficulties)[0];
        }

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
        document.getElementById('detailBpm').innerText = song.bpm;
        document.getElementById('detailCover').src = displayCover;
        document.getElementById('detailBg').style.backgroundImage = `url(${displayCover})`;

        const stamp = document.getElementById('ratingStamp');
        stamp.style.color = color;
        
        if (dKey === 'HYP') stamp.classList.add('hyp-style');
        else stamp.classList.remove('hyp-style');
        
         // 如果是 WMS 难度，添加专门的样式类
        if (dKey === 'WMS') stamp.classList.add('wms-style');
        else stamp.classList.remove('wms-style');

        let displayVal = Utils.formatRough(dVal);
        if (dKey === 'WMS' && typeof dVal === 'string') displayVal = dVal;
        else if (State.isPrecise) displayVal = Utils.formatPrecise(dVal);

        document.getElementById('stampLabel').innerText = labelFull;
        document.getElementById('stampVal').innerHTML = displayVal;

        const tabs = document.getElementById('diffTabs');
        tabs.innerHTML = '';
        ['NUL', 'PHM', 'DEC', 'MET', 'HYP', 'WMS'].forEach(k => {
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
            if (k === 'WMS' && typeof tabVal === 'string') tabValStr = tabVal; 

            btn.innerHTML = `
                <span class="d-tab-name">${k}</span>
                <span class="d-tab-val">${tabValStr}</span>
            `;
            btn.onclick = () => { State.currDiff = k; Render.songDetail(); Render.songList(); };
            tabs.appendChild(btn);
        });
        
        document.querySelector('.jacket-wrap').style.setProperty('--r', Utils.randomTilt());
        document.getElementById('wmsStripe').classList.toggle('hidden', dKey !== 'WMS');
    }
};

const CatOps = {
    move(cat, dir) { 
        if (cat === 'All Songs' || cat === 'Original' || cat === 'WHIMSY') return;
        const metaArr = State.meta.catOrder;
        const metaIdx = metaArr.indexOf(cat);
        if (metaIdx > -1) {
            const swapIdx = metaIdx + dir;
            if (swapIdx >= 0 && swapIdx < metaArr.length) {
                const targetCat = metaArr[swapIdx];
                if (targetCat !== 'All Songs' && targetCat !== 'Original' && targetCat !== 'WHIMSY') {
                    [metaArr[metaIdx], metaArr[swapIdx]] = [metaArr[swapIdx], metaArr[metaIdx]];
                    DB.save(); Render.categoryGrid();
                }
            }
        }
    },
    edit(cat) { CatEditor.open(cat); },
    delete(cat) {
        if (cat === 'All Songs' || cat === 'Original') return alert("Protected.");
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
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=1`);
            const data = await res.json();
            if (data.resultCount > 0) {
                document.getElementById('catCover').value = data.results[0].artworkUrl512;
            } else {
                alert("No game icon found. Try web search.");
            }
        } catch { alert("Search error."); }
        finally { btn.className = "fa-solid fa-gamepad"; }
    },
    delete() { CatOps.delete(this.targetCat); this.close(); },
    save(e) {
        if(e) e.preventDefault();
        const oldName = document.getElementById('oldCatName').value;
        const newName = document.getElementById('catName').value;
        if(!newName) return;

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
        document.getElementById('devToggle').onclick = () => {
            State.devMode = !State.devMode;
            document.getElementById('devToggle').classList.toggle('active', State.devMode);
            const scene = document.querySelector('.scene.active').id;
            if(scene === 'scene-menu') {
                document.querySelector('.char-controls').classList.toggle('hidden', !State.devMode);
                Juni.applyConfig();
            }
            if(scene === 'scene-category') Render.categoryGrid();
            if(scene === 'scene-music') Render.songList();
        };

        // Modal triggers
        document.getElementById('btnEditSong').onclick = () => this.openSongModal(State.currentSong);
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
                    if(data.songs) State.songs = data.songs;
                    if(data.meta) State.meta = DB.buildMeta(data.meta);
                    DB.save();
                    location.reload();
                } catch(e) { alert("Invalid JSON"); }
            };
            reader.readAsText(file);
        };
        
        // JS Export Logic
        document.getElementById('btnExportJS').onclick = async () => {
            try {
                // Fetch the current script.js content
                const response = await fetch('script.js');
                if (!response.ok) throw new Error("Cannot fetch script.js");
                let jsContent = await response.text();

                // Replace SEED_SONGS
                const songsJson = JSON.stringify(State.songs, null, 4);
                const metaJson = JSON.stringify(State.meta, null, 4);
                // Regex to find: const SEED_SONGS = [ ... ];
                // We use a simplified replacement assuming standard formatting
                // Or easier: replace the whole block if we identify start/end
                
                // Fallback approach: Create a new JS file string that overrides DB init
                // But user wants "script.js". Let's try to string replace.
                
                // Construct replacement string
                const newSeedBlock = `const SEED_SONGS = ${songsJson};`;
                const newMetaBlock = `const SEED_META = ${metaJson};`;
                
                // Use regex to replace the variable definition
                // Matches: const SEED_SONGS = [ (anything until ];)
                const regex = /const SEED_SONGS\s*=\s*\[[\s\S]*?\];/;
                const metaRegex = /const SEED_META\s*=\s*[\s\S]*?;\n\nconst DB/;
                
                if (regex.test(jsContent) && metaRegex.test(jsContent)) {
                    jsContent = jsContent.replace(regex, newSeedBlock);
                    jsContent = jsContent.replace(metaRegex, `${newMetaBlock}\n\nconst DB`);
                    
                    // Download
                    const blob = new Blob([jsContent], { type: 'text/javascript' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'script.js';
                    a.click();
                } else {
                    alert("Could not find SEED_SONGS / SEED_META block in script.js to replace.");
                }
            } catch (e) {
                alert("Export failed: " + e.message + "\n(This feature requires running on a local server)");
            }
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
            if (State.sortMode === 'level_desc') State.sortMode = 'level_asc';
            else if (State.sortMode === 'level_asc') State.sortMode = 'pack';
            else if (State.sortMode === 'pack') State.sortMode = 'subgroup'; 
            else if (State.sortMode === 'subgroup') State.sortMode = 'flat_alpha';
            else State.sortMode = 'level_desc';
            Render.songList();
        };
    },
    addCategory() {
        const name = prompt("New Category Name:");
        if(name && !State.meta.catOrder.includes(name)) {
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
        this.targetId = s.id;
        document.getElementById('editModal').classList.add('open');
        document.getElementById('editTitle').value = s.title;
        document.getElementById('editArtist').value = s.artist;
        document.getElementById('editCover').value = s.coverUrl;
        document.getElementById('editBpm').value = s.bpm;
        document.getElementById('editSubgroup').value = s.subgroup || '';
        
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
            s.bpm = parseInt(document.getElementById('editBpm').value);
            s.subgroup = document.getElementById('editSubgroup').value;
            
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

            DB.save(); Render.songList(); Render.songDetail(); Editor.close();
        }
    },
    addSong() {
        const cat = State.currCat === 'All Songs' ? 'Original' : State.currCat;
        const newSong = fillLowDiffs({ 
            id: crypto.randomUUID(), title: 'NEW', artist: '', category: cat, 
            difficulties: {...CONFIG.defaultDifficulties} 
        });
        State.songs.push(newSong); DB.save(); this.openSongModal(newSong);
    },
    async magicSearch() {
        const term = document.getElementById('editTitle').value;
        const artist = document.getElementById('editArtist').value;
        if(!term) return alert("Enter a title first!");
        
        const query = `${term} ${artist}`.trim();
        const btn = document.querySelector('.btn-magic i');
        btn.className = "fa-solid fa-spinner fa-spin"; 

        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
            const data = await res.json();
            if (data.resultCount > 0) {
                const track = data.results[0];
                const bigCover = track.artworkUrl100.replace('100x100bb', '600x600bb');
                document.getElementById('editCover').value = bigCover;
                if(!artist) document.getElementById('editArtist').value = track.artistName;
            } else {
                document.getElementById('editCover').value = `https://placehold.co/400x400/333/fff?text=${encodeURIComponent(term.substr(0,4))}`;
                alert("No match found. Placeholder set.");
            }
        } catch (e) {
            console.error(e);
            alert("Search failed.");
        } finally {
            btn.className = "fa-solid fa-wand-magic-sparkles"; 
        }
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
document.getElementById('dlDataBtn').onclick = Utils.exportData;
document.getElementById('preciseToggle').onclick = function() {
    State.isPrecise = !State.isPrecise;
    this.classList.toggle('active', State.isPrecise);
    Render.songList(); Render.songDetail();
};
document.getElementById('searchInput').addEventListener('input', () => Render.songList());
window.addEventListener('DOMContentLoaded', async () => {
    ViewportManager.init();
    await DB.init();
    Editor.init();
    SceneManager.switch('menu');
});
