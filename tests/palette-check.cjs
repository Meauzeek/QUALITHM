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
vm.runInContext(source, fallback);
assert.equal(fallback.QualithmPalette.met.light, p.met.light);
assert.equal(fallback.QualithmPalette.met.dark, p.met.dark);
console.log('palette-check: PASS — Chroma.js OKLCH, day/night contrast and offline fallback');
