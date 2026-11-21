import { defaultPortrait, portraitForResident, portraitOptions, renderPortrait } from "./portraits.mjs";
import { renderVehicle, vehicleLiveries, vehiclePresets, vehicleStates, vehicleTypes } from "./vehicles.mjs";
import { exportIcon, iconMarkup, loadIcons } from "./icons.mjs";

const get = id => document.getElementById(id);
const displayName = value => value.replaceAll("-", " ").replace(/^./, letter => letter.toUpperCase());
const imageSource = svg => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

for (const node of document.querySelectorAll("[data-icon]")) {
  node.innerHTML = iconMarkup(node.dataset.icon);
}

function selectOptions(parent, choices, labels = {}) {
  const controls = {};
  for (const [field, values] of Object.entries(choices)) {
    const label = document.createElement("label");
    const select = document.createElement("select");
    select.name = field;
    for (const value of values) select.add(new Option(displayName(value), value));
    label.append(labels[field] ?? displayName(field), select);
    parent.append(label);
    controls[field] = select;
  }
  return controls;
}

function setControls(controls, options) {
  for (const [name, control] of Object.entries(controls)) control.value = options[name];
}

function readControls(controls) {
  return Object.fromEntries(Object.entries(controls).map(([name, control]) => [name, control.value]));
}

function sampleButton(label, svg, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sample-button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", "false");
  const img = document.createElement("img");
  img.src = imageSource(svg);
  img.alt = "";
  button.append(img);
  button.addEventListener("click", handler);
  return button;
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveRecipe(kind, options) {
  const recipe = JSON.stringify({ assetKitVersion: 1, kind, options }, null, 2);
  download(`simlife-${kind}.json`, recipe + "\n", "application/json");
}

const portraitControls = selectOptions(get("portrait-fields"), portraitOptions, {
  skin: "Skin tone", hair: "Hairstyle", hairColor: "Hair color",
  facialHair: "Facial hair", clothingColor: "Clothing color",
});
const portraitPresets = [
  defaultPortrait,
  { skin: "deep", face: "round", hair: "twists", clothing: "hoodie", clothingColor: "mustard", accessory: "round-glasses", background: "straw" },
  { skin: "sand", face: "soft", hair: "long-wave", hairColor: "auburn", clothing: "sweater", clothingColor: "indigo", accessory: "freckles", background: "rose" },
  { skin: "olive", hair: "headscarf", clothing: "uniform", clothingColor: "plum", accessory: "glasses", background: "lilac" },
  { skin: "umber", face: "angular", hair: "buzz", facialHair: "beard", clothing: "jacket", clothingColor: "moss", accessory: "none", background: "sky" },
  { skin: "porcelain", face: "round", hair: "bun", hairColor: "silver", clothing: "tee", clothingColor: "rust", accessory: "earrings", background: "stone" },
].map(options => ({ ...defaultPortrait, ...options }));

function showPortrait() {
  const options = readControls(portraitControls);
  get("portrait-preview").src = imageSource(renderPortrait(options));
  for (const [index, preset] of portraitPresets.entries()) {
    const selected = Object.entries(preset).every(([field, value]) => options[field] === value);
    get("portrait-library").children[index].setAttribute("aria-pressed", String(selected));
  }
}

for (const [index, preset] of portraitPresets.entries()) {
  get("portrait-library").append(sampleButton(`Portrait preset ${index + 1}`, renderPortrait(preset), () => {
    setControls(portraitControls, preset);
    showPortrait();
  }));
}
get("portrait-fields").addEventListener("change", showPortrait);
function generatePortrait() {
  setControls(portraitControls, portraitForResident(get("resident-id").value));
  showPortrait();
}
get("generate-portrait").addEventListener("click", generatePortrait);
get("resident-id").addEventListener("keydown", event => {
  if (event.key === "Enter") generatePortrait();
});
get("portrait-svg").addEventListener("click", () => {
  download("simlife-portrait.svg", renderPortrait(readControls(portraitControls)), "image/svg+xml");
});
get("portrait-recipe").addEventListener("click", () => saveRecipe("portrait", readControls(portraitControls)));
setControls(portraitControls, defaultPortrait);
showPortrait();

const vehicleControls = selectOptions(get("vehicle-fields"), {
  type: vehicleTypes, livery: vehicleLiveries, state: vehicleStates,
});
const bodyColor = get("body-color");
const accentColor = get("accent-color");
function vehicleRecipe() {
  return { ...readControls(vehicleControls), color: bodyColor.value, accent: accentColor.value };
}

function showVehicle() {
  const options = vehicleRecipe();
  const svg = imageSource(renderVehicle(options));
  get("vehicle-preview").src = svg;
  get("vehicle-small").src = svg;
  for (const [index, type] of vehicleTypes.entries()) {
    get("vehicle-library").children[index].setAttribute("aria-pressed", String(type === options.type));
  }
}

function chooseVehicle(type) {
  vehicleControls.type.value = type;
  bodyColor.value = vehiclePresets[type];
  showVehicle();
}

for (const type of vehicleTypes) {
  get("vehicle-library").append(sampleButton(displayName(type), renderVehicle({ type }), () => chooseVehicle(type)));
}
vehicleControls.type.addEventListener("change", () => chooseVehicle(vehicleControls.type.value));
vehicleControls.livery.addEventListener("change", showVehicle);
vehicleControls.state.addEventListener("change", showVehicle);
bodyColor.addEventListener("input", showVehicle);
accentColor.addEventListener("input", showVehicle);
get("vehicle-svg").addEventListener("click", () => {
  const options = vehicleRecipe();
  download(`simlife-${options.type}.svg`, renderVehicle(options), "image/svg+xml");
});
get("vehicle-recipe").addEventListener("click", () => saveRecipe("vehicle", vehicleRecipe()));
setControls(vehicleControls, { type: "city-bus", livery: "stripe", state: "normal" });
chooseVehicle(vehicleControls.type.value);

const startTime = 17 * 60 + 24;
let previewTime = startTime;
let playing = null;
function showTime() {
  const hours = String(Math.floor(previewTime / 60) % 24).padStart(2, "0");
  const minutes = String(previewTime % 60).padStart(2, "0");
  get("playback-time").value = `${hours}:${minutes}`;
}
function advancePreview() {
  previewTime += 1;
  showTime();
}
function stopPlayback() {
  clearInterval(playing);
  playing = null;
  get("play-toggle").setAttribute("aria-pressed", "false");
  get("play-toggle").setAttribute("aria-label", "Play");
  get("play-toggle").innerHTML = iconMarkup("play");
}
get("play-toggle").addEventListener("click", () => {
  if (playing !== null) {
    stopPlayback();
    return;
  }
  get("play-toggle").setAttribute("aria-pressed", "true");
  get("play-toggle").setAttribute("aria-label", "Pause");
  get("play-toggle").innerHTML = iconMarkup("pause");
  playing = setInterval(advancePreview, 600);
});
get("step").addEventListener("click", advancePreview);
get("rewind").addEventListener("click", () => {
  stopPlayback();
  previewTime = startTime;
  showTime();
});

const search = get("icon-search");
const groupFilter = get("icon-group");

function showIconGroup(group, icons) {
  const section = document.createElement("section");
  const title = document.createElement("h3");
  title.textContent = group;
  const grid = document.createElement("div");
  grid.className = "icon-grid";
  for (const icon of icons) {
    const tile = document.createElement("button");
    tile.className = "icon-tile";
    tile.type = "button";
    tile.title = `Download ${icon.id}.svg`;
    tile.setAttribute("aria-label", `Download ${displayName(icon.id)} icon`);
    tile.innerHTML = iconMarkup(icon.id);
    tile.append(displayName(icon.id));
    tile.addEventListener("click", () => download(`simlife-${icon.id}.svg`, exportIcon(icon), "image/svg+xml"));
    grid.append(tile);
  }
  section.append(title, grid);
  return section;
}

async function initializeIcons() {
  const icons = await loadIcons();
  const groups = [...new Set(icons.map(icon => icon.group))];
  for (const group of groups) groupFilter.add(new Option(group, group));

  function filterIcons() {
    const query = search.value.trim().toLowerCase().replaceAll("-", " ");
    const matches = icons.filter(icon => {
      const terms = `${icon.id.replaceAll("-", " ")} ${icon.group.toLowerCase()}`;
      return (!groupFilter.value || groupFilter.value === icon.group) && terms.includes(query);
    });
    const sections = groups.flatMap(group => {
      const groupIcons = matches.filter(icon => icon.group === group);
      return groupIcons.length ? [showIconGroup(group, groupIcons)] : [];
    });
    get("icon-library").replaceChildren(...sections);
    get("icon-count").value = matches.length === 0 ? "No matching icons" : `${matches.length} of ${icons.length} icons`;
  }

  search.addEventListener("input", filterIcons);
  groupFilter.addEventListener("change", filterIcons);
  for (const link of document.querySelectorAll("[data-open-group]")) {
    link.addEventListener("click", () => {
      search.value = "";
      groupFilter.value = link.dataset.openGroup;
      filterIcons();
    });
  }
  filterIcons();
}

initializeIcons().catch(error => {
  get("icon-count").value = "Icon library could not load. Open the preview on localhost.";
  console.error(error);
});
