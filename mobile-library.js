/* One song list shared by the desktop column and the mobile modal drawer. */
(() => {
    const media = matchMedia('(max-width:760px), (orientation:portrait), (max-height:500px) and (max-width:1000px)');
    const scene = document.getElementById('scene-music');
    const list = scene.querySelector('.list-zone');
    const anchor = document.createComment('Desktop song list');
    list.before(anchor);
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.id = 'openSongLibrary'; trigger.className = 'library-trigger';
    trigger.setAttribute('aria-label', '打开选曲目录'); trigger.setAttribute('aria-controls', 'songLibraryDrawer');
    trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.innerHTML = '<i class="fa-solid fa-list-ul" aria-hidden="true"></i><span data-i18n="library">SONGS</span>';
    scene.querySelector('.tool-group').prepend(trigger);
    const drawer = document.createElement('dialog'); drawer.id = 'songLibraryDrawer';
    drawer.setAttribute('aria-label', '选曲目录');
    drawer.innerHTML = '<div class="library-toolbar"><span data-i18n="library">SONGS</span><button type="button" aria-label="关闭选曲目录"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>';
    scene.append(drawer);
    let previousOverflow = '';
    function close(restoreFocus = true) {
        if (!drawer.open) return;
        drawer.close(); document.body.style.overflow = previousOverflow;
        trigger.setAttribute('aria-expanded', 'false');
        if (restoreFocus) trigger.focus({preventScroll:true});
    }
    function open() {
        if (!media.matches || drawer.open) return;
        previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
        drawer.showModal(); trigger.setAttribute('aria-expanded', 'true');
        globalThis.QualithmText?.refresh();
        const active = list.querySelector('.song-row.active');
        if (active) { active.scrollIntoView({block:'nearest'}); active.focus({preventScroll:true}); }
    }
    function layout() {
        close(false); trigger.hidden = !media.matches;
        if (media.matches) drawer.append(list);
        else anchor.after(list);
        globalThis.QualithmText?.refresh();
    }
    trigger.onclick = open;
    drawer.querySelector('button').onclick = () => close();
    drawer.addEventListener('cancel', event => { event.preventDefault(); close(); });
    drawer.addEventListener('click', event => {
        const r = drawer.getBoundingClientRect();
        if (event.target === drawer && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) close();
    });
    media.addEventListener('change', layout);
    globalThis.MobileLibrary = {open, close};
    layout();
})();
