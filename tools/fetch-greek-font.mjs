// Reproducible local Greek subset; one font includes letters and combining marks.
import fs from 'node:fs';
const ranges = [[0x300, 0x36f], [0x370, 0x3ff], [0x1f00, 0x1fff]];
const text = ranges.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i))).join('');
const cssUrl = 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400..700&display=swap&text=' + encodeURIComponent(text);
const response = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' }, signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`Font CSS: ${response.status}`);
const css = await response.text();
const url = css.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\) format\('woff2'\)/)?.[1];
if (!url) throw new Error('Expected Google Fonts WOFF2 response');
const font = await fetch(url, { signal: AbortSignal.timeout(15000) });
if (!font.ok) throw new Error(`Font: ${font.status}`);
const bytes = Buffer.from(await font.arrayBuffer());
if (bytes.subarray(0, 4).toString() !== 'wOF2') throw new Error('Invalid WOFF2 signature');
fs.writeFileSync(new URL('../assets/fonts/noto-sans-greek.woff2', import.meta.url), bytes);
console.log(`Noto Sans Greek: ${bytes.length} bytes; Greek + Greek Extended + combining marks`);
