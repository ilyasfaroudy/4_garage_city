// Stylised, non-geographic scheme of Saint Petersburg in a 1600 × 1000 world.
// Used both by the interactive network map and by the hero graphic layer.

export const CITY = { w: 1600, h: 1000 };
export const ORIGIN = { x: 1120, y: 583, label: 'YOU / NEVSKY 112' };
export const METERS_PER_UNIT = 8;

const GULF = 'M0 0 H318 C300 70 262 120 252 200 C244 262 262 300 250 360 C238 420 214 470 222 540 C230 600 212 660 196 720 C178 790 196 860 168 930 C156 962 150 985 146 1000 H0 Z';

const RIVERS = [
  { id: 'neva', w: 62, d: 'M1640 624 C1520 610 1450 580 1400 540 C1350 500 1320 460 1260 440 C1190 418 1120 425 1060 445 C1010 460 960 470 905 472' },
  { id: 'bolshaya-neva', w: 54, d: 'M905 472 C850 480 790 505 730 545 C660 592 560 628 440 640 C360 648 290 652 200 664' },
  { id: 'malaya-neva', w: 30, d: 'M905 468 C870 440 820 415 760 405 C680 392 590 392 500 378 C420 366 340 350 240 340' },
  { id: 'bolshaya-nevka', w: 30, d: 'M1030 450 C1018 380 1000 320 960 280 C910 232 820 210 720 200 C620 190 480 178 240 150' },
  { id: 'malaya-nevka', w: 20, d: 'M800 206 C740 250 650 282 560 290 C470 298 380 292 240 280' },
  { id: 'fontanka', w: 9, d: 'M1080 440 C1072 530 1040 610 975 650 C905 692 815 684 772 640 C752 618 744 590 748 548' },
  { id: 'moika', w: 5, d: 'M1066 452 C1030 500 990 520 940 522 C880 524 830 530 770 540' },
  { id: 'griboedov', w: 4, d: 'M1050 500 C1020 560 960 585 900 590 C850 595 815 615 790 650' },
  { id: 'obvodny', w: 10, d: 'M1395 548 C1320 640 1180 742 1010 786 C880 818 740 800 640 752 C590 728 520 690 440 672 C400 664 360 660 330 655' },
];

const ROADS = [
  { id: 'nevsky', major: true, d: 'M880 515 L1185 602 L1372 560' },
  { id: 'kamennoostrovsky', major: true, d: 'M880 515 L884 470 C860 400 830 320 800 240 C790 205 780 170 770 110 L760 0' },
  { id: 'moskovsky', major: true, d: 'M880 515 C892 620 915 760 935 860 L960 1000' },
  { id: 'ligovsky', major: false, d: 'M1185 602 C1175 700 1160 820 1150 1000' },
  { id: 'liteyny', major: true, d: 'M1100 600 L1068 445 C1080 360 1100 250 1120 120 L1135 0' },
  { id: 'sampsonievsky', major: false, d: 'M1010 290 C1040 220 1060 140 1070 0' },
  { id: 'bolshoy-ps', major: false, d: 'M600 365 C690 345 770 322 860 296 C915 281 955 276 1000 272 L1250 250' },
  { id: 'bolshoy-vo', major: false, d: 'M300 560 L800 462' },
  { id: 'sredny-vo', major: false, d: 'M280 500 L790 445' },
  { id: 'stachek', major: true, d: 'M820 700 C770 790 715 890 690 1000' },
  { id: 'primorsky', major: false, d: 'M250 70 C420 95 600 120 780 150 C830 160 880 170 930 190' },
  { id: 'zsd', major: true, dashed: true, d: 'M300 0 C280 200 260 420 280 600 C300 780 260 900 240 1000' },
  { id: 'ring', major: true, d: 'M0 880 C300 960 700 980 1000 960 C1250 940 1450 880 1640 790' },
  { id: 'okhta', major: false, d: 'M1260 440 C1300 380 1380 300 1450 200 L1520 0' },
  { id: 'zanevsky', major: false, d: 'M1330 470 L1600 420' },
  { id: 'obukhov', major: false, d: 'M1372 560 C1420 650 1480 760 1560 1000' },
];

const PARKS = [
  'M330 214 L520 204 L540 246 L362 262 Z',
  'M1150 482 L1215 476 L1221 522 L1156 527 Z',
  'M1040 462 L1068 458 L1072 498 L1046 501 Z',
  'M1000 880 L1080 875 L1090 940 L1005 945 Z',
  'M470 740 L560 748 L555 800 L465 795 Z',
  'M1240 120 L1360 100 L1380 190 L1270 210 Z',
];

const DISTRICTS = [
  { id: 'primorsky', label: 'PRIMORSKY', c: [520, 70], a: -8, cell: [42, 30], at: [380, 48] },
  { id: 'krestovsky', label: 'KRESTOVSKY', c: [450, 238], a: -5, cell: [46, 34], at: [560, 230] },
  { id: 'petrogradsky', label: 'PETROGRADSKY', c: [740, 310], a: -18, cell: [30, 24], at: [690, 266] },
  { id: 'vyborgsky', label: 'VYBORGSKY', c: [1170, 260], a: 8, cell: [40, 32], at: [1080, 210] },
  { id: 'vasileostrovsky', label: 'VASILEOSTROVSKY', c: [560, 495], a: -7, cell: [24, 40], at: [420, 440] },
  { id: 'sevkabel', label: 'SEVKABEL', c: [300, 590], a: -7, cell: [50, 36], at: [270, 612] },
  { id: 'center', label: 'CENTER', c: [960, 570], a: -18, cell: [30, 26], at: [860, 600] },
  { id: 'ligovsky', label: 'LIGOVSKY', c: [1260, 640], a: 4, cell: [34, 28], at: [1240, 700] },
  { id: 'obvodny', label: 'OBVODNY', c: [1150, 830], a: -20, cell: [44, 30], at: [1160, 860] },
  { id: 'moskovsky', label: 'MOSKOVSKY', c: [930, 930], a: 2, cell: [38, 30], at: [990, 975] },
  { id: 'narvsky', label: 'NARVSKY', c: [640, 880], a: -12, cell: [36, 30], at: [520, 900] },
  { id: 'okhta', label: 'OKHTA', c: [1450, 330], a: 15, cell: [44, 34], at: [1420, 300] },
  { id: 'nevsky', label: 'NEVSKY', c: [1480, 790], a: -25, cell: [44, 34], at: [1450, 720] },
];

const WATER_LABELS = [
  { text: 'GULF OF FINLAND', x: 60, y: 520, r: -90 },
  { text: 'NEVA', x: 1300, y: 470, r: 22 },
  { text: 'BOLSHAYA NEVA', x: 560, y: 630, r: -12 },
  { text: 'MALAYA NEVA', x: 560, y: 392, r: 3 },
  { text: 'B. NEVKA', x: 860, y: 222, r: 10 },
];

const BOUNDARIES = [
  'M860 790 L820 1000',
  'M1185 602 L1240 760',
  'M960 280 L1000 0',
  'M1372 560 L1460 620',
];

function rng(seed) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

let blocksCache = null;

/**
 * City blocks: every district has its own rotated street grid; a cell belongs
 * to the district whose centre is nearest (a cheap Voronoi split). Water is
 * painted above, so blocks under rivers simply disappear.
 */
export function blocksPath() {
  if (blocksCache) return blocksCache;
  const random = rng(1703);
  const parts = [];
  const nearest = (x, y) => {
    let best = null;
    let bestDistance = Infinity;
    for (const district of DISTRICTS) {
      const d = (x - district.c[0]) ** 2 + (y - district.c[1]) ** 2;
      if (d < bestDistance) { bestDistance = d; best = district; }
    }
    return best;
  };
  const r1 = (v) => Math.round(v * 10) / 10;

  for (const district of DISTRICTS) {
    const angle = (district.a * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const [cw, ch] = district.cell;
    const toWorld = (u, v) => [district.c[0] + u * cos - v * sin, district.c[1] + u * sin + v * cos];
    const reach = 1100;
    for (let u = -reach; u < reach; u += cw) {
      for (let v = -reach; v < reach; v += ch) {
        const [cx, cy] = toWorld(u + cw / 2, v + ch / 2);
        if (cx < -20 || cy < -20 || cx > 1620 || cy > 1020) continue;
        if (nearest(cx, cy) !== district) continue;
        const roll = random();
        if (roll < 0.06) continue;
        const gap = 5;
        const rects = roll > 0.72
          ? [[u + gap, v + gap, cw / 2 - gap, ch - gap * 2], [u + cw / 2 + 1, v + gap, cw / 2 - gap - 1, ch - gap * 2]]
          : [[u + gap, v + gap, cw - gap * 2, ch - gap * 2]];
        for (const [x, y, w, h] of rects) {
          const pts = [toWorld(x, y), toWorld(x + w, y), toWorld(x + w, y + h), toWorld(x, y + h)];
          parts.push(`M${pts.map(([px, py]) => `${r1(px)} ${r1(py)}`).join('L')}Z`);
        }
      }
    }
  }
  blocksCache = parts.join('');
  return blocksCache;
}

function riversMarkup(edgeStroke, waterStroke, edgeExtra = 2.5) {
  const edges = RIVERS.map((r) => `<path d="${r.d}" stroke="${edgeStroke}" stroke-width="${r.w + edgeExtra}"/>`).join('');
  const water = RIVERS.map((r) => `<path d="${r.d}" stroke="${waterStroke}" stroke-width="${r.w}"/>`).join('');
  return { edges, water };
}

export function routePath(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const diagonal = Math.min(Math.abs(dx), Math.abs(dy));
  const mx = from.x + Math.sign(dx) * diagonal;
  const my = from.y + Math.sign(dy) * diagonal;
  const straight = Math.abs(Math.abs(dx) - Math.abs(dy));
  const length = diagonal * Math.SQRT2 + straight;
  return { d: `M${from.x} ${from.y}L${mx} ${my}L${to.x} ${to.y}`, length, mid: { x: mx, y: my } };
}

export function buildNetworkMap(svg) {
  const { edges, water } = riversMarkup('rgba(243,243,240,.26)', 'url(#gcWater)');
  const grid = [];
  for (let x = 0; x <= CITY.w; x += 100) {
    grid.push(`<path d="M${x} 0V${CITY.h}" class="${x % 400 === 0 ? 'g-strong' : ''}"/>`);
  }
  for (let y = 0; y <= CITY.h; y += 100) {
    grid.push(`<path d="M0 ${y}H${CITY.w}" class="${y % 400 === 0 ? 'g-strong' : ''}"/>`);
  }
  const letters = 'ABCDEFGHIJKLMNOP';
  const coords = [];
  for (let i = 0; i < 16; i += 1) coords.push(`<text x="${i * 100 + 6}" y="16">${letters[i]}</text>`);
  for (let j = 1; j < 10; j += 1) coords.push(`<text x="6" y="${j * 100 + 14}">${String(j).padStart(2, '0')}</text>`);

  svg.innerHTML = `
    <defs>
      <pattern id="gcWater" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#080808"/><path d="M0 .5H6" stroke="rgba(243,243,240,.07)"/>
      </pattern>
      <pattern id="gcPark" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0V7" stroke="rgba(243,243,240,.14)"/>
      </pattern>
    </defs>
    <g class="map-camera">
      <g class="map-layer" data-depth="0.15">
        <rect width="${CITY.w}" height="${CITY.h}" fill="#141414"/>
        <path class="map-blocks" d="${blocksPath()}"/>
        <g class="map-parks">${PARKS.map((d) => `<path d="${d}"/>`).join('')}</g>
      </g>
      <g class="map-layer map-water" data-depth="0">
        <path d="${GULF}" fill="url(#gcWater)" stroke="rgba(243,243,240,.26)" stroke-width="1.2"/>
        <g fill="none" stroke-linecap="round">${edges}${water}</g>
      </g>
      <g class="map-layer" data-depth="0.35">
        <g class="map-grid">${grid.join('')}</g>
        <g class="map-boundaries">${BOUNDARIES.map((d) => `<path d="${d}"/>`).join('')}</g>
        <g class="map-roads">${ROADS.map((r) => `<path d="${r.d}" class="${r.major ? 'is-major' : ''} ${r.dashed ? 'is-dashed' : ''}"/>`).join('')}</g>
      </g>
      <g class="map-layer" data-depth="0.6">
        <g class="map-labels">
          ${DISTRICTS.map((d) => `<text x="${d.at[0]}" y="${d.at[1]}">${d.label}</text>`).join('')}
        </g>
        <g class="map-water-labels">
          ${WATER_LABELS.map((w) => `<text transform="translate(${w.x} ${w.y}) rotate(${w.r})">${w.text}</text>`).join('')}
        </g>
        <g class="map-coords">${coords.join('')}</g>
      </g>
      <g class="map-route-layer">
        <path class="map-route" pathLength="1" d=""/>
        <g class="map-route-label" hidden>
          <rect x="0" y="-13" width="128" height="18"/>
          <text x="6" y="0"></text>
        </g>
        <g class="map-origin" transform="translate(${ORIGIN.x} ${ORIGIN.y})">
          <circle r="9" class="map-origin__ring"/>
          <rect x="-3" y="-3" width="6" height="6"/>
          <text x="14" y="18">${ORIGIN.label}</text>
        </g>
      </g>
    </g>`;
  return {
    camera: svg.querySelector('.map-camera'),
    layers: [...svg.querySelectorAll('.map-layer')].map((el) => ({ el, depth: Number(el.dataset.depth) })),
    route: svg.querySelector('.map-route'),
    routeLabel: svg.querySelector('.map-route-label'),
  };
}

export function buildHeroMap(svg, spaces) {
  const { edges, water } = riversMarkup('rgba(5,5,5,.55)', '#F3F3F0', 2);
  const featured = spaces.find((s) => s.code === '04') || spaces[0];
  const route = featured ? routePath(ORIGIN, featured.coordinates) : null;
  svg.setAttribute('viewBox', '380 40 1180 900');
  svg.innerHTML = `
    <g class="hero-map__blocks"><path d="${blocksPath()}"/></g>
    <g class="hero-map__water">
      <path d="${GULF}" fill="#F3F3F0" stroke="#050505" stroke-width="1" pathLength="1" class="draw"/>
      <g fill="none" stroke-linecap="round" class="hero-map__rivers">${edges}</g>
      <g fill="none" stroke-linecap="round">${water}</g>
    </g>
    <g class="hero-map__roads" fill="none">
      ${ROADS.map((r, i) => `<path d="${r.d}" pathLength="1" class="draw" style="--i:${i}"/>`).join('')}
    </g>
    ${route ? `<path class="hero-map__route draw" pathLength="1" d="${route.d}"/>` : ''}
    <g class="hero-map__points">
      ${spaces.map((s, i) => `
        <g class="hero-map__point" style="--i:${i}" transform="translate(${s.coordinates.x} ${s.coordinates.y})">
          <path d="M-7 0H7M0 -7V7"/>
          <text x="10" y="-8">${s.code}</text>
        </g>`).join('')}
      <g class="hero-map__point hero-map__point--origin" style="--i:12" transform="translate(${ORIGIN.x} ${ORIGIN.y})">
        <rect x="-4" y="-4" width="8" height="8"/>
        <text x="10" y="16">YOU</text>
      </g>
    </g>`;
}
