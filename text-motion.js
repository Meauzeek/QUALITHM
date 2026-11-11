/* Single-line labels retain their original Greek/CJK shaping spans. */
(() => {
    const observed = new Set();
    const metrics = document.createElement('canvas').getContext('2d');
    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    function measure() {
        frame = 0;
        for (const host of observed) {
            if (!host.isConnected) { observer.unobserve(host); observed.delete(host); continue; }
            if (!host.clientWidth) continue;
            if (host.matches('.cat-info h3')) {
                for(const label of host.children) {
                    const distance=Math.max(0,label.offsetWidth-host.clientWidth);
                    label.classList.toggle('pack-title-overflow',distance>1);
                    label.style.setProperty('--marquee-shift',`${-Math.ceil(distance)}px`);
                    label.style.setProperty('--marquee-duration',`${Math.max(10,distance/18*2+5)}s`);
                }
                continue;
            }
            if (host.matches('.btn-start-large .t-main')) {
                host.style.fontSize = '';
                const style = getComputedStyle(host), size = parseFloat(style.fontSize);
                metrics.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
                const available = host.parentElement.clientWidth - 64;
                const width = metrics.measureText(host.textContent).width;
                host.style.fontSize = `${Math.min(size, size * available / Math.max(1,width))}px`;
                continue;
            }
            if (host.id === 'stampVal') {
                const card=host.closest('#songDossier');
                if(card?.dataset.ratingKind==='text') {
                    const style=getComputedStyle(host);
                    metrics.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                    card.style.setProperty('--rating-width',`${Math.max(76,Math.ceil(metrics.measureText(host.textContent).width)+30)}px`);
                }
                const integer = host.querySelector('.rating-integer');
                if (integer) {
                    const large = getComputedStyle(integer);
                    metrics.font = `${large.fontWeight} ${large.fontSize} ${large.fontFamily}`;
                    const bottom = metrics.measureText(integer.textContent).actualBoundingBoxDescent;
                    host.querySelectorAll('.rating-dot,.rating-decimal').forEach(part => {
                        const small = getComputedStyle(part);
                        metrics.font = `${small.fontWeight} ${small.fontSize} ${small.fontFamily}`;
                        const delta = bottom - metrics.measureText(part.textContent).actualBoundingBoxDescent;
                        part.style.setProperty('--glyph-bottom-shift', `${delta}px`);
                    });
                }
                continue;
            }
            const content = host.firstElementChild;
            if (!content) continue;
            if (host.id === 'stampLabel') {
                const short = content.textContent.length <= 5;
                content.style.letterSpacing = short ? '.035em' : '0';
                const scale = short ? Math.min(1.22, Math.max(.90, host.clientWidth * .86 / content.offsetWidth)) : Math.min(1, Math.max(.90, (host.clientWidth - 4) / content.offsetWidth));
                host.style.setProperty('--name-scale', scale.toFixed(4));
                host.style.setProperty('--name-left', `${Math.max(0, (host.clientWidth - content.offsetWidth * scale) / 2)}px`);
                continue;
            }
            const style = getComputedStyle(host);
            const width = host.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
            const distance = Math.max(0, content.offsetWidth - width);
            host.classList.toggle('is-overflowing', distance > 1);
            host.style.setProperty('--marquee-shift', `${-Math.ceil(distance)}px`);
            host.style.setProperty('--marquee-duration', `${Math.max(10, distance / 18 * 2 + 5)}s`);
            host.tabIndex = distance > 1 ? 0 : -1;
        }
    }
    function refresh() {
        document.querySelectorAll('#detailTitle,#detailArtist,.s-title,.s-artist,#stampLabel,#stampVal,.btn-start-large .t-main,.cat-info h3').forEach(host => {
            if (host.matches('.cat-info h3')) { if (!observed.has(host)) { observed.add(host); observer.observe(host); } return; }
            if (host.matches('.btn-start-large .t-main')) { if (!observed.has(host)) { observed.add(host); observer.observe(host); observer.observe(host.parentElement); } return; }
            if (host.id === 'stampVal') { if (!observed.has(host)) { observed.add(host); observer.observe(host); } return; }
            const className = host.id === 'stampLabel' ? 'chart-name-glyph' : 'marquee-content';
            if (!host.firstElementChild?.classList.contains(className)) {
                const content = document.createElement('span');
                content.className = className;
                content.append(...host.childNodes);
                host.appendChild(content);
            }
            if (host.id !== 'stampLabel') { host.classList.add('marquee'); host.title = host.textContent; }
            if (!observed.has(host)) { observed.add(host); observer.observe(host); }
        });
        schedule();
    }
    document.addEventListener('DOMContentLoaded', () => { refresh(); document.fonts.ready.then(schedule); });
    document.fonts.addEventListener('loadingdone', schedule);
    globalThis.QualithmText = { refresh };
})();
