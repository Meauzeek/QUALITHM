const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'assets/vendor/chroma-3.2.0.min.js'), 'utf8'), context);
const source = fs.readFileSync(path.join(root, 'palette.js'), 'utf8');
vm.runInContext(source, context);
const c = context.chroma;
const p = context.QualithmPalette;
for (const [theme, background] of [['light', '#f0f0f0'], ['dark', '#0a0a0a']]) {
    const color = c(p.metForTheme(theme));
    assert(c.contrast(color, background) >= 4.5, `${theme}: small-label contrast`);
    assert(color.hsl()[0] > 225 && color.hsl()[0] < 245, `${theme}: blue with violet undertone`);
    assert(color.oklch()[0] >= .54 && color.oklch()[0] <= .62, `${theme}: neither dark nor washed out`);
    assert(color.oklch()[1] > .18, `${theme}: retain chroma`);
    assert(c.deltaE(color, '#9270d6') > 12, `${theme}: distinguish HYP`);
}
const fallback = vm.createContext({});
for (const color of ['#ff7f50', '#e8b72f', '#2e8b57', p.met.light, p.met.dark, '#9270d6', '#888888']) {
    const card = p.cardForColor(color);
    assert(c.contrast(card.ink, '#f4f5f8') >= 4.5, `${color}: light card difficulty-name contrast`);
    assert(c.contrast(card.ink, card.tint) >= 3.2, `${color}: engraved large name remains readable on its theme sheet`);
    assert(c.contrast('#ffffff', card.fill) >= 4.5, `${color}: dark card title contrast`);
    for (const bg of [card.fill,c.mix(card.fill,'#ffffff',.095,'rgb')]) {
        for (const ink of [card.nameInk,card.nameShade]) assert(c.contrast(c.mix(bg,ink,.88,'rgb'),bg) >= 3.2, `${color}: translucent large name contrast`);
    }
}
const yellow = c(p.cardForColor('#e8b72f').tint);
assert(yellow.hsl()[0] > 40 && yellow.hsl()[0] < 60, 'PHM remains middle yellow when lightened');
for (const color of ['#ff7f50','#e8b72f','#2e8b57',p.met.light,p.met.dark,'#9270d6','#888888']) {
    const glass = p.glassForColor(color);
    assert(c(glass.wash).alpha() < .5, 'Day glass remains translucent');
    assert(c(glass.nightWash).alpha() < c(glass.wash).alpha(), 'Night glass lets the dark background through');
    for (const [state,ink] of [['day',glass.ink],['night',glass.nightInk],['active',glass.activeInk],['dayActive','#ffffff']]) {
        const minimum = Math.min(...glass.samples[state].map(bg => c.contrast(ink,bg)));
        assert(minimum >= 4.5, `${color} ${state}: composited glass contrast ${minimum}`);
    }
    const card = p.cardForColor(color);
    assert(c.contrast(card.slotInk,card.slot) >= 4.5);
    assert(c.contrast(card.slotInk,card.nightSlot) >= 4.5);
}
vm.runInContext(source, fallback);
assert.equal(fallback.QualithmPalette.met.light, p.met.light);
assert.equal(fallback.QualithmPalette.met.dark, p.met.dark);
console.log('palette-check: PASS — Chroma.js OKLCH, day/night contrast and offline fallback');
