const sprite = new URL("icons.svg", import.meta.url);
const drawingStyle = 'fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"';

export function iconMarkup(id) {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new RangeError("Invalid icon ID");
  return `<svg viewBox="0 0 24 24" width="24" height="24" ${drawingStyle} aria-hidden="true" focusable="false"><use href="${sprite.href}#${id}"/></svg>`;
}

export async function loadIcons() {
  const response = await fetch(sprite);
  if (!response.ok) throw new Error(`Icon sprite returned HTTP ${response.status}`);
  const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
  if (doc.documentElement.localName !== "svg") throw new Error("Icon sprite is invalid");
  return Array.from(doc.querySelectorAll("symbol[data-group]"), symbol => ({
    id: symbol.id,
    group: symbol.getAttribute("data-group"),
    geometry: symbol.innerHTML,
  }));
}

export function exportIcon({ geometry }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" ${drawingStyle}>${geometry}</svg>`;
}
