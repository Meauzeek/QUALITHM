/* MET stays vivid royal blue with a violet undertone; brand/HYP are unchanged. */
(function (root) {
    const c = root.chroma;
    const fallback = { light: '#465fe2', dark: '#516ef2' };
    const target = Object.freeze({ lightness: .59, chroma: .20, hue: 270 });
    function metTone(background, direction) {
        let lightness = target.lightness;
        for (let i = 0; i < 40; i++, lightness += direction * .005) {
            const color = c.oklch(lightness, target.chroma, target.hue);
            if (!color.clipped() && c.contrast(color, background) >= 4.5) return color.hex();
        }
        return direction < 0 ? fallback.light : fallback.dark;
    }
    const met = c ? { light: metTone('#f0f0f0', -1), dark: metTone('#0a0a0a', 1) } : fallback;
    const composite = (under, over, alpha) => c.mix(under, over, alpha, 'rgb').hex();
    function readable(color, backgrounds, direction, minimum = 4.6) {
        const [l, chroma, hue] = c(color).oklch();
        for (let step = 0; step <= 200; step++) {
            const lightness = Math.max(.04, Math.min(.98, l + direction * step * .005));
            const candidate = c.oklch(lightness, chroma, hue || 0).hex();
            if (backgrounds.every(bg => c.contrast(candidate, bg) >= minimum)) return candidate;
        }
        return direction < 0 ? '#070910' : '#fafbff';
    }
    const palette = {
        target,
        met,
        cardForColor(color) {
            if (!c) return { edge: color, ink: '#252936', fill: '#252936', tint: '#d9deec' };
            const edge = c(color).saturate(.25);
            let ink = edge;
            for (let i = 0; i < 30 && c.contrast(ink, '#f4f5f8') < 4.5; i++) ink = ink.darken(.12);
            // Neutral endpoints have unstable hue; preserve the difficulty hue explicitly.
            const [lightness, chroma, hue] = edge.oklch();
            const fill = c.oklch(Math.max(.36, lightness * .65), chroma * .66, hue || 0);
            const tint = c.oklch(lightness + (.96 - lightness) * .16, chroma * .84, hue || 0);
            for (let i = 0; i < 30 && c.contrast(ink, tint) < 3.2; i++) ink = ink.darken(.12);
            const slot = c.oklch(Math.min(.43, tint.oklch()[0] * .62), chroma * .7, hue || 0).hex();
            const nightSlot = c.oklch(fill.oklch()[0] - .065, chroma * .6, hue || 0).hex();
            const slotInk = readable(c.oklch(.84, chroma * .3, hue || 0), [slot, nightSlot], 1);
            // Include the glass sheen and translucent lettering in the large-type check.
            const nameBackgrounds = [fill.hex(), composite(fill, '#ffffff', .095)];
            const nameTone = (start, saturation) => {
                let candidate;
                for (let l = start; l <= .98; l += .005) {
                    candidate = c.oklch(l, chroma > .01 ? saturation : 0, hue || 0).hex();
                    if (nameBackgrounds.every(bg => c.contrast(composite(bg, candidate, .88), bg) >= 3.2)) break;
                }
                return candidate;
            };
            const nameInk = nameTone(.84, Math.max(.045,chroma * .48));
            const nameShade = nameTone(.77, Math.max(.05,chroma * .52));
            return { edge: edge.hex(), ink: ink.hex(), fill: fill.hex(), tint: tint.hex(), slot, nightSlot, slotInk, nameInk, nameShade };
        },
        glassForColor(color) {
            if (!c) return { wash: color + '30', nightWash: color + '26', ink:'#202536', nightInk:'#e0e5f4', activeFill:'#34405a', activeInk:'#dce5ff' };
            const [l, chroma, h] = c(color).oklch();
            const pale = c.oklch(l + (.95 - l) * .45, chroma * .65, h || 0);
            const daySamples = ['#aab1c0','#ccd1dc','#ffffff'].flatMap(bg => {
                const base = composite(composite(bg, '#ffffff', .65), pale, .30);
                return [base, composite(base, '#ffffff', .18)];
            });
            const nightSamples = ['#080a10','#252b38','#454b5d'].flatMap(bg => {
                const base = composite(composite(bg, '#090d14', .70), pale, .16);
                return [base, composite(base, '#ffffff', .055)];
            });
            // White labels need a darker, hue-preserving fill (especially yellow/orange).
            const activeFill = readable(color, ['#ffffff'], -1, 5.5);
            const activeSamples = ['#090c13', composite('#11151e', color, .22)];
            return { wash: pale.alpha(.30).css(), nightWash:pale.alpha(.16).css(),
                ink:readable(color,daySamples,-1), nightInk:readable(color,nightSamples,1),
                activeFill, activeInk:readable(color,activeSamples,1),
                samples:{day:daySamples,night:nightSamples,active:activeSamples,dayActive:[activeFill,composite(activeFill,'#ffffff',.08)]} };
        },
        metForTheme(theme) { return met[theme === 'dark' ? 'dark' : 'light']; },
        applyTheme(theme) {
            root.document?.documentElement?.style?.setProperty('--c-met', this.metForTheme(theme));
        }
    };
    root.QualithmPalette = palette;
    palette.applyTheme(root.document?.body?.getAttribute('data-theme'));
    if (typeof module !== 'undefined') module.exports = palette;
})(globalThis);
