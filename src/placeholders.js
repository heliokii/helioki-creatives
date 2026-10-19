// Gallery-only stand-in art, drawn from the --hc-* palette in style.css.
const palette = [
  ['#6b7350', '#e9e5d6'],
  ['#e9e5d6', '#1c1c1c'],
  ['#1c1c1c', '#9aa27c'],
  ['#9aa27c', '#141414'],
  ['#e9a14a', '#0b0b0b'],
]

const motifs = [
  (fg) => `<circle cx="50" cy="50" r="26" fill="${fg}"/>`,
  (fg) => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<circle cx="${30 + c * 20}" cy="${30 + r * 20}" r="8" fill="${fg}"/>`)).join(''),
  (fg) => `<path d="M14 80 A36 36 0 0 1 86 80" fill="none" stroke="${fg}" stroke-width="10"/>`,
  (fg) => `<rect x="22" y="22" width="56" height="56" rx="10" fill="none" stroke="${fg}" stroke-width="8"/>`,
]

// 4:5 SVG stand-ins in the showcase palette; swap for `{ src, alt }` of real work.
export function makeTiles(count) {
  return Array.from({ length: count }, (_, i) => {
    const [bg, fg] = palette[i % palette.length]
    const motif = motifs[(i + Math.floor(i / palette.length)) % motifs.length]
    const n = String(i + 1).padStart(2, '0')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125"><rect width="100" height="125" fill="${bg}"/><g transform="translate(0 10)">${motif(fg)}</g><text x="10" y="114" font-family="ui-monospace,monospace" font-size="11" fill="${fg}">${n}</text></svg>`
    return { src: `data:image/svg+xml,${encodeURIComponent(svg)}`, alt: `Placeholder tile ${n}` }
  })
}
