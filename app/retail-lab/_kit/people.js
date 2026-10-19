// Semi-realistic 3D-render style people for the Retail Lab, ported from the bullwhip
// video. person() returns SVG markup; PEOPLE_DEFS holds the shared gradients and
// must be on the page once (see People in ./people-view.jsx).
const f2 = (n) => n.toFixed(2);

// the cast: semi-realistic, 3D-render style people (sculpted faces, irises, lashes, lips, hair volume, fabric folds)
const CAST = {
  shopper: { skin: '#f0c3a0', hair: '#5a3524', iris: '#5b7a3a', lip: '#c4645a', style: 'long', shirt: '#14a596', pants: '#3b5a8f', shoe: '#ece7df', sleeve: 'short', acc: 'bag', tilt: -3 },
  store:   { skin: '#c68a62', hair: '#1f1a17', iris: '#4a2f1e', lip: '#a05646', style: 'short', shirt: '#86b8e8', pants: '#33313f', shoe: '#2b2b33', sleeve: 'long', acc: 'apron', tilt: 2 },
  dc:      { skin: '#7f4f33', hair: '#141010', iris: '#2c1a12', lip: '#7d3b33', style: 'bun', shirt: '#36437f', pants: '#24283d', shoe: '#1f1f26', sleeve: 'long', acc: 'clip', tilt: -2 },
  vendor:  { skin: '#e2aa82', hair: '#6a4024', iris: '#4a6f8f', lip: '#b0604f', style: 'hat', shirt: '#6b7684', pants: '#3a3f4a', shoe: '#5a3d24', sleeve: 'long', acc: 'vest', tilt: 1.5 },
};
const sh = (hex, p) => {
  const n = parseInt(hex.slice(1), 16), f = (c) => Math.round(p < 0 ? c * (1 + p) : c + (255 - c) * p);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('');
};
// mirror a path across the body's centre line (x → 160 − x) to build the left side
const mir = (d) => { let i = 0; return d.replace(/-?\d*\.?\d+/g, (m) => (i++ % 2 ? m : String(+(160 - m).toFixed(1)))); };

// shading: limbs and cloth lit from the left, faces from the upper left, a soft top-light over the torso
const shade = (id, col) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">` +
  `<stop offset="0" stop-color="${sh(col, -.3)}"/><stop offset=".3" stop-color="${sh(col, .14)}"/><stop offset=".62" stop-color="${col}"/><stop offset="1" stop-color="${sh(col, -.34)}"/></linearGradient>`;
export const PEOPLE_DEFS = (Object.entries(CAST).map(([k, c]) =>
  `<radialGradient id="fc-${k}" cx=".4" cy=".36" r=".72"><stop offset="0" stop-color="${sh(c.skin, .2)}"/><stop offset=".6" stop-color="${c.skin}"/><stop offset="1" stop-color="${sh(c.skin, -.24)}"/></radialGradient>` +
  `<radialGradient id="ir-${k}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${sh(c.iris, .35)}"/><stop offset=".7" stop-color="${c.iris}"/><stop offset="1" stop-color="${sh(c.iris, -.5)}"/></radialGradient>` +
  shade(`sk-${k}`, c.skin) + shade(`sh-${k}`, c.shirt) + shade(`pa-${k}`, c.pants) +
  `<linearGradient id="hr-${k}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${sh(c.hair, .32)}"/><stop offset=".42" stop-color="${c.hair}"/><stop offset="1" stop-color="${sh(c.hair, -.42)}"/></linearGradient>`).join('') +
  shade('ap', '#ff7a1a') + shade('vs', '#ff8a1f') + shade('bg', '#f2b94a') +
  `<radialGradient id="tsh" cx=".34" cy=".2" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></radialGradient>` +
  `<linearGradient id="hat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27e"/><stop offset=".6" stop-color="#f7bd16"/><stop offset="1" stop-color="#e09a00"/></linearGradient>` +
  `<filter id="soft" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>`);

const BROW = {
  smile: ['M63 53.5 Q69 50 76.5 52.2', 'M83.5 52.2 Q91 50 97 53.5'],
  worry: ['M63 54.5 Q69 52.5 76.5 49.8', 'M83.5 49.8 Q91 52.5 97 54.5'],
  flat: ['M63 53 Q69 51.6 76.5 52.6', 'M83.5 52.6 Q91 51.6 97 53'],
  o: ['M63 50.5 Q69 46 76.5 48.6', 'M83.5 48.6 Q91 46 97 50.5'],
};
const mouth = (m, lip, skin) => {
  const up = sh(lip, -.14), crease = sh(skin, -.28);
  return {
    smile: `<path d="M70.6 82.4 Q70 84 71 85.4 M89.4 82.4 Q90 84 89 85.4" stroke="${crease}" stroke-width=".8" fill="none" opacity=".3"/>` +
      `<path d="M72.3 83.4 Q80 89 87.7 83.4 Q80 85.6 72.3 83.4 Z" fill="#fbf4ee"/>` +
      `<path d="M71.5 83 Q75 80.8 78 81.8 Q80 81.2 82 81.8 Q85 80.8 88.5 83 Q80 84.4 71.5 83 Z" fill="${up}"/>` +
      `<path d="M73 84.6 Q80 91.6 87 84.6 Q80 88.4 73 84.6 Z" fill="${lip}"/><path d="M77 88.4 Q80 89.4 83 88.4" stroke="rgba(255,255,255,.45)" stroke-width="1" fill="none" stroke-linecap="round"/>`,
    flat: `<path d="M72 84 Q76 82.4 78.5 83.2 Q80 82.8 81.5 83.2 Q84 82.4 88 84 Q80 85 72 84 Z" fill="${up}"/>` +
      `<path d="M73.5 84.5 Q80 89.4 86.5 84.5 Q80 86 73.5 84.5 Z" fill="${lip}"/><path d="M77.5 87 Q80 87.8 82.5 87" stroke="rgba(255,255,255,.4)" stroke-width=".9" fill="none"/>`,
    worry: `<path d="M72 86.4 Q76 82.8 78.5 83.5 Q80 83.1 81.5 83.5 Q84 82.8 88 86.4 Q80 84.9 72 86.4 Z" fill="${up}"/>` +
      `<path d="M74 86.2 Q80 89.6 86 86.2 Q80 86 74 86.2 Z" fill="${lip}"/>`,
    o: `<ellipse cx="80" cy="85.6" rx="4.6" ry="5.6" fill="${lip}"/><ellipse cx="80" cy="85.9" rx="3" ry="4" fill="#3d1714"/>`,
  }[m];
};
// eye: sclera, gradient iris, pupil, two catch-lights, lid line with an outer lash flick, and a soft crease above
const eye = (cx, k, skin, out) =>
  `<path d="M${cx - 6} 57.6 Q${cx} 54.4 ${cx + 6} 57.6" stroke="${sh(skin, -.28)}" stroke-width="1.1" fill="none" opacity=".75"/>` +
  `<ellipse cx="${cx}" cy="62" rx="5.5" ry="3.5" fill="#fbf7f3"/><circle cx="${cx}" cy="62" r="3.05" fill="url(#ir-${k})"/>` +
  `<circle cx="${cx}" cy="62" r="1.45" fill="#0f0a08"/><circle cx="${cx + 1.15}" cy="60.9" r="1" fill="#fff"/><circle cx="${cx - 1.1}" cy="63.2" r=".45" fill="#fff" opacity=".7"/>` +
  `<path d="${out < 0 ? `M${cx - 7.2} 59.6 L${cx - 5.8} 61.4 Q${cx} 57.2 ${cx + 5.8} 61.4` : `M${cx - 5.8} 61.4 Q${cx} 57.2 ${cx + 5.8} 61.4 L${cx + 7.2} 59.6`}" stroke="#22150e" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M${cx - 4.6} 64.6 Q${cx} 66.4 ${cx + 4.6} 64.6" stroke="${sh(skin, -.22)}" stroke-width=".8" fill="none" opacity=".6"/>`;

export function person(k, { h = 240, mood = 'smile', g = '', gd = 0, bo = 0 } = {}) {
  const c = CAST[k], H = `url(#hr-${k})`, SL = `url(#sh-${k})`, SK = `url(#sk-${k})`, PA = `url(#pa-${k})`;
  const hairDark = sh(c.hair, -.45), shine = 'rgba(255,255,255,.24)';
  const strands = (d, col = shine, w = 1.6) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  const hairBack = {
    long: `<path d="M51 60 Q45 23 80 22 Q115 23 109 60 L113 134 Q102 142 92 131 L93 86 L67 86 L68 131 Q58 142 47 134 Z" fill="${H}"/>` +
      strands('M52 80 Q50 104 51 128 M108 80 Q110 104 109 128 M56 96 L57 126 M104 96 L103 126', hairDark, 1.4),
    bun: `<circle cx="80" cy="24" r="13" fill="${H}"/>` + strands('M70 22 Q80 13 90 22 M71 29 Q80 35 89 29', 'rgba(255,255,255,.2)', 1.6),
  }[c.style] || '';
  const hairFront = {
    long: `<path d="M53 70 Q47 26 82 25 Q110 27 108.5 62 Q101 40 86 37.5 Q71 44 60.5 53 Q55 61 53 70 Z" fill="${H}"/>` +
      strands('M60 46 Q72 32 92 31.5 M86 37.5 Q99 41 104.5 55 M57 57 Q63 45 76 40') + strands('M66 38 Q78 33 90 34', hairDark, 1.1),
    short: `<path d="M53 63 Q48 28 80 25 Q112 27 107 63 Q105 45 97 40.5 Q86 46.5 70 41.5 Q58 44.5 53 63 Z" fill="${H}"/>` +
      `<path d="M53.5 62 Q54 55 56.5 50 L57 64 Z M106.5 62 Q106 55 103.5 50 L103 64 Z" fill="${c.hair}" opacity=".55"/>` +
      strands('M62 36 Q76 29 95 33 M68 31 Q80 27 92 29.5', shine, 1.8) + strands('M74 40 Q82 37.5 90 39', hairDark, 1.1),
    bun: `<path d="M53 64 Q50 29 80 28 Q110 29 107 64 Q103 42 80 39.5 Q57 42 53 64 Z" fill="${H}"/>` +
      strands('M61 42 Q71 33 86 33 M90 34 Q100 38 104 50') + strands('M66 38 Q80 31 96 37', hairDark, 1),
    hat: `<path d="M54 67 Q52 52 57 45.5 L59.5 69 Z M106 67 Q108 52 103 45.5 L100.5 69 Z" fill="${H}"/>` +
      `<path d="M57 74 Q61 96 80 99 Q99 96 103 74 Q99 92 80 94 Q61 92 57 74 Z" fill="${c.hair}" opacity=".26"/>` +
      `<path d="M50 47 Q51 14 80 12.5 Q109 14 110 47 Z" fill="url(#hat)"/><path d="M76 13 L84 13 L85 46 L75 46 Z" fill="rgba(255,255,255,.3)"/>` +
      `<ellipse cx="64" cy="25" rx="8.5" ry="4" fill="#fff" opacity=".5" transform="rotate(-28 64 25)"/>` +
      `<path d="M43 45 Q80 53 117 45 L117.5 51 Q80 59.5 42.5 51 Z" fill="#e09a00"/><path d="M44 46.5 Q80 54 116 46.5" stroke="rgba(255,255,255,.35)" stroke-width="1" fill="none"/>`,
  }[c.style];
  const collar = {
    bag: `<path d="M67 105 Q80 117 93 105" stroke="${sh(c.shirt, -.32)}" stroke-width="3.2" fill="none"/>`,
    apron: `<path d="M67 105 L75 121 L80 110 Z M93 105 L85 121 L80 110 Z" fill="${sh(c.shirt, .3)}" stroke="${sh(c.shirt, -.2)}" stroke-width=".8"/>`,
    clip: `<path d="M70 106 L80 128 L90 106 Q80 112 70 106 Z" fill="#f3efe8"/><path d="M69 106 L78.5 154 M91 106 L81.5 154" stroke="${sh(c.shirt, -.38)}" stroke-width="3" fill="none"/>`,
    vest: `<path d="M67 105 Q80 116 93 105" stroke="${sh(c.shirt, -.32)}" stroke-width="3.2" fill="none"/>`,
  }[c.acc];
  const vestL = 'M45 116 Q58 109 69 107 L74 247 L51 247 Q46 210 42 168 Z', bands = 'M43 178 L72 178 M45 200 L73 200 M88 178 L117 178 M87 200 L115 200';
  const over = {
    apron: `<path d="M61 133 L66 107 M99 133 L94 107" stroke="#f0700f" stroke-width="4"/><path d="M57 132 L103 132 Q105 190 107 247 L53 247 Q55 190 57 132 Z" fill="url(#ap)"/>` +
      `<path d="M66 188 L94 188 L94 211 L66 211 Z" stroke="${sh('#ff7a1a', -.32)}" stroke-width="2" fill="none"/><path d="M80 188 L80 211" stroke="${sh('#ff7a1a', -.32)}" stroke-width="1.5"/>` +
      `<rect x="84" y="142" width="15" height="8" rx="2" fill="#fff"/><path d="M62 160 Q64 200 61 240 M98 160 Q96 200 99 240" stroke="rgba(0,0,0,.12)" stroke-width="2" fill="none"/>`,
    vest: `<path d="${vestL}" fill="url(#vs)"/><path d="${mir(vestL)}" fill="url(#vs)"/>` +
      `<path d="${bands}" stroke="#eef1f5" stroke-width="5"/><path d="${bands}" stroke="#aab2bd" stroke-width="1.1"/>` +
      `<path d="M70 120 L72 240 M90 120 L88 240" stroke="rgba(0,0,0,.15)" stroke-width="1.4"/>`,
    clip: `<path d="M71 108 L80 150 L89 108" stroke="#ff7a1a" stroke-width="2.4" fill="none"/><rect x="73" y="150" width="14" height="19" rx="2" fill="#fff"/><rect x="76" y="153" width="8" height="7" rx="1" fill="#c9d3ea"/>`,
    bag: '',
  }[c.acc];
  // left hand: tote bag or clipboard
  const heldUnder = c.acc === 'clip' ? `<g transform="rotate(-8 40 258)"><rect x="26" y="238" width="28" height="36" rx="3" fill="#f6eee0" stroke="#8a6a4a" stroke-width="1.6"/>` +
    `<rect x="35" y="234" width="10" height="6" rx="2" fill="#8a6a4a"/><path d="M31 250 L49 250 M31 257 L49 257 M31 264 L43 264" stroke="#c4b096" stroke-width="2"/></g>` : '';
  const heldOver = c.acc === 'bag' ? `<path d="M23 292 L57 292 L59 336 L21 336 Z" fill="url(#bg)"/><path d="M24 300 L58 300" stroke="rgba(0,0,0,.12)" stroke-width="1.5"/>` +
    `<path d="M29 294 Q31 262 40 262 Q49 262 51 294" stroke="#c48a1a" stroke-width="2.5" fill="none"/>` : '';

  const upperD = 'M104 115 Q118 108 127 121 Q130 150 129 188 Q122 196 114 189 Q112 150 104 115 Z';
  const foreD = 'M114 186 Q121 183 129 186 Q128 216 125.5 246 Q119.5 251 114 246 Q113 216 114 186 Z';
  const handD = 'M113.5 244 Q111.5 256 113.5 264 Q115.5 271.5 120 272 Q124.5 272 126.5 265 Q128 256 126 244 Z';
  const short = c.sleeve === 'short';
  const arm = (side, under = '', over2 = '') => {
    const m = side === 'l' ? mir : (d) => d;
    const up = short ? `<path d="${m(upperD)}" fill="${SK}"/><path d="${m('M104 115 Q118 108 127 121 Q128.5 136 128.5 153 L112.5 153 Q110 132 104 115 Z')}" fill="${SL}"/>` +
      `<path d="${m('M112.5 153 L128.5 153')}" stroke="${sh(c.shirt, -.3)}" stroke-width="1.6"/>` : `<path d="${m(upperD)}" fill="${SL}"/>`;
    const fore = `<path d="${m(foreD)}" fill="${short ? SK : SL}"/>` +
      `<path d="${m('M116 186 Q121.5 189.5 127.5 186')}" stroke="rgba(0,0,0,.2)" stroke-width="1.4" fill="none"/>` +
      (short ? '' : `<path d="${m('M114 239.5 Q119.8 242 125.8 239.5')}" stroke="${sh(c.shirt, -.38)}" stroke-width="2" fill="none"/>`) + under +
      `<path d="${m(handD)}" fill="${SK}"/>` +
      `<path d="${m('M117 262 L117.4 270.4 M120.4 263 L120.6 271.6 M123.6 262 L123.6 269.6')}" stroke="${sh(c.skin, -.32)}" stroke-width=".8" opacity=".7"/>` +
      `<path d="${m('M114 249 Q109.6 255 111.8 262')}" stroke="${sh(c.skin, -.16)}" stroke-width="3.4" fill="none" stroke-linecap="round"/>` +
      `<path d="${m('M116 248 Q120 246.5 124 248')}" stroke="rgba(255,255,255,.25)" stroke-width="1.2" fill="none"/>` + over2;
    return `<g class="arm ${side}">${up}<g class="fore ${side}">${fore}</g></g>`;
  };
  const legL = 'M56 244 L79 244 Q79.5 300 77.5 340 Q76.5 366 75.5 392 L61.5 392 Q59 366 58 340 Q55.5 300 56 244 Z';
  const shoeL = 'M60 386 L77 386 Q79.5 394 78.5 403 L52 403 Q46.5 403 47 399 Q48.5 392 60 386 Z';
  const torso = 'M67 104 Q80 112 93 104 Q111 107 119 115 Q127 123 125 138 L120 176 Q114 212 110 238 Q108 248 102 249 L58 249 Q52 248 50 238 Q46 212 40 176 L35 138 Q33 123 41 115 Q49 107 67 104 Z';
  const ear = (x, dir) => `<ellipse cx="${x}" cy="65" rx="5" ry="8.5" fill="${sh(c.skin, -.12)}"/><path d="M${x + dir * 1.5} 60 Q${x - dir * 1.5} 65 ${x + dir * 1} 70.5" stroke="${sh(c.skin, -.35)}" stroke-width="1" fill="none"/>`;
  const face = 'M53.5 60 Q53 30 80 30 Q107 30 106.5 60 Q106 81 96 91 Q88 98 80 98 Q72 98 64 91 Q54 81 53.5 60 Z';
  const head = `<g class="head"><g transform="translate(80 96) rotate(${c.tilt}) scale(1.14) translate(-80 -96)">${hairBack}` +
    ear(54, -1) + ear(106, 1) +
    `<path d="${face}" fill="url(#fc-${k})"/>` +
    `<path d="M100 40 Q108.5 58 104.5 78 Q100.5 90 92 95.5 Q101.5 80 101.5 62 Q101.5 50 100 40 Z" fill="rgba(0,0,0,.1)"/>` +
    `<path d="M60 86 Q70 97 80 98 Q90 97 100 86 Q92 93 80 94 Q68 93 60 86 Z" fill="rgba(0,0,0,.09)"/>` +
    `<ellipse cx="74" cy="42" rx="13" ry="6" fill="#fff" opacity=".13"/><ellipse cx="64" cy="70.5" rx="5" ry="2.4" fill="#fff" opacity=".12"/><ellipse cx="80" cy="93" rx="5" ry="2.2" fill="#fff" opacity=".12"/>` +
    `<ellipse cx="65" cy="75" rx="6" ry="3.6" fill="#e86e64" opacity=".2"/><ellipse cx="95" cy="75" rx="6" ry="3.6" fill="#e86e64" opacity=".2"/>` +
    BROW[mood].map((d) => `<path d="${d}" stroke="${sh(c.hair, -.15)}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${sh(c.hair, .2)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/>`).join('') +
    `<g class="eyes">${eye(70, k, c.skin, -1)}${eye(90, k, c.skin, 1)}</g>` +
    `<path d="M83 60 Q84.2 68 84.6 74" stroke="${sh(c.skin, -.28)}" stroke-width="1.3" fill="none" opacity=".38" stroke-linecap="round"/>` +
    `<ellipse cx="80" cy="75.4" rx="4.3" ry="3" fill="${sh(c.skin, .07)}"/><ellipse cx="79" cy="74" rx="1.5" ry=".9" fill="#fff" opacity=".5"/>` +
    `<ellipse cx="77.2" cy="77.2" rx="1.3" ry=".8" fill="${sh(c.skin, -.45)}"/><ellipse cx="82.8" cy="77.2" rx="1.3" ry=".8" fill="${sh(c.skin, -.45)}"/>` +
    `<path d="M75 78.6 Q80 80.6 85 78.6" stroke="${sh(c.skin, -.3)}" stroke-width="1.1" fill="none" opacity=".6"/>` +
    `<path d="M80 80.4 L80 81.6" stroke="${sh(c.skin, -.25)}" stroke-width="1.6" opacity=".4"/>` +
    mouth(mood, c.lip, c.skin) + hairFront + `</g></g>`;

  return `<svg class="person ${g ? 'g-' + g : ''}" viewBox="0 0 160 420" style="height:${h}px;width:${(h * 160 / 420).toFixed(1)}px;--gd:${f2(gd)}s;--bo:${f2(bo)}s;--bl:${f2(bo * 1.7)}s">` +
    `<ellipse cx="80" cy="406" rx="46" ry="7" fill="rgba(70,45,20,.34)" filter="url(#soft)"/>` +
    `<path d="${legL}" fill="${PA}"/><path d="${mir(legL)}" fill="${PA}"/>` +
    `<ellipse cx="67.5" cy="318" rx="5" ry="11" fill="#fff" opacity=".07"/><ellipse cx="92.5" cy="318" rx="5" ry="11" fill="#fff" opacity=".07"/>` +
    `<path d="M67 262 L67.5 300 M93 262 L92.5 300" stroke="rgba(255,255,255,.12)" stroke-width="2"/>` +
    `<path d="M61.5 386 Q68.5 382.5 75.5 386 M98.5 386 Q91.5 382.5 84.5 386" stroke="rgba(0,0,0,.22)" stroke-width="1.4" fill="none"/>` +
    `<path d="${shoeL}" fill="${c.shoe}"/><path d="${mir(shoeL)}" fill="${c.shoe}"/>` +
    `<path d="M47 401 L78.5 401 M113 401 L81.5 401" stroke="${sh(c.shoe, -.45)}" stroke-width="2.4"/>` +
    `<path d="M52 396 Q58 391 68 391 M108 396 Q102 391 92 391" stroke="rgba(255,255,255,.35)" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
    `<g class="upper"><path d="M69 88 L91 88 L93 114 Q80 120 67 114 Z" fill="${SK}"/><ellipse cx="80" cy="97" rx="13" ry="5" fill="rgba(0,0,0,.2)"/>` +
    `<path d="${torso}" fill="${SL}"/><path d="${torso}" fill="url(#tsh)"/>` +
    `<path d="M50 150 Q55 172 53 198 M110 150 Q105 172 107 198 M62 226 Q70 230 78 227 M84 230 Q92 233 99 228" stroke="rgba(0,0,0,.12)" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `<path d="M113 112 Q123 117 124.5 130" stroke="rgba(255,255,255,.25)" stroke-width="2" fill="none"/>` +
    `<rect x="53" y="236" width="54" height="10" rx="2" fill="${sh(c.pants, -.42)}"/><rect x="76" y="237" width="8" height="8" rx="1.5" fill="#c9b27a"/>` +
    collar + over + arm('l', heldUnder, heldOver) + arm('r') + head + `</g></svg>`;
}
