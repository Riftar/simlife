"""Read OSM XML and produce projected vector layers for the map viewer."""

import gzip
import math
from pathlib import Path
import xml.etree.ElementTree as ET

EARTH_RADIUS = 6_371_008.8
SUPPORTED_ROADS = {
    "motorway", "trunk", "primary", "secondary", "tertiary", "residential",
    "unclassified", "living_street", "service", "pedestrian", "track",
    "cycleway", "footway", "path", "steps",
}
SUPPORTED_RAIL = {"rail", "subway", "light_rail", "tram", "monorail", "narrow_gauge", "funicular"}


def parse_bounds(value):
    try:
        bounds = tuple(float(part) for part in value.split(","))
        west, south, east, north = bounds
    except ValueError as error:
        raise ValueError("bounds must be west,south,east,north in degrees") from error
    if not (-180 <= west < east <= 180 and -90 < south < north < 90):
        raise ValueError("bounds must have positive size and may not cross the antimeridian")
    return bounds


def tags_of(element):
    return {tag.attrib["k"]: tag.attrib["v"] for tag in element.iterfind("tag")}


def area_kind(tags):
    if tags.get("area") == "no":
        return None
    natural = tags.get("natural")
    landuse = tags.get("landuse")
    if natural in {"water", "bay"} or tags.get("waterway") == "riverbank" or landuse == "reservoir":
        return "water"
    if tags.get("building") not in {None, "no"}:
        return "building"
    if tags.get("leisure") in {"park", "garden", "nature_reserve", "recreation_ground"}:
        return "park"
    if natural in {"wood", "scrub", "grassland", "wetland"} or landuse in {"grass", "forest", "meadow"}:
        return "green"
    return None


def line_kind(tags):
    road = tags.get("highway", "").removesuffix("_link")
    if road in SUPPORTED_ROADS and tags.get("area") != "yes":
        if road in {"unclassified", "living_street"}:
            return "roads", "residential"
        if road in {"cycleway", "footway", "path", "steps", "pedestrian"}:
            return "roads", "path"
        return "roads", road
    railway = tags.get("railway")
    if railway in SUPPORTED_RAIL:
        return "rail", railway
    if tags.get("waterway") in {"river", "canal", "stream"}:
        return "waterways", tags["waterway"]
    if tags.get("natural") == "coastline":
        return "waterways", "coastline"
    return None


def line_level(tags):
    bridge = tags.get("bridge") not in {None, "no"}
    tunnel = tags.get("tunnel") not in {None, "no"}
    structure = "tunnel" if tunnel else "bridge" if bridge else "surface"
    try:
        return int(tags["layer"]), structure
    except (KeyError, ValueError):
        return (-1 if tunnel else 1 if bridge else 0), structure


def read_extract(source):
    nodes = {}
    ways = {}
    drawing_ways = {}
    multipolygons = {}
    labels = {}
    file_bounds = None
    opener = gzip.open if str(source).endswith(".gz") else open

    with opener(source, "rb") as stream:
        reader = ET.iterparse(stream, events=("start", "end"))
        _, root = next(reader)
        if root.tag != "osm":
            raise ValueError("expected an OpenStreetMap XML file with an osm root")
        for event, element in reader:
            if event != "end":
                continue
            if element.tag == "bounds":
                file_bounds = parse_bounds(",".join(
                    element.attrib[key] for key in ("minlon", "minlat", "maxlon", "maxlat")
                ))
            elif element.tag == "node":
                identifier = int(element.attrib["id"])
                nodes[identifier] = (float(element.attrib["lon"]), float(element.attrib["lat"]))
                if len(element):
                    tags = tags_of(element)
                    if tags.get("railway") in {"station", "halt", "tram_stop"} or (
                        tags.get("public_transport") == "station" and tags.get("train") == "yes"
                    ):
                        labels[identifier] = ("station", tags.get("name", ""))
                    elif tags.get("place") in {"city", "town", "suburb", "neighbourhood", "quarter"} and tags.get("name"):
                        labels[identifier] = (tags["place"], tags["name"])
            elif element.tag == "way":
                identifier = int(element.attrib["id"])
                ways[identifier] = tuple(int(node.attrib["ref"]) for node in element.iterfind("nd"))
                tags = tags_of(element)
                area = area_kind(tags)
                line = line_kind(tags)
                if area or line:
                    drawing_ways[identifier] = (area, line, line_level(tags), tags.get("name", ""))
            elif element.tag == "relation":
                tags = tags_of(element)
                area = area_kind(tags)
                if area and tags.get("type") == "multipolygon":
                    members = [
                        (member.get("role", ""), int(member.attrib["ref"]))
                        for member in element.iterfind("member") if member.get("type") == "way"
                    ]
                    multipolygons[int(element.attrib["id"])] = (area, members, tags.get("name", ""))
            else:
                continue
            root.clear()
    return nodes, ways, drawing_ways, multipolygons, labels, file_bounds


def stitch_rings(member_ids, ways):
    """Join way fragments by endpoint identity, with a stable member order."""
    pending = {index: ways.get(identifier, ()) for index, identifier in enumerate(member_ids)}
    endpoints = {}
    for index, path in pending.items():
        if len(path) < 2:
            continue
        endpoints.setdefault(path[0], []).append(index)
        if path[-1] != path[0]:
            endpoints.setdefault(path[-1], []).append(index)
    rings = []
    incomplete = False
    for index in range(len(member_ids)):
        if index not in pending:
            continue
        ring = list(pending.pop(index))
        if len(ring) < 2:
            incomplete = True
            continue
        while ring[-1] != ring[0]:
            next_index = next((candidate for candidate in endpoints[ring[-1]] if candidate in pending), None)
            if next_index is None:
                incomplete = True
                break
            fragment = pending.pop(next_index)
            if fragment[0] != ring[-1]:
                fragment = fragment[::-1]
            ring.extend(fragment[1:])
        if len(ring) >= 4 and ring[0] == ring[-1]:
            rings.append(ring)
    return rings, incomplete


def overlaps(points, bounds):
    west, south, east, north = bounds
    return not (
        max(point[0] for point in points) < west or min(point[0] for point in points) > east
        or max(point[1] for point in points) < south or min(point[1] for point in points) > north
    )


def convert(source, name=None, bounds=None):
    """Return a versioned display map with paths in local integer meters."""
    nodes, ways, drawing, polygons, labels, file_bounds = read_extract(source)
    if not nodes:
        raise ValueError("the extract has no nodes")
    if bounds is None:
        bounds = file_bounds
    if bounds is None:
        west, south = math.inf, math.inf
        east, north = -math.inf, -math.inf
        for lon, lat in nodes.values():
            west, south = min(west, lon), min(south, lat)
            east, north = max(east, lon), max(north, lat)
        bounds = (west, south, east, north)
    west, south, east, north = bounds
    if not (0 < east - west <= 20 and 0 < north - south <= 20):
        raise ValueError("use a city-scale bounding box with a positive width and height")
    meters_per_degree = math.pi * EARTH_RADIUS / 180
    meters_per_lon = meters_per_degree * math.cos(math.radians((south + north) / 2))

    def project(point):
        return (round((point[0] - west) * meters_per_lon), round((north - point[1]) * meters_per_degree))

    def path(points):
        result = []
        previous = None
        for point in points:
            projected = project(point)
            if projected != previous:
                result.extend(projected)
                previous = projected
        return result

    layers = {key: [] for key in ("areas", "waterways", "roads", "rail", "buildings", "labels")}
    warnings = {"incomplete_ways": 0, "incomplete_multipolygons": 0}
    covered = set()

    for identifier, (kind, members, label) in sorted(polygons.items()):
        outer_ids = [ref for role, ref in members if role in {"", "outer"}]
        inner_ids = [ref for role, ref in members if role == "inner"]
        outer, outer_incomplete = stitch_rings(outer_ids, ways)
        inner, inner_incomplete = stitch_rings(inner_ids, ways)
        if not outer or outer_incomplete or inner_incomplete:
            warnings["incomplete_multipolygons"] += 1
            continue
        rings = []
        for refs in outer + inner:
            try:
                points = [nodes[ref] for ref in refs]
            except KeyError:
                warnings["incomplete_multipolygons"] += 1
                rings = []
                break
            if overlaps(points, bounds):
                ring = path(points)
                if len(ring) >= 8:
                    rings.append(ring)
        if rings:
            target = layers["buildings" if kind == "building" else "areas"]
            target.append({"id": f"r{identifier}", "kind": kind, "name": label, "paths": rings})
            covered.update((ref, kind) for ref in outer_ids + inner_ids)

    for identifier, (area, line, level, label) in sorted(drawing.items()):
        refs = ways[identifier]
        if len(refs) < 2:
            continue
        try:
            positions = [nodes[ref] for ref in refs]
        except KeyError:
            warnings["incomplete_ways"] += 1
            continue
        if not overlaps(positions, bounds):
            continue
        points = path(positions)
        if area and refs[0] == refs[-1] and len(points) >= 8 and (identifier, area) not in covered:
            layer = "buildings" if area == "building" else "areas"
            layers[layer].append({"id": f"w{identifier}", "kind": area, "name": label, "paths": [points]})
        if line and len(points) >= 4:
            layer, kind = line
            layers[layer].append({
                "id": f"w{identifier}", "kind": kind, "name": label,
                "level": level[0], "structure": level[1], "paths": [points],
            })

    for identifier, (kind, label) in sorted(labels.items()):
        lon, lat = nodes[identifier]
        if west <= lon <= east and south <= lat <= north:
            layers["labels"].append({
                "id": f"n{identifier}", "kind": kind, "name": label, "point": project((lon, lat)),
            })

    width, height = project((east, south))
    if width < 1 or height < 1:
        raise ValueError("the selected area is smaller than one meter")
    if not any(layers.values()):
        raise ValueError("no drawable map features intersect the selected bounds")
    return {
        "version": 1,
        "name": name or Path(source).name.split(".osm")[0].replace("-", " ").title(),
        "bounds_wgs84": bounds,
        "size_m": [width, height],
        "attribution": "© OpenStreetMap contributors",
        "layers": layers,
        "warnings": warnings,
    }
