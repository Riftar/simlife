// The eyes, ears and neckline are shared anchors for every interchangeable layer.
export const portraitPalette = {
  skin: {
    porcelain: "#f3d2ae", sand: "#e8b78f", peach: "#d8956f", olive: "#be8a62",
    copper: "#a56a4d", umber: "#824d38", deep: "#633d32",
  },
  hairColor: {
    ink: "#211e21", espresso: "#3e2b25", chestnut: "#654132", auburn: "#893f32",
    gold: "#bb884f", silver: "#a5a6a1", indigo: "#443952",
  },
  clothingColor: {
    teal: "#236d67", indigo: "#4b5e79", rust: "#ab5342", mustard: "#ab792d",
    plum: "#74566f", moss: "#626d45", cream: "#ddd0ae", charcoal: "#384644",
  },
  background: {
    sage: "#d9e2ce", sky: "#d7e6e6", rose: "#ead5ce", straw: "#efe0bd",
    stone: "#e5ded0", lilac: "#e2dbe6", transparent: "none",
  },
};

const faces = {
  oval: "M28 33 Q28 17 48 17 Q68 17 68 33 L67 49 Q65 61 55 66 Q48 70 41 66 Q31 61 29 49Z",
  round: "M26 35 Q26 17 48 17 Q70 17 70 35 L69 48 Q66 63 55 67 Q48 70 41 67 Q30 63 27 48Z",
  angular: "M27 33 Q28 17 48 17 Q68 17 69 33 L67 54 L56 66 Q48 70 40 66 L29 54Z",
  soft: "M26 33 Q27 17 48 17 Q70 17 70 33 L66 52 Q60 64 51 68 Q48 70 45 68 Q35 64 30 52Z",
};

const eyes = {
  alert: '<ellipse cx="39" cy="43" rx="1.5" ry="1.75"/><ellipse cx="57" cy="43" rx="1.5" ry="1.75"/>',
  relaxed: '<path d="M36 43q3-2 6 0m12 0q3-2 6 0" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  wide: '<ellipse cx="39" cy="43" rx="1.8" ry="2.1"/><ellipse cx="57" cy="43" rx="1.8" ry="2.1"/>',
};

const hairstyles = {
  shaved: {},
  buzz: {
    front: '<path d="M27 39 Q23 22 34 17 Q49 8 63 19 Q72 24 70 38 L66 31 Q49 22 30 32Z"/>',
  },
  "side-part": {
    front: '<path d="M26 42 Q21 25 29 18 Q36 10 49 12 Q64 8 71 23 Q75 32 69 43 L66 32 Q54 32 45 21 Q37 32 30 30Z"/><path d="M47 16q9 9 17 10" fill="none" stroke="#fff" stroke-opacity=".19" stroke-width="1.5" stroke-linecap="round"/>',
  },
  curls: {
    back: '<path d="M25 43 Q17 39 22 29 Q18 20 27 17 Q29 9 39 11 Q47 3 55 10 Q65 8 69 16 Q78 19 75 30 Q80 39 71 44Z"/>',
    front: '<path d="M24 32 Q20 24 27 20 Q29 13 36 15 Q42 7 49 13 Q59 8 65 16 Q75 17 73 27 Q75 31 69 36 Q64 35 63 28 Q57 32 51 26 Q44 31 38 26 Q34 34 28 32 L27 43Z"/><path d="M30 20q4-4 8-3m11-2q5-3 9 2" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.5" stroke-linecap="round"/>',
  },
  bob: {
    back: '<path d="M22 37 Q22 12 48 11 Q73 11 74 36 L76 62 Q71 66 61 64 L35 64 Q26 66 20 60Z"/>',
    front: '<path d="M22 43 Q19 17 38 12 Q57 6 69 19 Q77 26 74 49 L68 52 L67 32 Q49 30 43 19 Q37 29 28 36 L28 54 L22 58Z"/>',
  },
  "long-wave": {
    back: '<path d="M24 31 Q29 9 51 11 Q73 9 75 36 Q76 49 81 70 Q73 81 58 75 L35 77 Q21 80 17 69 Q23 55 24 31Z"/>',
    front: '<path d="M23 47 Q19 26 29 17 Q40 5 56 12 Q71 14 74 32 L73 55 L66 62 Q71 39 64 30 Q53 30 46 20 Q40 31 29 35 L28 49Z"/><path d="M59 17q10 5 11 14" fill="none" stroke="#fff" stroke-opacity=".17" stroke-width="1.5" stroke-linecap="round"/>',
  },
  bun: {
    back: '<ellipse cx="58" cy="13" rx="11" ry="9"/>',
    front: '<path d="M26 40 Q21 26 29 19 Q43 8 58 15 Q75 20 70 40 L65 33 Q52 23 42 22 Q35 29 30 31Z"/><path d="M40 17q8-3 16 0" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.5" stroke-linecap="round"/>',
  },
  twists: {
    back: '<path d="M23 27 Q25 11 47 10 Q66 9 73 27 L77 57 L71 69 L62 65 L64 29 L33 29 L33 65 L24 68 L19 58Z"/>',
    front: '<path d="M23 38 Q17 23 29 17 Q36 10 48 12 Q67 8 73 24 L72 48 L67 46 L65 30 L58 24 L51 30 L43 24 L34 33 L29 31 L27 47 L22 46Z"/><path d="M26 25l-3 13m9-16-3 9m36-9 4 15m3 10 2 11m-49-7-2 12" fill="none" stroke="#fff" stroke-opacity=".19" stroke-width="1.4" stroke-linecap="round"/>',
  },
  headscarf: {
    back: '<path d="M27 22 Q32 10 48 11 Q64 10 70 22 L78 68 Q67 80 48 75 Q29 80 18 68Z"/>',
    front: '<path d="M20 67 Q26 57 26 35 Q24 17 39 13 Q59 6 69 24 Q73 40 71 48 Q72 61 78 69 Q62 77 43 75 Q29 75 20 67ZM33 31 Q29 40 34 53 Q40 65 48 65 Q58 64 63 53 Q68 41 62 30 Q50 17 33 31Z" fill-rule="evenodd"/><path d="M27 67q18 6 36-1M29 25q11-14 25-10" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.5" stroke-linecap="round"/>',
  },
};

const garments = {
  tee: '<path d="M22 96v-9m52 9v-9M37 74q11 12 22 0" fill="none" stroke="#222" stroke-opacity=".23" stroke-width="1.6"/>',
  jacket: '<path d="M37 73l11 11 10-11 5 23H34Z" fill="#f2e5c8"/><path d="M37 73l-6 8 9 4-3 11m21-23 6 8-8 4 3 11M21 96v-9m54 9v-9" fill="none" stroke="#222" stroke-opacity=".25" stroke-width="1.5"/>',
  hoodie: '<path d="M29 74q8-4 19 8 11-12 19-8L61 85l-13 4-13-4Z" fill="#222" fill-opacity=".18"/><path d="M43 85v10m10-10v10" stroke="#f5ebce" stroke-width="1.5" stroke-linecap="round"/>',
  uniform: '<path d="M37 74l11 8 11-8-1 9-10 4-10-4Z" fill="#222" fill-opacity=".23"/><path d="M48 86v10m12-10h10v6H60Z" fill="none" stroke="#fff" stroke-opacity=".47" stroke-width="1.4"/>',
  sweater: '<path d="M36 74q12 15 24 0m-36 7 4 15m44-15-4 15" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>',
};

const facialHair = {
  none: "",
  mustache: '<path d="M39 57q3-5 9-3 6-2 9 3-4 2-9 0-5 2-9 0Z"/>',
  goatee: '<path d="M43 59q5 3 10 0l-2 7-3 2-3-2Z"/>',
  beard: '<path d="M30 49q5 1 7 6 3-4 11-4t11 4q3-5 7-6-3 17-18 20-15-3-18-20Zm12 7q6 4 12 0-4-3-6-2-2-1-6 2Z" fill-rule="evenodd"/>',
};

const accessories = {
  none: "",
  glasses: '<rect x="32" y="39" width="13" height="10" rx="3"/><rect x="51" y="39" width="13" height="10" rx="3"/><path d="M45 43q3-2 6 0m13-1 5-2m-37 2-5-2"/>',
  "round-glasses": '<circle cx="38.5" cy="44" r="5.5"/><circle cx="57.5" cy="44" r="5.5"/><path d="M44 43q4-2 8 0m11-1 5-2m-35 2-5-2"/>',
  sunglasses: '<path d="M32 40h13v4q-1 6-7 5-6 0-6-6zm19 0h13v3q0 6-6 6-6 1-7-5z" fill="#273c39"/><path d="M45 42q3-2 6 0m13 0 5-2m-37 2-5-2"/>',
  earrings: '<path d="M27 49v3m42-3v3"/><circle cx="27" cy="54" r="2" fill="#e1ac52" stroke="#855920"/><circle cx="69" cy="54" r="2" fill="#e1ac52" stroke="#855920"/>',
  cap: '<path d="M26 28q1-17 21-19 20 0 23 17l-20 1Z" fill="#365c57"/><path d="M37 27q18-5 38-1 4 2-1 4-16 3-37-3Z" fill="#4e7b71"/>',
  freckles: '<path d="M34 49h.1m3-1h.1m3 2h.1m16 0h.1m2-2h.1m3 1h.1" stroke="#865a48"/>',
};

export const portraitOptions = {
  skin: Object.keys(portraitPalette.skin),
  face: Object.keys(faces),
  eyes: Object.keys(eyes),
  hair: Object.keys(hairstyles),
  hairColor: Object.keys(portraitPalette.hairColor),
  facialHair: Object.keys(facialHair),
  clothing: Object.keys(garments),
  clothingColor: Object.keys(portraitPalette.clothingColor),
  accessory: Object.keys(accessories),
  background: Object.keys(portraitPalette.background),
};

export const defaultPortrait = {
  skin: "olive", face: "oval", eyes: "alert", hair: "side-part", hairColor: "ink",
  facialHair: "none", clothing: "jacket", clothingColor: "teal", accessory: "glasses",
  background: "sage",
};

export function renderPortrait(options = {}) {
  const look = { ...defaultPortrait, ...options };
  for (const [field, values] of Object.entries(portraitOptions)) {
    if (!values.includes(look[field])) {
      throw new RangeError(`Unknown portrait ${field}: ${look[field]}`);
    }
  }
  const skin = portraitPalette.skin[look.skin];
  const hair = portraitPalette.hairColor[look.hairColor];
  const clothing = portraitPalette.clothingColor[look.clothingColor];
  const background = portraitPalette.background[look.background];
  const hairstyle = hairstyles[look.hair];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <g id="background"><rect width="96" height="96" fill="${background}"/></g>
  <g id="hair-back" fill="${hair}">${hairstyle.back ?? ""}</g>
  <g id="neck" fill="${skin}">
    <path d="M39 58h18v15q-9 12-18 0Z"/>
    <path d="M39 59h18v8q-9 6-18 0Z" fill="#542e22" opacity=".22"/>
  </g>
  <g id="clothing" fill="${clothing}">
    <path d="M5 96q1-11 8-15 8-4 24-8l4 4q7 5 14 0l4-4q16 4 24 8 7 4 8 15Z"/>
    ${garments[look.clothing]}
  </g>
  <g id="face" fill="${skin}">
    <ellipse cx="28" cy="44" rx="5" ry="6"/><ellipse cx="68" cy="44" rx="5" ry="6"/>
    <path d="${faces[look.face]}"/>
    <path d="M34 51q4-2 7 0m14 0q3-2 7 0" fill="none" stroke="#a83e32" opacity=".25" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g id="facial-hair" fill="${hair}">${facialHair[look.facialHair]}</g>
  <g id="features">
    <path d="M35 37q4-2 8 0m10 0q4-2 8 0" fill="none" stroke="${hair}" stroke-width="1.6" stroke-linecap="round"/>
    <g fill="#352622" color="#352622">${eyes[look.eyes]}</g>
    <path d="M48 43l-1.6 6 2 .7" fill="none" stroke="#552f27" stroke-opacity=".43" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M44 56q4 2.4 8 0" fill="none" stroke="#5f332d" stroke-width="1.2" stroke-linecap="round"/>
  </g>
  <g id="hair-front" fill="${look.hair === "headscarf" ? clothing : hair}">${hairstyle.front ?? ""}</g>
  <g id="accessory" fill="none" stroke="#2a3632" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">${accessories[look.accessory]}</g>
</svg>`;
}

// Appearance is stable for a given ID and kit version. Keep the resolved options in saves
// if later changes to the option lists should leave existing residents' looks intact.
export function portraitForResident(residentId) {
  let state = 2166136261;
  for (const character of String(residentId)) {
    state = Math.imul(state ^ character.codePointAt(0), 16777619) >>> 0;
  }
  return Object.fromEntries(Object.entries(portraitOptions).map(([field, values]) => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const options = field === "background" ? values.filter(value => value !== "transparent") : values;
    return [field, options[Math.floor(state / 4294967296 * options.length)]];
  }));
}
