"use strict";

const canvas = document.querySelector("#map");
const ctx = canvas.getContext("2d", { alpha: false });
const status = document.querySelector("#map-status");
const scaleBar = document.querySelector("#scale");
const trainLegend = document.querySelector("#train-legend");
const lineChoices = document.querySelector("#line-choices");
const visibleLayers = Object.fromEntries(
  [...document.querySelectorAll("[data-layer]")].map(input => [input.dataset.layer, input.checked])
);
const gridSize = 1500;
const areaColors = { water: "#9ebfca", park: "#b9cba4", green: "#cad6ad", building: "#c8b79d" };
const roadStyles = [
  ["path", "#AEA28D", 0.6, 0.26, 1.1],
  ["track", "#A89B83", 0.8, 0.24, 2],
  ["service", "#d6cdbb", 0.7, 0.17, 3],
  ["residential", "#fbf7ef", 0.75, 0.10, 6],
  ["tertiary", "#fdf5e0", 0.85, 0.055, 8],
  ["secondary", "#ead5ad", 1.2, 0, 12],
  ["primary", "#e0b980", 1.55, 0, 16],
  ["trunk", "#d39e72", 1.75, 0, 19],
  ["motorway", "#bc805e", 2.0, 0, 23],
];
const mainRoads = new Set(roadStyles.filter(style => style[3] === 0).map(style => style[0]));
const labelOrder = ["city", "town", "suburb", "station", "quarter", "neighbourhood"];
let map;
let indices;
let width = 1;
let height = 1;
let pixelRatio = 1;
let offsetX = 0;
let offsetY = 0;
let zoom = 1;
let minimumZoom = 0.001;
let scheduled = false;
let drag;
let selectedLine = "";
const linesByWay = new Map();

function boundsOf(feature) {
  if (feature.point) return [...feature.point, ...feature.point];
  let west = Infinity;
  let north = Infinity;
  let east = -Infinity;
  let south = -Infinity;
  for (const path of feature.paths) {
    for (let i = 0; i < path.length; i += 2) {
      west = Math.min(west, path[i]);
      north = Math.min(north, path[i + 1]);
      east = Math.max(east, path[i]);
      south = Math.max(south, path[i + 1]);
    }
  }
  return [west, north, east, south];
}

function makeIndex(features) {
  const cells = new Map();
  const broadFeatures = [];
  const bounds = features.map(boundsOf);
  for (const [i, box] of bounds.entries()) {
    const [west, north, east, south] = box.map(value => Math.floor(value / gridSize));
    if ((east - west + 1) * (south - north + 1) > 48) {
      broadFeatures.push(i);
      continue;
    }
    for (let x = west; x <= east; x++) {
      for (let y = north; y <= south; y++) {
        const key = `${x},${y}`;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(i);
      }
    }
  }
  return { features, bounds, cells, broadFeatures };
}

function visible(name, view) {
  const { features, bounds, cells, broadFeatures } = indices[name];
  const [west, north, east, south] = view.map(value => Math.floor(value / gridSize));
  const hits = new Set(broadFeatures);
  for (let x = west; x <= east; x++) {
    for (let y = north; y <= south; y++) {
      for (const i of cells.get(`${x},${y}`) || []) hits.add(i);
    }
  }
  return [...hits].filter(i => {
    const box = bounds[i];
    return box[0] <= view[2] && box[2] >= view[0] && box[1] <= view[3] && box[3] >= view[1];
  }).map(i => features[i]);
}

function trace(feature) {
  for (const path of feature.paths) {
    ctx.moveTo(path[0], path[1]);
    for (let j = 2; j < path.length; j += 2) ctx.lineTo(path[j], path[j + 1]);
  }
}

function fillArea(feature) {
  ctx.beginPath();
  trace(feature);
  ctx.fillStyle = areaColors[feature.kind];
  ctx.fill("evenodd");
}

function stroke(features, color, cssWidth, dash = [], dashOffset = 0) {
  if (!features.length) return;
  ctx.beginPath();
  for (const feature of features) trace(feature);
  ctx.strokeStyle = color;
  ctx.lineWidth = cssWidth / zoom;
  ctx.setLineDash(dash.map(length => length / zoom));
  ctx.lineDashOffset = dashOffset / zoom;
  ctx.stroke();
}

function drawTransport(view) {
  const roads = visibleLayers.roads ? visible(zoom < 0.055 ? "mainRoads" : "roads", view) : [];
  const rails = visibleLayers.rail ? visible("rail", view) : [];
  const levels = new Map();
  for (const [features, key] of [[roads, "roads"], [rails, "rails"]]) {
    for (const feature of features) {
      if (!levels.has(feature.level)) levels.set(feature.level, {roads: new Map(), rails: []});
      const group = levels.get(feature.level);
      if (key === "rails") {
        group.rails.push(feature);
      } else {
        if (!group.roads.has(feature.kind)) group.roads.set(feature.kind, []);
        group.roads.get(feature.kind).push(feature);
      }
    }
  }
  for (const level of [...levels.keys()].sort((a, b) => a - b)) {
    const group = levels.get(level);
    for (const [kind, color, base, threshold, meters] of roadStyles) {
      if (zoom < threshold) continue;
      const features = group.roads.get(kind) || [];
      const lineWidth = Math.max(base, Math.min(24, meters * zoom));
      if (zoom > 0.07 && kind !== "path") stroke(features, "#b5a894", lineWidth + 1.05);
      stroke(features, color, lineWidth, level < 0 ? [3, 2] : []);
    }
    stroke(group.rails, "#f7f2e6", 2.6);
    stroke(group.rails, "#6b5c8b", 1.35, level < 0 ? [3, 3] : [6, 2]);
  }
}

function drawTrainLines(view) {
  if (!visibleLayers.trains || !linesByWay.size) return;
  const pathsByColor = new Map();
  const shared = [];
  const casing = [];
  for (const way of visible("rail", view)) {
    let lines = linesByWay.get(way.id) || [];
    if (selectedLine) lines = lines.filter(line => line.id === selectedLine);
    const colors = [...new Set(lines.map(line => line.color))];
    if (!colors.length) continue;
    casing.push(way);
    if (colors.length > 1) {
      shared.push([way, colors]);
    } else {
      const [color] = colors;
      if (!pathsByColor.has(color)) pathsByColor.set(color, []);
      pathsByColor.get(color).push(way);
    }
  }
  const lineWidth = selectedLine ? 4 : 3;
  stroke(casing, "#fffaf0", lineWidth + 2.2);
  for (const [color, paths] of pathsByColor) stroke(paths, color, lineWidth);
  ctx.lineCap = "butt";
  for (const [way, colors] of shared) {
    colors.forEach((color, index) => stroke([way], color, lineWidth, [5, 5 * (colors.length - 1)], -5 * index));
  }
  ctx.lineCap = "round";
}

function setupTrainLines(data, rail) {
  if (data?.version !== 1) return;
  const available = new Set(rail.map(way => way.id));
  const lines = data.lines.filter(line => {
    if (!/^#[0-9a-f]{6}$/i.test(line.color)) return false;
    const local = line.ways.filter(id => available.has(id));
    for (const id of local) {
      if (!linesByWay.has(id)) linesByWay.set(id, []);
      linesByWay.get(id).push(line);
    }
    return local.length > 0;
  });
  if (!lines.length) return;
  document.querySelector("#train-layer").hidden = false;
  trainLegend.hidden = !visibleLayers.trains;
  for (const line of [{ id: "", name: "All lines" }, ...lines]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "line-choice";
    button.dataset.line = line.id;
    button.setAttribute("aria-pressed", String(line.id === selectedLine));
    if (line.color) {
      const swatch = document.createElement("span");
      swatch.className = "line-swatch";
      swatch.style.backgroundColor = line.color;
      swatch.setAttribute("aria-hidden", "true");
      button.append(swatch);
      button.title = line.color_source === "gtfs" ? "Color from agency GTFS" : "Color from OpenStreetMap";
    }
    button.append(line.name);
    lineChoices.append(button);
  }
}

function drawLabels(view) {
  let labels = visible("labels", view).sort((a, b) => labelOrder.indexOf(a.kind) - labelOrder.indexOf(b.kind));
  if (!visibleLayers.stations) labels = labels.filter(feature => feature.kind !== "station");
  const occupied = [];
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const { point, kind, name } of labels) {
    const x = point[0] * zoom + offsetX;
    const y = point[1] * zoom + offsetY;
    if (x < 8 || y < 8 || x > width - 8 || y > height - 8) continue;
    const station = kind === "station";
    if (station && zoom >= 0.045) {
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "#fdf9ee";
      ctx.fill();
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = "#6b5c8b";
      ctx.setLineDash([]);
      ctx.stroke();
    }
    if (!name || (station && zoom < 0.30) || (kind === "suburb" && zoom < 0.042)
        || (["quarter", "neighbourhood"].includes(kind) && zoom < 0.17)) continue;
    ctx.font = kind === "city" ? "bold 16px Georgia, serif" : "600 11px system-ui, sans-serif";
    const half = ctx.measureText(name).width / 2 + 5;
    const textY = y - (station ? 11 : 0);
    if (x - half < 0 || x + half > width || occupied.some(
      ([otherX, otherY, otherHalf]) => Math.abs(otherY - textY) < 16 && Math.abs(otherX - x) < half + otherHalf
    )) continue;
    occupied.push([x, textY, half]);
    ctx.strokeStyle = "#f9f5e9";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
    ctx.strokeText(name, x, textY);
    ctx.fillStyle = station ? "#4a405f" : "#354e3d";
    ctx.fillText(name, x, textY);
  }
}

function draw() {
  scheduled = false;
  if (!map) return;
  const [mapWidth, mapHeight] = map.size_m;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.fillStyle = "#e8e2d3";
  ctx.fillRect(0, 0, width, height);

  const view = [
    Math.max(0, -offsetX / zoom), Math.max(0, -offsetY / zoom),
    Math.min(mapWidth, (width - offsetX) / zoom), Math.min(mapHeight, (height - offsetY) / zoom),
  ];
  ctx.save();
  ctx.setTransform(zoom * pixelRatio, 0, 0, zoom * pixelRatio, offsetX * pixelRatio, offsetY * pixelRatio);
  ctx.beginPath();
  ctx.rect(0, 0, mapWidth, mapHeight);
  ctx.clip();
  ctx.fillStyle = "#eee8d8";
  ctx.fillRect(0, 0, mapWidth, mapHeight);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const areas = visible("areas", view);
  for (const area of areas) {
    if (area.kind !== "water" && visibleLayers.green) fillArea(area);
  }
  if (visibleLayers.water) {
    for (const area of areas) {
      if (area.kind === "water") fillArea(area);
    }
    const waterways = visible("waterways", view);
    stroke(waterways.filter(feature => feature.kind === "coastline"), "#83a9b7", 0.9);
    stroke(waterways.filter(feature => feature.kind === "river"), "#83a9b7", 1.2);
    if (zoom > 0.08) {
      stroke(waterways.filter(feature => feature.kind === "canal"), "#8fb5c1", 1.05);
      stroke(waterways.filter(feature => feature.kind === "stream"), "#9bbdc8", 0.75);
    }
  }
  if (visibleLayers.buildings && zoom >= 0.20) {
    for (const building of visible("buildings", view)) fillArea(building);
  }
  drawTransport(view);
  drawTrainLines(view);
  drawLabels(view);
  ctx.restore();

  const maxMeters = 100 / zoom;
  const unit = 10 ** Math.floor(Math.log10(maxMeters));
  const meters = ([5, 2, 1].find(n => n * unit <= maxMeters) || 1) * unit;
  scaleBar.style.width = `${Math.round(meters * zoom)}px`;
  scaleBar.textContent = meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
  scaleBar.hidden = false;
}

function invalidate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(draw);
}

function fit() {
  if (!map) return;
  const [mapWidth, mapHeight] = map.size_m;
  minimumZoom = Math.min(width / mapWidth, height / mapHeight) * 0.96;
  zoom = minimumZoom;
  offsetX = (width - mapWidth * zoom) / 2;
  offsetY = (height - mapHeight * zoom) / 2;
  invalidate();
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  width = Math.max(1, rect.width);
  height = Math.max(1, rect.height);
  pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  fit();
}

function constrain() {
  const [mapWidth, mapHeight] = map.size_m;
  offsetX = Math.max(width / 2 - mapWidth * zoom, Math.min(width / 2, offsetX));
  offsetY = Math.max(height / 2 - mapHeight * zoom, Math.min(height / 2, offsetY));
}

function zoomTo(factor, x = width / 2, y = height / 2) {
  if (!map) return;
  const next = Math.min(Math.max(4, minimumZoom), Math.max(minimumZoom, zoom * factor));
  offsetX = x - (x - offsetX) * next / zoom;
  offsetY = y - (y - offsetY) * next / zoom;
  zoom = next;
  constrain();
  invalidate();
}

document.querySelector("#zoom-in").addEventListener("click", () => zoomTo(1.5));
document.querySelector("#zoom-out").addEventListener("click", () => zoomTo(1 / 1.5));
document.querySelector("#fit").addEventListener("click", fit);
for (const input of document.querySelectorAll("[data-layer]")) {
  input.addEventListener("change", () => {
    visibleLayers[input.dataset.layer] = input.checked;
    if (input.dataset.layer === "trains") trainLegend.hidden = !input.checked;
    invalidate();
  });
}
lineChoices.addEventListener("click", event => {
  const button = event.target.closest("button[data-line]");
  if (!button) return;
  selectedLine = button.dataset.line;
  for (const choice of lineChoices.querySelectorAll("button")) {
    choice.setAttribute("aria-pressed", String(choice === button));
  }
  invalidate();
});
canvas.addEventListener("wheel", event => {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  zoomTo(Math.exp(-event.deltaY * 0.0018), event.clientX - rect.left, event.clientY - rect.top);
}, { passive: false });
canvas.addEventListener("pointerdown", event => {
  if (!map || event.button !== 0 || drag) return;
  drag = { id: event.pointerId, x: event.clientX - offsetX, y: event.clientY - offsetY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (!drag || drag.id !== event.pointerId) return;
  offsetX = event.clientX - drag.x;
  offsetY = event.clientY - drag.y;
  constrain();
  invalidate();
});
canvas.addEventListener("lostpointercapture", event => {
  if (drag?.id === event.pointerId) drag = undefined;
});
canvas.addEventListener("keydown", event => {
  if (!map) return;
  const motions = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] };
  const motion = motions[event.key];
  if (motion) {
    offsetX += motion[0];
    offsetY += motion[1];
    constrain();
    invalidate();
  } else if (["+", "="].includes(event.key)) {
    zoomTo(1.5);
  } else if (event.key === "-") {
    zoomTo(1 / 1.5);
  } else {
    return;
  }
  event.preventDefault();
});
new ResizeObserver(resize).observe(canvas);

async function load() {
  try {
    const [response, trainResponse] = await Promise.all([fetch("/map.json"), fetch("/train-lines.json")]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!trainResponse.ok) throw new Error(`train lines HTTP ${trainResponse.status}`);
    const data = await response.json();
    if (data.version !== 1) throw new Error("unsupported map format");
    indices = Object.fromEntries(Object.entries(data.layers).map(([key, features]) => [key, makeIndex(features)]));
    indices.mainRoads = makeIndex(data.layers.roads.filter(feature => mainRoads.has(feature.kind)));
    if (trainResponse.status !== 204) setupTrainLines(await trainResponse.json(), data.layers.rail);
    map = data;
    document.querySelector("#map-name").textContent = map.name;
    const [mapWidth, mapHeight] = map.size_m.map(n => n >= 1000 ? (n / 1000).toFixed(1) : (n / 1000).toFixed(2));
    document.querySelector("#map-size").textContent = `${mapWidth} × ${mapHeight} km`;
    document.title = `${map.name} · SimLife`;
    resize();
    canvas.dataset.ready = "true";
    status.hidden = true;
  } catch (error) {
    status.textContent = `Could not load the map (${error.message}).`;
  }
}
load();
