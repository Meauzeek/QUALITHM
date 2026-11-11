/* The hidden selects retain their change contract; all visible controls are themed. */
(() => {
    const widgets = [];
    for (const id of ['settingLanguage','settingTheme']) {
        const select = document.getElementById(id);
        const wrap = document.createElement('div'); wrap.className = 'settings-choice';
        select.after(wrap); select.hidden = true;
        const trigger = document.createElement('button'); trigger.type='button'; trigger.id=`${id}Trigger`;
        trigger.className='settings-choice-trigger'; trigger.setAttribute('aria-haspopup','listbox'); trigger.setAttribute('aria-expanded','false');
        trigger.setAttribute('aria-labelledby',`${id}Label ${id}Value`);
        trigger.innerHTML=`<span id="${id}Value"></span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>`;
        const menu=document.createElement('div'); menu.id=`${id}Menu`; menu.className='settings-choice-menu'; menu.role='listbox'; menu.hidden=true;
        menu.setAttribute('aria-labelledby',`${id}Label`); trigger.setAttribute('aria-controls',menu.id);
        wrap.append(trigger);
        document.getElementById('settingsDialog').append(menu);
        function position() {
            if (menu.hidden) return;
            const viewport = window.visualViewport;
            const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
            const width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
            const rect = trigger.getBoundingClientRect(), margin = 12;
            menu.style.width = `${Math.min(Math.max(rect.width,190),width-margin*2)}px`;
            menu.style.maxHeight = `${height-margin*2}px`;
            const wanted = Math.min(menu.scrollHeight,height-margin*2);
            // Prefer below, then above; on short screens shift inside the viewport.
            let y = rect.bottom + 6;
            if (y+wanted > top+height-margin && rect.top-6-wanted >= top+margin) y=rect.top-6-wanted;
            else y=Math.min(y,top+height-margin-wanted);
            menu.style.left=`${Math.max(left+margin,Math.min(rect.right-menu.offsetWidth,left+width-margin-menu.offsetWidth))}px`;
            menu.style.top=`${Math.max(top+margin,y)}px`;
        }
        function close(focus=false) { menu.hidden=true; trigger.setAttribute('aria-expanded','false'); if(focus) trigger.focus(); }
        function refresh() {
            trigger.firstElementChild.textContent=select.selectedOptions[0]?.textContent || '';
            menu.replaceChildren(...Array.from(select.options,option=>{
                const button=document.createElement('button'); button.type='button'; button.role='option'; button.tabIndex=-1;
                button.dataset.value=option.value; button.textContent=option.textContent; button.lang=option.lang || document.documentElement.lang;
                button.setAttribute('aria-selected',String(select.value===option.value));
                button.onclick=()=>{select.value=option.value; select.dispatchEvent(new Event('change',{bubbles:true})); close(true);};
                return button;
            }));
        }
        function open() { widgets.forEach(w=>w.close()); refresh(); menu.hidden=false; position(); trigger.setAttribute('aria-expanded','true'); const selected=menu.querySelector('[aria-selected="true"]'); selected?.focus({preventScroll:true}); selected?.scrollIntoView({block:'nearest'}); }
        trigger.onclick=()=>menu.hidden?open():close(true);
        trigger.onkeydown=event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open();}};
        function keyboard(event) {
            if(menu.hidden)return;
            if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}
            if(event.key==='Tab'){close(true);return;}
            const choices=[...menu.children],at=choices.indexOf(document.activeElement);
            let next;
            if(event.key==='ArrowDown')next=(at+1)%choices.length;
            if(event.key==='ArrowUp')next=(at-1+choices.length)%choices.length;
            if(event.key==='Home')next=0;
            if(event.key==='End')next=choices.length-1;
            if(next!==undefined){event.preventDefault();choices[next].focus();}
        }
        wrap.addEventListener('keydown',keyboard);
        menu.addEventListener('keydown',keyboard);
        select.addEventListener('change',refresh);
        document.addEventListener('pointerdown',event=>{if(!wrap.contains(event.target) && !menu.contains(event.target))close();});
        window.addEventListener('resize',position);
        window.visualViewport?.addEventListener('resize',position);
        document.querySelector('.settings-panel').addEventListener('scroll',position);
        widgets.push({refresh,close}); refresh();
    }
    globalThis.SettingsChoices={refresh:()=>widgets.forEach(w=>w.refresh()),close:()=>widgets.forEach(w=>w.close())};
})();
