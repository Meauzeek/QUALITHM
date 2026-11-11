/* Home settings are local preferences; song titles and artist credits are never translated. */
(() => {
    const words = globalThis.QUALITHM_LOCALES;
    let language = 'en';
    let returnFocus;
    const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
    const save = (key,value) => { try { localStorage.setItem(key,value); } catch {} };
    function refreshText() {
        const dictionary = words[language];
        document.documentElement.lang = language === 'zh' ? 'zh-Hans' : language;
        globalThis.SelectionText?.refresh();
        document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = dictionary[element.dataset.i18n] || element.textContent; });
        globalThis.SettingsChoices?.refresh(); globalThis.QualithmText?.refresh();
        document.getElementById('searchInput').placeholder = dictionary.search;
        document.querySelector('#openSongLibrary')?.setAttribute('aria-label',dictionary.library);
        document.querySelector('#songLibraryDrawer')?.setAttribute('aria-label',dictionary.library);
        document.querySelector('#songLibraryDrawer .library-toolbar button')?.setAttribute('aria-label',dictionary.closeLibrary);
        for (const [selector,key] of [['.btn-mini-tool','batch'],['.btn-mini-add','add'],['#closeSettings','close']]) {
            const node = document.querySelector(selector);
            node.title = dictionary[key]; node.setAttribute('aria-label', dictionary[key]);
        }
    }
    function sync() {
        document.getElementById('settingLanguage').value = language;
        document.getElementById('settingTheme').value = document.body.dataset.theme;
        document.getElementById('settingMute').checked = Preview.muted;
        document.getElementById('settingMotion').checked = document.body.classList.contains('reduce-motion');
        globalThis.SettingsChoices?.refresh();
    }
    function close() {
        globalThis.SettingsChoices?.close(); document.getElementById('settingsDialog').hidden = true;
        returnFocus?.focus();
    }
    document.addEventListener('DOMContentLoaded', () => {
        const savedLanguage = read('QUALITHM_LANGUAGE','en'); language = Object.hasOwn(words,savedLanguage) ? savedLanguage : 'en';
        const muted = read('QUALITHM_MUTE','false') === 'true';
        if (Preview.muted !== muted) Preview.toggleMute();
        document.body.classList.toggle('reduce-motion',read('QUALITHM_REDUCE_MOTION','false') === 'true');
        refreshText();
        const backdrop = document.getElementById('settingsDialog');
        document.getElementById('openSettings').onclick = () => { returnFocus = document.activeElement; sync(); backdrop.hidden = false; document.getElementById('settingLanguageTrigger').focus(); };
        document.getElementById('closeSettings').onclick = close;
        document.getElementById('settingsDone').onclick = close;
        backdrop.addEventListener('click', event => { if (event.target === backdrop) close(); });
        backdrop.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); close(); }
            if (event.key === 'Tab') {
                const nodes = [...backdrop.querySelectorAll('button,select,input')].filter(e=>e.getClientRects().length && !e.disabled);
                const first = nodes[0], last = nodes.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        });
        document.getElementById('settingLanguage').onchange = event => { language = event.target.value; save('QUALITHM_LANGUAGE',language); refreshText(); };
        document.getElementById('settingTheme').onchange = event => { if (document.body.dataset.theme !== event.target.value) Utils.toggleTheme(); };
        document.getElementById('settingMute').onchange = event => { if (Preview.muted !== event.target.checked) Preview.toggleMute(); save('QUALITHM_MUTE',String(Preview.muted)); };
        document.getElementById('settingMotion').onchange = event => { document.body.classList.toggle('reduce-motion',event.target.checked); save('QUALITHM_REDUCE_MOTION',String(event.target.checked)); };
        document.getElementById('exitGame').onclick = () => {
            Preview.stop(); QuickPack.close(); document.body.classList.add('session-ended');
            document.getElementById('app').inert = true;
            document.getElementById('sessionExit').hidden = false;
            document.getElementById('resumeSession').focus();
        };
        document.getElementById('resumeSession').onclick = () => {
            document.getElementById('sessionExit').hidden = true;
            document.body.classList.remove('session-ended'); document.getElementById('app').inert = false;
            SceneManager.switch('menu'); document.querySelector('.btn-start-large').focus();
        };
    });
    globalThis.QualithmSettings = {refreshText};
})();
