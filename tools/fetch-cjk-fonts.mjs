import fs from 'node:fs/promises';
const base = 'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansjp/';
for (const file of ['IBMPlexSansJP-Medium.ttf', 'IBMPlexSansJP-SemiBold.ttf', 'IBMPlexSansJP-Bold.ttf', 'OFL.txt']) {
  const response = await fetch(base + file, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${file}: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await fs.writeFile(new URL('../assets/fonts/' + (file === 'OFL.txt' ? 'OFL-IBMPlexSansJP.txt' : file), import.meta.url), bytes);
  console.log(file, bytes.length);
}
