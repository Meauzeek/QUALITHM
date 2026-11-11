/* Presentation-only translations: category keys, chart identities and catalog text never change. */
(() => {
 const keys='allSongs|favorites|level|varieties|original|levelIndex|others|phase|songs|charts|noCharts|filterHint|hidden|fullVersion|previousPack|nextPack|choosePack|random|randomEmpty|randomBatch|sort|precise|rough|addFavorite|removeFavorite|editSong|playPending|importData|exportData|exportSeed|debug|chooseDiff|hypFallback|packOrder|subgroups|titleOrder|ascending|descending|previewMissing|previewOfficial|previewMute|previewUnmute|previewFailed|previewTap|whimsy|editPack|deletePack|retry|loadError'.split('|');
 const rows={
 en:'All Songs|Favorites|Level|Varieties|Original|LEVEL INDEX|OTHERS|PHASE|SONGS|CHARTS|NO CHARTS|Change pack, difficulty or search|HIDDEN|FULL VERSION|Previous pack|Next pack|Choose pack|Random chart|No charts to randomize|Random disabled in batch mode|Sort|Show precise ratings|Show levels|Add to Favorites|Remove from Favorites|Edit current song|Gameplay module not connected yet|Import JSON|Export JSON|Export offline seed|Toggle debug editing|Choose difficulty|Prefer HYP; use MET if unavailable|By pack|By subgroup|By title|Level ascending|Level descending|No preview configured|Open official preview|Mute preview|Unmute preview|Preview unavailable|Tap to preview|WHIMSY|Edit pack|Delete pack|Retry|Archive load failed',
 zh:'全部曲目|收藏|等级|综合曲包|原创|等级索引|其他|阶段|首曲目|张谱面|暂无谱面|请调整曲包、难度或搜索条件|隐藏|完整版本|上一个曲包|下一个曲包|选择曲包|随机选曲|没有可随机选择的谱面|批量编辑时不能随机选曲|排序|显示精确定数|显示等级|收藏曲目|取消收藏|编辑当前曲目|游玩模块待接入|导入 JSON|导出 JSON|导出离线曲库|切换调试编辑|选择难度|优先 HYP，无 HYP 时显示 MET|按曲包|按分组|按曲名|等级升序|等级降序|当前曲目未设置试听|打开官方试听|试听静音|取消试听静音|试听暂不可用|点击开始试听|特殊谱面|编辑曲包|删除曲包|重试|曲包加载失败',
 'zh-Hant':'全部曲目|收藏|等級|綜合曲包|原創|等級索引|其他|階段|首曲目|張譜面|暫無譜面|請調整曲包、難度或搜尋條件|隱藏|完整版本|上一個曲包|下一個曲包|選擇曲包|隨機選曲|沒有可隨機選擇的譜面|批次編輯時不能隨機選曲|排序|顯示精確定數|顯示等級|收藏曲目|取消收藏|編輯目前曲目|遊玩模組尚未接入|匯入 JSON|匯出 JSON|匯出離線曲庫|切換除錯編輯|選擇難度|優先 HYP，沒有 HYP 時顯示 MET|依曲包|依分組|依曲名|等級升序|等級降序|目前曲目未設定試聽|開啟官方試聽|試聽靜音|取消試聽靜音|試聽暫時無法使用|點擊開始試聽|特殊譜面|編輯曲包|刪除曲包|重試|曲包載入失敗',
 ja:'全楽曲|お気に入り|難易度|総合曲集|創作曲|難易度索引|その他|章|曲|譜面|該当する譜面はありません|曲集・難易度・検索条件を変更してください|隠し曲|完全版|前の曲集|次の曲集|曲集選択|無作為選曲|選択できる譜面がありません|一括編集では無作為選曲を利用できません|並べ替え|詳細定数を表示|段階難易度を表示|お気に入りに追加|お気に入りから削除|楽曲を編集|演奏機能は準備中です|JSON を読み込む|JSON を書き出す|曲庫を保存|編集機能を切り替え|難易度選択|HYP 優先、未収録時は MET|曲集順|分類順|曲名順|難易度の昇順|難易度の降順|試聴音源がありません|公式試聴を開く|試聴を消音|試聴の消音を解除|試聴できません|押して試聴|特殊譜面|曲集を編集|曲集を削除|再試行|曲集の読込に失敗しました',
 fr:'Tous les morceaux|Favoris|Niveau|Variétés|Créations|INDEX DES NIVEAUX|AUTRES|CHAPITRE|MORCEAUX|PARTITIONS|AUCUNE PARTITION|Modifiez le pack, la difficulté ou la recherche|CACHÉ|VERSION INTÉGRALE|Pack précédent|Pack suivant|Choisir un pack|Partition aléatoire|Aucune partition disponible|Aléatoire indisponible en édition groupée|Trier|Afficher les constantes|Afficher les niveaux|Ajouter aux favoris|Retirer des favoris|Modifier le morceau|Mode de jeu à venir|Importer JSON|Exporter JSON|Exporter la bibliothèque hors ligne|Activer le mode édition|Choisir la difficulté|HYP en priorité, sinon MET|Par pack|Par groupe|Par titre|Niveau croissant|Niveau décroissant|Aucun extrait configuré|Ouvrir l’extrait officiel|Couper l’extrait|Rétablir le son|Extrait indisponible|Lancer l’extrait|PARTITIONS SPÉCIALES|Modifier le pack|Supprimer le pack|Réessayer|Échec du chargement',
 ko:'모든 곡|즐겨찾기|난이도|종합 곡 팩|창작곡|난이도 목록|기타|장|곡|채보|채보 없음|곡 팩, 난이도 또는 검색 조건을 바꿔 주세요|숨김|완전판|이전 곡 팩|다음 곡 팩|곡 팩 선택|무작위 선택|선택할 채보가 없습니다|일괄 편집 중에는 무작위 선택을 사용할 수 없습니다|정렬|세부 난이도 표시|등급 표시|즐겨찾기 추가|즐겨찾기 삭제|현재 곡 편집|플레이 기능 준비 중|JSON 가져오기|JSON 내보내기|오프라인 곡 목록 내보내기|편집 모드 전환|난이도 선택|HYP 우선, 없으면 MET 표시|곡 팩순|분류순|곡명순|난이도 오름차순|난이도 내림차순|미리 듣기 없음|공식 미리 듣기 열기|미리 듣기 음소거|음소거 해제|미리 듣기 사용 불가|눌러서 미리 듣기|특수 채보|곡 팩 편집|곡 팩 삭제|다시 시도|곡 팩 불러오기 실패',
 es:'Todas las canciones|Favoritos|Nivel|Variedades|Originales|ÍNDICE DE NIVELES|OTROS|CAPÍTULO|CANCIONES|PARTITURAS|SIN PARTITURAS|Cambia el paquete, la dificultad o la búsqueda|OCULTA|VERSIÓN COMPLETA|Paquete anterior|Paquete siguiente|Elegir paquete|Partitura aleatoria|No hay partituras disponibles|Aleatorio desactivado durante la edición múltiple|Ordenar|Mostrar constantes|Mostrar niveles|Añadir a favoritos|Quitar de favoritos|Editar canción|Modo de juego pendiente|Importar JSON|Exportar JSON|Exportar biblioteca sin conexión|Cambiar modo de edición|Elegir dificultad|Priorizar HYP; usar MET si no existe|Por paquete|Por grupo|Por título|Nivel ascendente|Nivel descendente|No hay adelanto configurado|Abrir adelanto oficial|Silenciar adelanto|Activar sonido|Adelanto no disponible|Reproducir adelanto|PARTITURAS ESPECIALES|Editar paquete|Eliminar paquete|Reintentar|Error al cargar paquetes',
 iu:'ᐃᓐᖏᐅᑎᓕᒫᑦ|ᐱᐅᒋᔭᑦ|ᖁᑦᑎᓐᓂᖅ|ᐊᔾᔨᒌᙱᑦᑐᑦ|ᓄᑖᑦ|ᖁᑦᑎᓐᓂᖏᑦ|ᐊᓯᖏᑦ|ᐃᓚᖓ|ᐃᓐᖏᐅᑎᑦ|ᐃᓐᖏᐅᑎᓄᑦ ᓇᓗᓇᐃᒃᑯᑕᑦ|ᐱᑕᖃᙱᑦᑐᖅ|ᕿᓂᕈᑎᑦ ᐊᓯᔾᔨᕐᓗᒋᑦ|ᐃᔨᖅᓯᒪᔪᖅ|ᑕᒪᒃᑭᖅᑐᖅ|ᓯᕗᓂᐊᓂ|ᑭᖑᓂᐊᓂ|ᓂᕈᐊᕐᓗᑎᑦ|ᓇᓪᓕᐊᑐᐃᓐᓇᖅ|ᐱᑕᖃᙱᑦᑐᖅ|ᐊᑐᐃᓐᓇᐅᙱᑦᑐᖅ|ᑐᑭᓕᕇᒃᑎᕐᓗᒋᑦ|ᓈᓴᐅᑎᑦ ᑕᑯᑎᓪᓗᒋᑦ|ᖁᑦᑎᓐᓂᖓ ᑕᑯᑎᓪᓗᒍ|ᐱᐅᒋᔭᓄᑦ ᐃᓚᓗᒍ|ᐱᐅᒋᔭᓂᑦ ᐲᕐᓗᒍ|ᐋᖅᑭᒃᓱᕐᓗᒍ|ᐊᑐᐃᓐᓇᐅᙱᑦᑐᖅ|JSON ᐃᓕᓗᒍ|JSON ᐊᓂᑎᓪᓗᒍ|ᐃᓐᖏᐅᑎᑦ ᑐᖅᑯᕐᓗᒋᑦ|ᐋᖅᑭᒃᓱᐃᓂᖅ|ᖁᑦᑎᓐᓂᖓ ᓂᕈᐊᕐᓗᒍ|HYP / MET|ᐃᓐᖏᐅᑎᑎᒍᑦ|ᐃᓚᒌᒃᑎᑐᑦ|ᐊᑎᑎᒍᑦ|ᖁᕝᕙᒃᑐᖅ|ᐊᑉᐸᒃᑐᖅ|ᓂᐱᖃᙱᑦᑐᖅ|ᓂᐱ ᑐᓴᕐᓗᒍ|ᓂᐱᖃᖏᓪᓗᒍ|ᓂᐱᖃᓕᕐᓗᒍ|ᑐᓴᕐᓇᙱᑦᑐᖅ|ᑐᓴᕐᓗᒍ|ᐊᔾᔨᐅᙱᑦᑐᑦ|ᐋᖅᑭᒃᓱᕐᓗᒍ|ᐲᕐᓗᒍ|ᐱᒋᐊᒃᑲᓐᓂᕐᓗᒍ|ᐊᑐᐃᓐᓇᐅᙱᑦᑐᖅ'
 };
 const dictionaries=Object.fromEntries(Object.entries(rows).map(([code,row])=>{const values=row.split('|'); if(values.length!==keys.length)throw new Error(`Selection locale ${code}: ${values.length}/${keys.length}`);return [code,Object.fromEntries(keys.map((key,i)=>[key,values[i]]))];}));
 // Labels preceding a value must not reuse counted units such as “张谱面”.
 for(const [code,label] of Object.entries({en:'CHARTS',zh:'谱面数量','zh-Hant':'譜面數量',ja:'譜面数',fr:'PARTITIONS',ko:'채보 수',es:'PARTITURAS',iu:'ᐃᓐᖏᐅᑎᓄᑦ ᓇᓗᓇᐃᒃᑯᑕᑦ'})) dictionaries[code].chartCountLabel=label;
 const locale=()=>document.documentElement.lang==='zh-Hans'?'zh':document.documentElement.lang;
 const t=key=>dictionaries[locale()]?.[key] || dictionaries.en[key] || globalThis.QUALITHM_LOCALES?.[locale()]?.[key] || key;
 const functional={'All Songs':'allSongs',Favorites:'favorites',Level:'level',VARIETY:'varieties',Varieties:'varieties',Original:'original',WHIMSY:'whimsy'};
 // ONGEKI's Chinese name is a conventional translation; the Japanese site uses オンゲキ.
 const chinese={Arcaea:'韵律源点','maimai DX':'舞萌DX',CHUNITHM:'中二节奏','O.N.G.E.K.I.':'音击','Paradigm: Reboot':'范式：起源',Rotaeno:'旋转音律','Cytus II':'音乐世界Cytus II'};
 const japanese={'maimai DX':'maimai でらっくす','O.N.G.E.K.I.':'オンゲキ',CHUNITHM:'チュウニズム'};
 const nativeNames=()=>locale()==='zh'?chinese:locale()==='ja'?japanese:{};
 const pack=key=>key==='WHIMSY'?'WHIMSY':functional[key]?t(functional[key]):nativeNames()[key] || key;
 const put=(node,value)=>{if(node && node.textContent!==String(value))node.textContent=value;};
 const tip=(selector,key)=>document.querySelectorAll(selector).forEach(node=>{const text=t(key);node.title=text;node.setAttribute('aria-label',text);});
 const counts=(songs,charts)=>`${songs} ${t('songs')} · ${charts} ${t('charts')}`;
 function group(value) {
   if(value==='WHIMSIES')return 'WHIMSY';
   if(value==='OTHERS'||value==='其他')return t('others');
   if(value.startsWith('LEVEL '))return t('level')+' '+value.slice(6);
   if(/^PHASE /i.test(value))return 'Phase '+value.slice(6);
   return value.split(': ').map(part=>part==='OTHERS'?t('others'):/^PHASE /i.test(part)?'Phase '+part.slice(6):pack(part)).join(': ');
 }
 function refresh() {
   for(const card of document.querySelectorAll('.cat-card[data-pack-key]')){
     const key=card.dataset.packKey, heading=card.querySelector('h3');
     const alternate=key==='WHIMSY' && t('whimsy')!=='WHIMSY'?t('whimsy'):nativeNames()[key];
     if(alternate){
       if(!heading.querySelector('.pack-title-local')){heading.replaceChildren();for(const [cls,value] of [['pack-title-original',key],['pack-title-local',alternate]]){const span=document.createElement('span');span.className=cls;span.textContent=value;heading.append(span);}}
       else put(heading.querySelector('.pack-title-local'),alternate);
     }else {
       if(!heading.querySelector('.pack-title-original') || heading.querySelector('.pack-title-local')) {
         const span=document.createElement('span');span.className='pack-title-original';span.textContent=pack(key);heading.replaceChildren(span);
       } else put(heading.querySelector('.pack-title-original'),pack(key));
     }
     card.classList.toggle('localized-pack',Boolean(alternate));card.setAttribute('aria-label',pack(key));
     put(card.querySelector('.cnt'),counts(card.dataset.songCount,card.dataset.chartCount));
   }
   document.querySelectorAll('#quickPackMenu [data-category]').forEach(node=>put(node,pack(node.dataset.category)));
   const quickName=document.getElementById('quickPackName');
   const localWhimsy=State.currCat==='WHIMSY' && t('whimsy')!=='WHIMSY';
   quickName.classList.toggle('localized-name',localWhimsy);
   if(localWhimsy) {
     if(!quickName.querySelector('.pack-title-original')) {
       quickName.replaceChildren();
       for(const [cls,text] of [['pack-title-original','WHIMSY'],['pack-title-local',t('whimsy')]]) {
         const span=document.createElement('span');span.className=cls;span.textContent=text;quickName.append(span);
       }
     } else put(quickName.querySelector('.pack-title-local'),t('whimsy'));
   } else put(quickName,pack(State.currCat || 'Original'));
   put(document.getElementById('listCatName'),State.isLevelCat?t('levelIndex'):pack(State.currCat || 'Original'));
   document.querySelectorAll('.group-header[data-group-label]').forEach(node=>{
     const label=node.querySelector('.group-label'),value=group(node.dataset.groupLabel);
     put(label,value);
     if(/^LEVEL \d+\+$/.test(node.dataset.groupLabel) && !label.querySelector('.plus-symbol')) {
       label.textContent=value.slice(0,-1);
       const plus=document.createElement('span');plus.className='plus-symbol';plus.textContent='+';label.append(plus);
     }
   });
   document.querySelectorAll('[data-selection-text]').forEach(node=>put(node,t(node.dataset.selectionText)));
   document.querySelectorAll('.hidden-mark').forEach(node=>put(node,t('hidden')));
   document.querySelectorAll('.empty-list').forEach(node=>put(node,`${t('noCharts')}\n${t('filterHint')}`));
   if(document.querySelector('#detailPanel.empty')){put(document.getElementById('detailTitle'),t('noCharts'));put(document.getElementById('detailArtist'),t('filterHint'));}
   if(State.songs?.length)put(document.getElementById('catCount'),counts(State.songs.length,State.songs.reduce((sum,s)=>sum+CHART_KEYS.filter(k=>s.difficulties[k]!==undefined).length,0)));
   for(const [selector,key] of Object.entries({'#quickPackPrev,#packScrollPrev':'previousPack','#quickPackNext,#packScrollNext':'nextPack','#quickPackSelect,#quickPackMenu':'choosePack','#btnImport':'importData','#dlDataBtn':'exportData','#btnExportJS':'exportSeed','#devToggle':'debug','#diffTabs':'chooseDiff','#btnEditSong':'editSong','#playButton':'playPending','#chartFilterOptions [data-diff="HYP"]':'hypFallback','.favorite-mark':'favorites','.cat-tools [data-action="prev"]':'previousPack','.cat-tools [data-action="next"]':'nextPack','.cat-tools [data-action="edit"]':'editPack','.cat-tools [data-action="delete"]':'deletePack'}))tip(selector,key);
   tip('#favoriteToggle',UserState.has(State.currSongId)?'removeFavorite':'addFavorite');
   tip('#preciseToggle',State.isPrecise?'rough':'precise');
   tip('#randomSelect',State.batchMode?'randomBatch':State.visibleEntries?.length?'random':'randomEmpty');
   const sort=document.getElementById('sortToggle');
   const mode={pack:'packOrder',subgroup:'subgroups',flat_alpha:'titleOrder',level_asc:'ascending',level_desc:'descending'}[State.sortMode];
   if(sort){sort.title=`${t('sort')} · ${t(mode || 'subgroups')}`;sort.setAttribute('aria-label',sort.title);}
   tip('#themeToggle',document.body.dataset.theme==='dark'?'light':'dark');
   const previewStatus=document.getElementById('audioToggle')?.dataset.previewStatus;
   tip('#audioToggle',previewStatus==='PREVIEW UNAVAILABLE'?'previewFailed':previewStatus==='TAP TO PREVIEW'?'previewTap':Preview.externalOnly?'previewOfficial':!Preview.config.url?'previewMissing':Preview.muted?'previewUnmute':'previewMute');
   globalThis.QualithmText?.refresh();
 }
 Object.assign(globalThis.QUALITHM_LOCALES.ja,{archive:'楽曲選択',archives:'曲集選択',language:'表示言語',theme:'表示',light:'明色',dark:'暗色',mute:'試聴を消音',motion:'動きを抑える',ended:'終了しました',resume:'表題画面に戻る'});
 globalThis.SelectionText={t,pack,group,refresh,dictionaries};
})();
