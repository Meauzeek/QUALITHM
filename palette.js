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
    const palette = {
        target,
        met,
        metForTheme(theme) { return met[theme === 'dark' ? 'dark' : 'light']; },
        applyTheme(theme) {
            root.document?.documentElement?.style?.setProperty('--c-met', this.metForTheme(theme));
        }
    };
    root.QualithmPalette = palette;
    palette.applyTheme(root.document?.body?.getAttribute('data-theme'));
    if (typeof module !== 'undefined') module.exports = palette;
})(globalThis);
