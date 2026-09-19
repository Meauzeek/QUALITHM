/* Shared conservative iTunes matching for editor and maintenance tools. */
(function (root) {
    const normalize = value => String(value || '').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    function rank(results, { title, artist, category, alias }) {
        const titles = [title, alias].filter(Boolean).map(normalize);
        const author = normalize(artist);
        return results.map(track => {
            const name = normalize(track.trackName);
            const performer = normalize(track.artistName);
            // Short titles such as iL and V. require an exact title match.
            const exact = titles.includes(name);
            const related = titles.some(t => t.length >= 5 && (name.startsWith(t) || t.startsWith(name)) && name.length >= 5);
            const artistMatch = !author || performer === author || performer.includes(author) || author.includes(performer) && performer.length >= 3;
            if ((!exact && !related) || !artistMatch) return null;
            const gameMatch = normalize(track.collectionName).includes(normalize(category)) && Boolean(category);
            return { track, score: (exact ? 100 : 40) + (gameMatch ? 30 : 0) };
        }).filter(Boolean).sort((a, b) => b.score - a.score).map(entry => entry.track);
    }
    async function search(query, fetcher = fetch) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
            const term = `${query.title} ${query.artist || ''}`.trim();
            const response = await fetcher(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=20`, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP_${response.status}`);
            const data = await response.json();
            return rank(data.results || [], query).slice(0, 8);
        } finally { clearTimeout(timer); }
    }
    root.MetadataLookup = { rank, search };
    if (typeof module !== 'undefined') module.exports = root.MetadataLookup;
})(globalThis);
