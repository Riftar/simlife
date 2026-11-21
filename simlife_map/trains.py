"""Compile line colours and OSM way references for local train overlays."""

import csv
import gzip
import io
from pathlib import Path
import re
from xml.parsers import expat
from zipfile import ZipFile


# OSM route master ID, legend label, and matching agency route name when available.
PROFILES = {
    "bangkok": (
        (10285801, "BTS Sukhumvit Line", "Sukhumvit"),
        (7989387, "BTS Silom Line", "Silom"),
        (11747102, "BTS Gold Line", "Gold"),
        (7725030, "MRT Blue Line", "Blue"),
        (7725058, "MRT Purple Line", "Purple"),
        (15806900, "MRT Yellow Line", "Yellow"),
        (16731200, "MRT Pink Line", "Pink"),
        (19279610, "MRT Pink Line · Muang Thong Thani", "Pink"),
        (13058394, "SRT Dark Red Line", "Dark Red Line"),
        (14071496, "SRT Light Red Line", "Light Red Line"),
        (9921501, "Airport Rail Link", "ARL"),
    ),
    "jakarta": (
        (9677671, "MRT North–South Line", ""),
        (16877214, "KRL Bogor Line", ""),
        (15097508, "KRL Cikarang Loop Line", ""),
        (17862078, "KRL Rangkasbitung Line", ""),
        (17193464, "KRL Tangerang Line", ""),
        (17193009, "KRL Tanjung Priok Line", ""),
        (17675696, "Soekarno–Hatta Airport Rail Link", ""),
        (10693161, "LRT Jakarta", ""),
        (16079480, "Jabodebek LRT Bekasi Line", ""),
        (16035222, "Jabodebek LRT Cibubur Line", ""),
        (16115037, "Whoosh", ""),
        (16414281, "Soekarno–Hatta Airport Skytrain", ""),
    ),
    "tokyo": (
        (8026077, "Tokyo Metro Ginza Line", ""),
        (8015940, "Tokyo Metro Marunouchi Line", ""),
        (8026149, "Tokyo Metro Hibiya Line", ""),
        (8026124, "Tokyo Metro Tōzai Line", ""),
        (8026069, "Tokyo Metro Chiyoda Line", ""),
        (8026115, "Tokyo Metro Yūrakuchō Line", ""),
        (8026157, "Tokyo Metro Hanzōmon Line", ""),
        (8026071, "Tokyo Metro Namboku Line", ""),
        (8026161, "Tokyo Metro Fukutoshin Line", ""),
        (8019854, "Toei Asakusa Line", "浅草線"),
        (8019914, "Toei Mita Line", "三田線"),
        (8019866, "Toei Shinjuku Line", "新宿線"),
        (8019893, "Toei Ōedo Line", "大江戸線"),
        (1139468, "JR Yamanote Line", ""),
        (5454995, "JR Keihin–Tōhoku–Negishi Line", ""),
        (10363877, "JR Chūō Rapid Line", ""),
        (10312072, "JR Chūō–Sōbu Line", ""),
        (10372993, "JR Saikyō Line", ""),
        (11664783, "JR Yokosuka–Sōbu Rapid Line", ""),
        (9474346, "JR Keiyō Line", ""),
        (7963671, "Rinkai Line", ""),
        (9221982, "Yurikamome", ""),
        (9251277, "Tokyo Monorail", ""),
        (9253571, "Nippori–Toneri Liner", ""),
    ),
}

RAIL_MODES = {"train", "subway", "light_rail", "tram", "monorail", "funicular"}
NAMED_COLORS = {
    "black": "#000000", "blue": "#0000FF", "brown": "#A52A2A", "gold": "#FFD700",
    "gray": "#808080", "green": "#008000", "grey": "#808080", "orange": "#FFA500",
    "pink": "#FFC0CB", "purple": "#800080", "red": "#FF0000", "white": "#FFFFFF", "yellow": "#FFFF00",
}


def color(value):
    value = value.strip().lower()
    if re.fullmatch(r"#?[0-9a-f]{6}", value):
        return "#" + value.lstrip("#").upper()
    return NAMED_COLORS.get(value)


def gtfs_colors(source):
    colors = {}
    with ZipFile(source) as archive:
        tables = [name for name in archive.namelist() if Path(name).name == "routes.txt"]
        if len(tables) != 1:
            raise ValueError("the GTFS ZIP must contain one routes.txt table")
        with archive.open(tables[0]) as stream:
            rows = csv.DictReader(io.TextIOWrapper(stream, encoding="utf-8-sig"))
            if "route_type" not in (rows.fieldnames or []):
                raise ValueError("GTFS routes.txt must have a route_type column")
            for row in rows:
                if row["route_type"] not in {"0", "1", "2", "5", "6", "7", "12"}:
                    continue
                shade = color(row.get("route_color") or "")
                if shade is not None:
                    names = (row.get("route_short_name") or "").split(";") + (row.get("route_long_name") or "").split(";")
                    for name in names:
                        if name.strip():
                            colors.setdefault(name.strip().casefold(), set()).add(shade)
    return {name: next(iter(shades)) for name, shades in colors.items() if len(shades) == 1}


def read_relations(source):
    """Stream OSM XML while retaining only public rail relations."""
    relations = {}
    current = None
    seen_root = False

    def start(element, attrs):
        nonlocal current, seen_root
        if not seen_root:
            if element != "osm":
                raise ValueError("expected OpenStreetMap XML")
            seen_root = True
        elif element == "relation":
            current = (int(attrs["id"]), {}, [])
        elif current is not None:
            if element == "tag":
                current[1][attrs["k"]] = attrs["v"]
            elif element == "member" and attrs["type"] in {"relation", "way"}:
                if not attrs.get("role", "").startswith(("platform", "stop")):
                    current[2].append((attrs["type"], int(attrs["ref"])))

    def end(element):
        nonlocal current
        if element != "relation":
            return
        identifier, tags, members = current
        kind = tags.get("type")
        if kind in {"route", "route_master"} and tags.get(kind) in RAIL_MODES:
            relations[identifier] = (tags, members)
        current = None

    parser = expat.ParserCreate()
    parser.StartElementHandler = start
    parser.EndElementHandler = end
    opener = gzip.open if str(source).endswith(".gz") else open
    with opener(source, "rb") as stream:
        parser.ParseFile(stream)
    return relations


def collect_lines(relations, entries, palette):
    lines = []
    skipped = []
    for identifier, label, feed_name in entries:
        relation = relations.get(identifier)
        if relation is None:
            skipped.append(label)
            continue
        tags, members = relation
        routes = [relations[ref] for kind, ref in members if kind == "relation" and ref in relations]
        if tags["type"] == "route":
            routes = [relation]
        way_ids = sorted({
            ref for _, parts in routes for kind, ref in parts if kind == "way"
        })
        shade = palette.get(feed_name.casefold())
        source = "gtfs" if shade else "osm"
        if not shade:
            shade = color(tags.get("colour") or tags.get("color") or "")
        if not shade:
            shades = {
                color(route.get("colour") or route.get("color") or "") for route, _ in routes
            } - {None}
            if len(shades) == 1:
                shade = next(iter(shades))
        if not shade or not way_ids:
            skipped.append(label)
            continue
        lines.append({
            "id": f"r{identifier}", "name": label, "color": shade, "color_source": source,
            "ways": [f"w{ref}" for ref in way_ids],
        })
    return lines, skipped


def compile_lines(source, profile, gtfs=None):
    palette = gtfs_colors(gtfs) if gtfs else {}
    lines, skipped = collect_lines(read_relations(source), PROFILES[profile], palette)
    if not lines:
        raise ValueError(f"no mapped train lines found for the {profile} profile")
    return {
        "version": 1, "profile": profile, "lines": lines, "skipped": skipped,
        "gtfs": Path(gtfs).name if gtfs else None,
    }
