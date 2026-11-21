// Top-down sprites share a 64×64 frame. The center is (32, 32) and the nose faces up.
const carBody = "M27 12h10q5 0 6 6l1 7v19q0 7-5 8H25q-5-1-5-8V25l1-7q1-6 6-6Z";
const carWheels = '<path d="M20 21v7m24-7v7M20 38v7m24-7v7"/>';
const carWindows = '<path d="M24 23q8-4 16 0l-2 7H26Zm2 15h12l2 5q-8 3-16 0Z"/>';
const carLights = '<path d="M23 16h4m10 0h4"/>';
const carTail = '<path d="M23 48h4m10 0h4"/>';
const sedan = {
  body: `<path d="${carBody}"/>`, wheels: carWheels, windows: carWindows,
  headlights: carLights, taillights: carTail, band: [21, 31, 22, 5], footprint: [26, 42],
};

const van = {
  body: '<path d="M25 10h14q6 0 6 7v32q0 6-5 6H24q-5 0-5-6V17q0-7 6-7Z"/>',
  wheels: '<path d="M19 20v8m26-8v8m-26 12v8m26-8v8"/>',
  windows: '<path d="M23 18q9-3 18 0l-2 6H25Zm0 28h7v4h-7Zm11 0h7v4h-7Z"/>',
  headlights: '<path d="M22 14h5m10 0h5"/>', taillights: '<path d="M22 52h4m12 0h4"/>',
  trim: '<path d="M24 30h16v12H24Z" fill="#f8f0dc" opacity=".26" stroke="none"/>',
  band: [20, 28, 24, 6], footprint: [28, 46],
};

const bus = {
  body: '<rect x="19" y="4" width="26" height="56" rx="5"/>',
  wheels: '<path d="M19 16v8m26-8v8M19 44v8m26-8v8"/>',
  windows: '<path d="M22 10q10-3 20 0v6H22Zm0 10h4v22h-4Zm16 0h4v22h-4Zm-16 31h20v4H22Z"/>',
  headlights: '<path d="M22 7h5m10 0h5"/>', taillights: '<path d="M22 57h4m12 0h4"/>',
  trim: '<rect x="28" y="22" width="8" height="19" rx="2" fill="#fff" opacity=".30" stroke="none"/>',
  band: [20, 44, 24, 5], footprint: [28, 58],
};

const railcar = {
  body: '<path d="M26 4h12q6 1 6 8v41q0 7-5 7H25q-5 0-5-7V12q0-7 6-8Z"/>',
  windows: '<path d="M23 11q9-3 18 0v5H23Zm0 10h3v27h-3Zm15 0h3v27h-3Zm-15 31h18v3H23Z"/>',
  headlights: '<path d="M24 7h4m8 0h4"/>', taillights: '<path d="M23 57h4m10 0h4"/>',
  trim: '<path d="M29 21h6v25h-6Z" fill="#fff" opacity=".25" stroke="none"/>',
  band: [21, 46, 22, 5], footprint: [26, 58],
};

const geometry = {
  sedan,
  hatchback: {
    ...sedan,
    body: '<path d="M27 13h10q5 0 6 6l1 7v21q0 5-5 5H25q-5 0-5-5V26l1-7q1-6 6-6Z"/>',
    windows: '<path d="M24 23q8-4 16 0l-2 7H26Zm0 17h16v6H24Z"/>',
  },
  taxi: {
    ...sedan, trim: '<rect x="27" y="31" width="10" height="5" rx="1.7" fill="#fff2ce"/>',
  },
  van,
  "delivery-van": {
    ...van, trim: '<path d="M26 34h12m-12 5h8" stroke="#fff0d0" stroke-width="1.5" opacity=".75"/>',
  },
  "freight-truck": {
    body: '<rect x="22" y="5" width="20" height="17" rx="4"/><rect x="18" y="22" width="28" height="37" rx="2"/>',
    wheels: '<path d="M22 15v6m20-6v6M18 40v5m28-5v5M18 49v5m28-5v5"/>',
    windows: '<path d="M25 10q7-2 14 0v5H25Z"/>',
    headlights: '<path d="M25 8h3m8 0h3"/>', taillights: '<path d="M21 56h4m14 0h4"/>',
    trim: '<path d="M24 27v25m5-25v25m6-25v25m5-25v25" stroke="#fff" opacity=".27"/>',
    band: [19, 31, 26, 8], footprint: [30, 56],
  },
  minibus: {
    ...van,
    windows: '<path d="M23 18q9-3 18 0l-2 6H25Zm0 10h4v15h-4Zm14 0h4v15h-4Zm-14 18h18v4H23Z"/>',
    trim: "", band: [20, 28, 24, 6],
  },
  "city-bus": bus,
  "articulated-bus": {
    ...bus,
    body: '<rect x="20" y="2" width="24" height="60" rx="5"/>',
    wheels: '<path d="M20 15v7m24-7v7M20 38v6m24-6v6M20 51v6m24-6v6"/>',
    windows: '<path d="M23 7q9-3 18 0v6H23Zm0 10h4v13h-4Zm14 0h4v13h-4ZM23 41h4v13h-4Zm14 0h4v13h-4Z"/>',
    headlights: '<path d="M23 5h3m12 0h3"/>', taillights: '<path d="M23 58h4m10 0h4"/>',
    trim: '<path d="M21 33h22v5H21Z" fill="#40504d"/><path d="M25 34v3m4-3v3m6-3v3m4-3v3" stroke="#b5b8a9" stroke-width=".8"/>',
    band: [21, 43, 22, 7], footprint: [26, 62],
  },
  tram: {
    ...railcar, trim: '<path d="M32 21l5 12-5 12-5-12Z" fill="none" stroke="#fbf2d9" stroke-width="1.5"/>',
  },
  metro: railcar,
  "commuter-train": {
    ...railcar,
    body: '<path d="M32 2q14 0 14 13v38q0 8-6 8H24q-6 0-6-8V15Q18 2 32 2Z"/>',
    windows: '<path d="M21 12q11-7 22 0l-2 6H23Zm0 11h4v25h-4Zm18 0h4v25h-4Z"/>',
    band: [19, 48, 26, 5], footprint: [30, 61],
  },
  ferry: {
    body: '<path d="M32 4q16 7 16 22l-3 30q-13 8-26 0l-3-30Q16 11 32 4Z"/>',
    windows: '<path d="M22 23q10-9 20 0l-1 7H23Z"/>',
    trim: '<path d="M24 33h16v17H24Z" fill="#fcf4e1" stroke="#3a4d47"/><path d="M27 39h10m-10 5h10" stroke="#718b83"/>',
    headlights: '<path d="M30 12h4"/>', taillights: '<path d="M22 55h4m12 0h4"/>',
    band: [18, 28, 28, 5], footprint: [34, 57],
  },
  bicycle: {
    body: '<path d="M30 18h4v21h-4Z"/><circle cx="32" cy="30" r="5"/><path d="M28 34l-2 8m10-8 2 8M26 20h12" fill="none" stroke-width="2"/>',
    wheels: '<path d="M32 12v8m0 24v8"/>',
    trim: '<circle cx="32" cy="25" r="3.2" fill="#efe9cf"/>',
    headlights: '<path d="M31 17h2"/>', taillights: '<path d="M31 46h2"/>',
    band: [28, 30, 8, 3], footprint: [14, 42],
  },
  motorcycle: {
    body: '<path d="M28 20q4-4 8 0l2 8-3 18h-6l-3-18Zm-2 1h12" stroke-width="2"/>',
    wheels: '<path d="M32 12v9m0 24v8"/>',
    windows: '<path d="M29 21q3-3 6 0v3h-6Z"/>',
    trim: '<circle cx="32" cy="30" r="3.4" fill="#f7ebc8"/>',
    headlights: '<path d="M30 19h4"/>', taillights: '<path d="M30 44h4"/>',
    band: [28, 35, 8, 3], footprint: [14, 43],
  },
  ambulance: {
    ...van,
    trim: '<path d="M28 35h2v-2h4v2h2v4h-2v2h-4v-2h-2Z" fill="#a63f35" stroke="none"/><path d="M27 15h3m4 0h3" stroke="#345c91" stroke-width="2.4"/>',
  },
  "fire-engine": {
    ...van,
    body: '<rect x="18" y="7" width="28" height="49" rx="4"/>',
    wheels: '<path d="M18 20v7m28-7v7m-28 14v8m28-8v8"/>',
    trim: '<path d="M28 27h8v21h-8Zm0 5h8m-8 5h8m-8 5h8" fill="none" stroke="#f9e5b6" stroke-width="1.6"/><path d="M27 15h3m4 0h3" stroke="#315e9a" stroke-width="2.4"/>',
    band: [19, 29, 26, 6], footprint: [30, 51],
  },
  "police-car": {
    ...sedan, trim: '<path d="M25 32h7" stroke="#3978b0" stroke-width="3"/><path d="M32 32h7" stroke="#c8473d" stroke-width="3"/>',
  },
  "road-service": {
    ...van, trim: '<path d="M26 36l6-4 6 4m-12 4 6-4 6 4" stroke="#352d29" stroke-width="1.4" fill="none"/><path d="M27 15h10" stroke="#e8a13d" stroke-width="2.5"/>',
  },
};

export const vehicleTypes = Object.keys(geometry);
export const vehicleLiveries = ["solid", "stripe", "two-tone"];
export const vehicleStates = ["normal", "braking", "selected"];
export const vehiclePresets = {
  sedan: "#638480", hatchback: "#a25749", taxi: "#dda64c", van: "#788b82",
  "delivery-van": "#b26d54", "freight-truck": "#74938e", minibus: "#9f583f",
  "city-bus": "#386c66", "articulated-bus": "#566794", tram: "#9b5547",
  metro: "#50877b", "commuter-train": "#a55346", ferry: "#6695a1", bicycle: "#c08948",
  motorcycle: "#7b648b", ambulance: "#f1e8d5", "fire-engine": "#b84637",
  "police-car": "#627da0", "road-service": "#d6923d",
};

export function vehicleFootprint(type) {
  if (!vehicleTypes.includes(type)) throw new RangeError(`Unknown vehicle type: ${type}`);
  return [...geometry[type].footprint];
}

export function renderVehicle(options = {}) {
  const { type = "sedan", accent = "#f3e2b3", livery = "solid", state = "normal" } = options;
  const [width, length] = vehicleFootprint(type);
  const color = options.color ?? vehiclePresets[type];
  if (![color, accent].every(value => typeof value === "string" && /^#[\da-f]{6}$/i.test(value))) {
    throw new RangeError("Vehicle colors must use the #RRGGBB format");
  }
  if (!vehicleLiveries.includes(livery)) throw new RangeError(`Unknown livery: ${livery}`);
  if (!vehicleStates.includes(state)) throw new RangeError(`Unknown vehicle state: ${state}`);

  const model = geometry[type];
  const [x, y, bandWidth, bandHeight] = model.band;
  const band = livery === "solid" ? "" :
    `<rect x="${x}" y="${y}" width="${bandWidth}" height="${livery === "stripe" ? 2 : bandHeight}" rx=".6"/>`;
  const selectionLength = Math.min(length + 2, 62);
  const selection = state === "selected" ?
    `<rect x="${31 - width / 2}" y="${32 - selectionLength / 2}" width="${width + 2}" height="${selectionLength}" rx="8" fill="#4dc9aa" fill-opacity=".18" stroke="#13836e" stroke-width="1.3"/>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <g id="selection">${selection}</g>
  <g id="wheels" fill="none" stroke="#293330" stroke-width="3" stroke-linecap="round">${model.wheels ?? ""}</g>
  <g id="body" fill="${color}" stroke="#293b36" stroke-width="1.3" stroke-linejoin="round">${model.body}</g>
  <g id="livery" fill="${accent}">${band}</g>
  <g id="windows" fill="#253b39" fill-opacity=".86">${model.windows ?? ""}</g>
  <g id="details" stroke="#35433b" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${model.trim ?? ""}</g>
  <g id="headlights" fill="none" stroke="#fff5cc" stroke-width="1.7" stroke-linecap="round">${model.headlights}</g>
  <g id="tail-lights" fill="none" stroke="${state === "braking" ? "#ff5144" : "#a1372c"}" stroke-width="${state === "braking" ? 2.6 : 1.6}" stroke-linecap="round">${model.taillights}</g>
</svg>`;
}
