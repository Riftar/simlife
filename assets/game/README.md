# SimLife game asset kit

Open the [local gallery](http://127.0.0.1:8772/assets/game/) after serving the repository root.

```sh
python3 -m http.server 8772 --bind 127.0.0.1
```

The gallery previews menus and playback, edits portraits and vehicles, and searches the icon catalog. Save any variant as a standalone, layered SVG or save its settings as a JSON recipe. Select an icon to download its SVG. Everything loads from the checkout.

| Asset | Editable source |
| --- | --- |
| Resident portraits | [portraits.mjs](portraits.mjs) defines a 96 × 96 frame with separate paths for skin tone, four face shapes, three eye styles, nine hairstyles, facial hair, clothing, and accessories. Change the option palettes or add layers against the existing face and shoulder anchors. |
| Transport sprites | [vehicles.mjs](vehicles.mjs) defines 19 top-down vehicle types, including road vehicles, buses, rail, ferries, bikes, and emergency services. Body color, accent color, livery, and braking or selection state are configurable. |
| Game icons | [icons.svg](icons.svg) has 174 named, editable 24 × 24 symbols in 11 categories. It covers navigation and files, map layers, playback, commuters, transport, land use, utilities, incidents, the economy, the scenario editor, and feedback states. [icons.mjs](icons.mjs) provides inline references and standalone export. [app-icon.svg](app-icon.svg) is the separate 64 × 64 launcher and browser icon. |
| Menus and controls | [menu.css](menu.css) contains colors, typography, buttons, menu layout, and scenario card styles. [index.html](index.html) shows how to assemble them with normal HTML. The keyboard focus style works with the system fonts and local assets. |
| Menu and campaign illustrations | [Last Train Home](illustrations/last-train-home.png) and [High Water](illustrations/high-water.png) are full-bleed 1536 × 1024 PNGs. They contain no baked-in UI text. |

## Use in the browser

Serve this folder alongside the browser frontend and adjust the import paths to match the frontend's location.

```js
import { portraitForResident, renderPortrait } from "./assets/game/portraits.mjs";
import { renderVehicle, vehicleFootprint } from "./assets/game/vehicles.mjs";
import { iconMarkup } from "./assets/game/icons.mjs";

const appearance = portraitForResident("resident-12837");
const portrait = renderPortrait({ ...appearance, accessory: "glasses" });
const bus = renderVehicle({
  type: "city-bus",
  color: "#386c66",
  accent: "#f3e2b3",
  livery: "stripe",
  state: "braking",
});
const [width, length] = vehicleFootprint("city-bus");
const followIcon = iconMarkup("follow");
```

- Store resolved portrait options when a save must preserve the exact appearance across future asset revisions. A saved gallery recipe has `assetKitVersion`, `kind`, and `options`. Pass the options back to the matching renderer.
- Each vehicle is drawn in a transparent 64 × 64 frame centered at `(32, 32)`, with the nose facing up. Rotate about that center. The returned footprint is in illustration units. Use gameplay dimensions for simulation. For Canvas, decode each needed variant once and reuse it for matching vehicles.
- UI icons inherit `currentColor`. Add a visible label or an accessible name to controls that display an icon by itself. Pair color with an icon and a status label for conditions such as closures or delays. Use documented symbol IDs in scenario and UI data.
- The generated SVGs retain labeled layers for editors. Load multiple copies as image elements or give their layer IDs instance-specific prefixes if inlining them in a shared DOM.

## Artwork generation

Both illustration files were generated with the built-in ImageGen tool. The original prompts are recorded here for future art direction.

### Last Train Home

> Create a production menu illustration for SimLife, an original city simulation about following a commuter home. Generate artwork only, no lettering, logos, interface, borders, or panels. Wide landscape 3:2 composition, sophisticated illustrated printed street atlas mixed with hand-painted editorial game art, satin matte palette of ivory paper, dark pine green, muted sage, slate blue river, golden windows and brick red accents. An elevated oblique view across a fictional dense river city at the end of a weekday. In the central right portion a pale green steel truss bridge crosses a broad slate blue river, a little cream and scarlet commuter train and a few tiny road vehicles are visibly going home. Surrounding mixed-scale city blocks lead to a railway viaduct, shaded parks, and low hills. Foggy gold light on the horizon, meticulously drawn architecture, clear spatial hierarchy, no photograph or plastic toy look. Rich detail with restrained contrast suitable for a large menu panel, foreground streets near the bottom and an elegant quieter skyline above. Full bleed landscape with key landmarks safe for a slight crop at the left or right.

### High Water

> Create a production scenario cover illustration for High Water, a flood recovery mission in SimLife, an original city simulation game. Landscape 3:2 artwork with no text or lettering or interface. Sophisticated hand-painted atlas illustration, matte ivory architecture with moss-green shadows, slate blue river, terracotta accents; a controlled watercolor wash over crisp architectural ink, high craft. Elevated oblique view of a cluster of riverside mid-rise blocks just after a summer storm. The swollen river covers part of the low waterfront road, while a pale green truss bridge and an uphill street stay open, tiny orange municipal rescue and maintenance vehicles visible. Rain clouds breaking into dim warm light, composed and observant, distinctive readable shapes, foreground water and small city details, atmospheric skyline. No injury, no panic, no text, no logos. Draw the scene all the way to the edges and leave central landmarks safe for thumbnail cropping.
