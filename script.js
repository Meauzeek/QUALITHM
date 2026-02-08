const STORAGE_KEY = "qualithm-ui-demo-db-v1";
const CUSTOM_CATEGORY_KEY = "qualithm-ui-demo-custom-categories";

const BASE_CATEGORIES = ["maimai", "CHUNITHM", "O.N.G.E.K.I.", "Arcaea", "Original", "All Songs", "WHIMSY"];
const JUNI_LINES = [
  "「我们会在噪声中，找到最后一束可被记录的光。」",
  "「一切都会褪色，但旋律会留下边缘。」",
  "「请谨慎选择，你的节拍会改变世界。」"
];

const RAW_DB = `
Category: maimai DX
Panopticon (MET 14.4, HYP 15.1)
躯樹の墓守 (MET 15.7)
raputa (MET 15.9)
sølips (MET 14.9, HYP 16.3)
CYCLES (MET 12.4, HYP 14.0)
Caliburne ~Story of the Legendary sword~ (MET 15.6)
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
Opfer (MET 14.9) -> Opfer ~有栖の生贄~ (HYP 15.7)
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

const DIFFS = [
  { key: "nul", label: "NULL", code: "NUL", cls: "diff-nul" },
  { key: "phm", label: "PHANTOM", code: "PHM", cls: "diff-phm" },
  { key: "dec", label: "DECAY", code: "DEC", cls: "diff-dec" },
  { key: "met", label: "META", code: "MET", cls: "diff-met" },
  { key: "hyp", label: "HYPER", code: "HYP", cls: "diff-hyp" }
];

const state = {
  songs: [],
  categories: [...BASE_CATEGORIES],
  scene: "main",
  category: "All Songs",
  selectedId: null,
  activeDifficulty: "met",
  devMode: false,
  search: ""
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function formatDifficulty(value) {
  const v = Number(value || 0);
  const int = Math.floor(v);
  const decimal = Number((v - int).toFixed(2));
  return decimal >= 0.5 ? `${int}+` : `${int}`;
}

function parseRatingText(chunk) {
  const ratings = { nul: 1, phm: 5, dec: 10, met: 12, hyp: null };
  const reg = /(MET|HYP)\s(\d+(?:\.\d)?)/g;
  let m;
  while ((m = reg.exec(chunk))) {
    if (m[1] === "MET") ratings.met = Number(m[2]);
    if (m[1] === "HYP") ratings.hyp = Number(m[2]);
  }
  return ratings;
}

function parseSeedData(raw) {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  let currentCategory = "Original";
  const songs = [];

  lines.forEach((line, idx) => {
    if (line.startsWith("Category:")) {
      currentCategory = line.replace("Category:", "").trim();
      return;
    }

    const song = {
      id: `song-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      title: "",
      artist: "Unknown",
      bpm: 180,
      category: currentCategory,
      coverUrl: `https://picsum.photos/seed/${encodeURIComponent(line)}/960/540`,
      audioUrl: "",
      previewStart: 0,
      previewEnd: 0,
      enableHyp: false,
      enableWms: false,
      difficulties: { nul: 1, phm: 5, dec: 10, met: 12, hyp: null },
      difficultySpecificTitles: {}
    };

    if (line.includes("->")) {
      const [left, right] = line.split("->").map((p) => p.trim());
      const leftMatch = left.match(/^(.*)\((.*)\)$/);
      const rightMatch = right.match(/^(.*)\((.*)\)$/);
      if (leftMatch) {
        song.title = leftMatch[1].trim();
        song.difficulties = { ...song.difficulties, ...parseRatingText(leftMatch[2]) };
      }
      if (rightMatch) {
        song.difficultySpecificTitles.hyp = rightMatch[1].trim();
        const rightRatings = parseRatingText(rightMatch[2]);
        if (typeof rightRatings.hyp === "number") {
          song.difficulties.hyp = rightRatings.hyp;
          song.enableHyp = true;
        }
      }
    } else {
      const match = line.match(/^(.*)\((.*)\)$/);
      song.title = match ? match[1].trim() : line;
      if (match) song.difficulties = { ...song.difficulties, ...parseRatingText(match[2]) };
      song.enableHyp = typeof song.difficulties.hyp === "number";
    }

    songs.push(song);
  });

  songs.push({
    id: "wms-1",
    title: "Dissonance Carnival",
    artist: "QUALITHM CORE",
    bpm: 222,
    category: "WHIMSY",
    coverUrl: "https://picsum.photos/seed/wms/960/540",
    audioUrl: "",
    previewStart: 0,
    previewEnd: 0,
    enableHyp: false,
    enableWms: true,
    difficulties: { nul: 1, phm: 5, dec: 10, met: 13, hyp: null, wms: "狂" },
    difficultySpecificTitles: {}
  });

  return songs;
}

function seedIfNeeded() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parseSeedData(RAW_DB)));
  }
  const catSaved = localStorage.getItem(CUSTOM_CATEGORY_KEY);
  if (catSaved) state.categories = JSON.parse(catSaved);
}

function saveSongs() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.songs)); }
function loadSongs() { state.songs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }

function switchScene(name) {
  state.scene = name;
  $$(".scene").forEach((s) => s.classList.toggle("active", s.id === `scene-${name}`));
}

function renderCategories() {
  const grid = $("#categoryGrid");
  grid.innerHTML = "";
  state.categories.forEach((category) => {
    const card = document.createElement("button");
    card.className = "category-card";
    card.textContent = category;
    card.onclick = () => {
      state.category = category;
      switchScene("music");
      renderMusicView();
    };
    grid.appendChild(card);
  });
}

function getVisibleSongs() {
  const q = state.search.trim().toLowerCase();
  return state.songs.filter((s) => {
    if (state.category !== "All Songs" && s.category !== state.category) return false;
    if (!q) return true;
    return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
  });
}

function renderSongList() {
  const list = $("#songList");
  const songs = getVisibleSongs();
  $("#activeCategoryText").textContent = `Category: ${state.category} / ${songs.length} tracks`;
  list.innerHTML = "";
  songs.forEach((song) => {
    const item = document.createElement("li");
    item.className = `song-item ${song.id === state.selectedId ? "active" : ""}`;
    item.innerHTML = `<strong>${song.title}</strong><small>${song.artist} · ${song.category}</small>`;
    item.onclick = () => {
      state.selectedId = song.id;
      renderMusicView();
    };
    list.appendChild(item);
  });

  if (!songs.find((s) => s.id === state.selectedId)) {
    state.selectedId = songs[0]?.id || null;
  }
}

function createDiffTab(song, diff) {
  if (diff.key === "hyp" && !song.enableHyp) return null;
  const value = song.difficulties[diff.key];
  const btn = document.createElement("button");
  btn.className = `diff-tab ${diff.cls} ${state.activeDifficulty === diff.key ? "active" : ""}`;
  const mark = formatDifficulty(value);
  const formatted = mark.includes("+") ? `${mark.replace("+", "")}<sup>+</sup>` : mark;
  btn.innerHTML = `<span class="code">${diff.code}</span><span class="rating">${formatted}</span>`;
  btn.onclick = () => {
    state.activeDifficulty = diff.key;
    renderSongDetail(song);
    renderDifficultyTabs(song);
  };
  return btn;
}

function renderDifficultyTabs(song) {
  const wrap = $("#difficultyTabs");
  wrap.innerHTML = "";
  DIFFS.forEach((d) => {
    const tab = createDiffTab(song, d);
    if (tab) wrap.appendChild(tab);
  });
  if (song.enableWms) {
    const wms = document.createElement("button");
    wms.className = "diff-tab diff-wms";
    wms.innerHTML = `<span class='code'>WMS</span><span class='rating'>${song.difficulties.wms || "?"}</span>`;
    wrap.appendChild(wms);
  }
}

function renderSongDetail(song) {
  if (!song) return;
  const diff = state.activeDifficulty === "hyp" && !song.enableHyp ? "met" : state.activeDifficulty;
  const title = song.difficultySpecificTitles[diff] || song.title;
  $("#songTitle").textContent = title;
  $("#songArtist").textContent = `Artist: ${song.artist}`;
  $("#songBpm").textContent = `BPM: ${song.bpm}`;
  $("#coverImage").src = song.coverUrl;
  const badge = $("#difficultyBadge");
  const shortCode = DIFFS.find((d) => d.key === diff)?.code || "MET";
  badge.textContent = `${shortCode} ${formatDifficulty(song.difficulties[diff] || song.difficulties.met)}`;
  badge.className = `difficulty-badge ${diff === "hyp" ? "diff-hyp" : ""}`;

  const audio = $("#previewAudio");
  audio.src = song.audioUrl || "";
  audio.ontimeupdate = () => {
    if (song.previewEnd > 0 && audio.currentTime >= song.previewEnd) {
      audio.currentTime = song.previewStart || 0;
      audio.pause();
    }
  };
  audio.onplay = () => {
    if (song.previewStart > 0) audio.currentTime = song.previewStart;
  };
}

function renderMusicView() {
  renderSongList();
  const song = state.songs.find((s) => s.id === state.selectedId);
  if (song) {
    renderSongDetail(song);
    renderDifficultyTabs(song);
  }
  $("#editSongBtn").classList.toggle("hidden", !state.devMode || !song);
}

function openEditModal() {
  const song = state.songs.find((s) => s.id === state.selectedId);
  if (!song) return;
  const form = $("#editForm");
  form.title.value = song.title;
  form.artist.value = song.artist;
  form.cover.value = song.coverUrl;
  form.audio.value = song.audioUrl;
  form.previewStart.value = song.previewStart;
  form.previewEnd.value = song.previewEnd;
  form.nul.value = song.difficulties.nul;
  form.phm.value = song.difficulties.phm;
  form.dec.value = song.difficulties.dec;
  form.met.value = song.difficulties.met;
  form.hyp.value = song.difficulties.hyp ?? "";
  form.enableHyp.checked = !!song.enableHyp;
  form.enableWms.checked = !!song.enableWms;
  form.hypTitle.value = song.difficultySpecificTitles.hyp || "";
  $("#editModal").showModal();
}

function bindEvents() {
  $("#startBtn").onclick = () => {
    $("#juniLine").textContent = JUNI_LINES[Math.floor(Math.random() * JUNI_LINES.length)];
    switchScene("category");
  };
  $("#backToMenu").onclick = () => switchScene("main");
  $("#backToCategory").onclick = () => switchScene("category");
  $("#searchInput").oninput = (e) => { state.search = e.target.value; renderMusicView(); };

  $("#devModeToggle").onchange = (e) => {
    state.devMode = e.target.checked;
    renderMusicView();
  };

  $("#editSongBtn").onclick = openEditModal;
  $("#cancelEdit").onclick = () => $("#editModal").close();

  $("#editForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const song = state.songs.find((s) => s.id === state.selectedId);
    const fd = new FormData(e.currentTarget);
    song.title = fd.get("title").toString().trim();
    song.artist = fd.get("artist").toString().trim();
    song.coverUrl = fd.get("cover").toString().trim() || song.coverUrl;
    song.audioUrl = fd.get("audio").toString().trim();
    song.previewStart = Number(fd.get("previewStart") || 0);
    song.previewEnd = Number(fd.get("previewEnd") || 0);
    song.enableHyp = fd.get("enableHyp") === "on";
    song.enableWms = fd.get("enableWms") === "on";
    song.difficulties.nul = Number(fd.get("nul") || 1);
    song.difficulties.phm = Number(fd.get("phm") || 5);
    song.difficulties.dec = Number(fd.get("dec") || 10);
    song.difficulties.met = Number(fd.get("met") || 12);
    song.difficulties.hyp = song.enableHyp ? Number(fd.get("hyp") || song.difficulties.met + 0.5) : null;
    song.difficultySpecificTitles.hyp = fd.get("hypTitle").toString().trim();
    saveSongs();
    $("#editModal").close();
    renderMusicView();
  });

  $("#customCategoryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#newCategoryInput");
    const name = input.value.trim();
    if (!name || state.categories.includes(name)) return;
    state.categories.push(name);
    localStorage.setItem(CUSTOM_CATEGORY_KEY, JSON.stringify(state.categories));
    input.value = "";
    renderCategories();
  });
}

function init() {
  seedIfNeeded();
  loadSongs();
  renderCategories();
  bindEvents();
  switchScene("main");
}

init();
