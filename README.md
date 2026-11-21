# SimLife map converter

Convert a local OpenStreetMap extract into a 2D vector map for SimLife. The browser preview renders selected roads, railways, stations, buildings, parks and water in Canvas. Zoom in for local streets and building footprints.

The converter uses Python 3.9 or newer and its standard library. The viewer uses HTML, CSS and JavaScript. Conversion and preview work offline.

## Convert and preview

```sh
python3 -m simlife_map convert input.osm.gz build/city.json.gz --name "City"
python3 -m simlife_map serve build/city.json.gz
```

Open [the localhost preview](http://127.0.0.1:8766/). Drag to pan or use the arrow keys while the map has focus. Use the wheel, plus and minus keys, or zoom buttons to zoom. The layer controls toggle individual map features.

Use `--bounds=west,south,east,north` to select an area in decimal degrees. The explicit bounds take precedence over any bounds in the source. Use them to crop an extract or prevent outlying reference nodes from setting the extent of a city map. For example, these bounds cover a roughly 25 × 26 km part of Bangkok.

```sh
python3 -m simlife_map convert bangkok.osm.gz build/bangkok.json.gz \
  --name Bangkok --bounds=100.405,13.610,100.635,13.840
```

Both `.osm` and `.osm.gz` inputs are accepted. Use `.json` for an uncompressed export or `.json.gz` for a packed export. Use `--port` if the default localhost port is busy.

## Display format

Version 1 stores the geographic extent as `bounds_wgs84` in west, south, east, north order and the projected size as `size_m`. The map uses local integer meters with the origin at the upper-left, x increasing eastward and y increasing southward.

- `layers.areas` and `layers.buildings` contain polygons, including supported OSM multipolygon holes.
- `layers.waterways`, `layers.roads` and `layers.rail` contain map lines. Roads and rails carry the OSM relative level and bridge or tunnel status when available.
- `layers.labels` contains location and station points. Features carry source IDs prefixed with `n`, `w` or `r` for nodes, ways and relations.
- A line or ring is an array of alternating x and y coordinates. A feature can contain multiple paths. Shapes that intersect the requested bounds retain their geometry. The viewer clips them to the map extent.
- `warnings` counts incomplete source ways and multipolygons skipped during conversion. Open coastline ways render as outlines.

This export is display geometry. The traffic engine will need its own connected road graph and legal turns. Service schedules are separate GTFS inputs. Map data is © OpenStreetMap contributors under the Open Database License. [OpenStreetMap attribution and license](https://www.openstreetmap.org/copyright)

## Color-coded train lines

Compile a train overlay for the `tokyo`, `bangkok`, or `jakarta` profile. Use the same OSM extract as the base map so route members reference the exported railway ways. A local GTFS ZIP supplies operator colors when its rail route names match the profile. Other lines use the color on the OpenStreetMap route master or its member routes. Select a line in the preview legend to isolate it, or use **All lines** to restore the network view. [GTFS route colors](https://gtfs.org/documentation/schedule/reference/#routestxt) · [OSM route master colors](https://wiki.openstreetmap.org/wiki/Relation:route_master)

```sh
python3 -m simlife_map train-lines bangkok.osm.gz build/bangkok.trains.json \
  --profile bangkok --gtfs bangkok-namtang.zip
python3 -m simlife_map serve build/bangkok.json.gz --train-lines build/bangkok.trains.json
```

The profiles cover the principal mapped urban train lines in each selection. The map only shows track sections found in its bounds. Jakarta's currently collected GTFS is Transjakarta bus data, so its train overlay uses OpenStreetMap colors.

## Tests

```sh
python3 -m unittest discover -s tests
```
