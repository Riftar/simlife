"""Build the versioned Bangkok desktop ZIP and its checksums."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from hashlib import file_digest
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import tomllib
from urllib.parse import urlsplit
from urllib.request import urlopen
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile

from simlife_map.__main__ import write_map
from simlife_map.convert import convert

ROOT = Path(__file__).resolve().parents[1]
BOUNDS = (100.405, 13.610, 100.635, 13.840)
ZIP_ROOT = "simlife-desktop-bangkok"
PYTHON_VERSION = "3.12.16"
PYTHON_RELEASE = "20261026"
PYTHON_SOURCE = f"https://github.com/astral-sh/python-build-standalone/releases/download/{PYTHON_RELEASE}"
PLATFORMS = {
    "darwin-arm64": (
        "aarch64-apple-darwin",
        "353d5f1b4fd2715e7053f12f068435d5bbad16b91e057006b5d01e0925709a7e",
        re.compile(r"-macosx_[\d_]+_(?:arm64|universal2)\.whl$"),
    ),
    "linux-x86_64": (
        "x86_64-unknown-linux-gnu",
        "ce4f6d0a6cfdb3bed6e44c2f9affd85943c76a42e25ad3a259002f31d6fb8a20",
        re.compile(r"-manylinux.*_x86_64\.whl$"),
    ),
}


def sha256(path):
    with path.open("rb") as stream:
        return file_digest(stream, "sha256").hexdigest()


def download(url, expected, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and sha256(target) == expected:
        return
    with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as stream:
        scratch = Path(stream.name)
        try:
            with urlopen(url, timeout=90) as response:
                shutil.copyfileobj(response, stream)
            stream.flush()
            if sha256(scratch) != expected:
                raise ValueError(f"SHA-256 mismatch for {url}")
            scratch.replace(target)
        finally:
            scratch.unlink(missing_ok=True)


def wheel_name(wheel):
    return Path(urlsplit(wheel["url"]).path).name


def select_wheel(package, platform_tags):
    wheels = package["wheels"]
    portable = [wheel for wheel in wheels if wheel_name(wheel).endswith("-py3-none-any.whl")]
    compatible = portable or [
        wheel
        for wheel in wheels
        if platform_tags.search(wheel_name(wheel))
        and ("-cp312-" in wheel_name(wheel) or "-py3-none-" in wheel_name(wheel))
    ]
    if len(compatible) != 1:
        raise ValueError(f"Expected one wheel for {package['name']} on {platform_tags.pattern}")
    return compatible[0]


def prepare_dependencies(payload):
    lock = tomllib.loads((ROOT / "uv.lock").read_text(encoding="utf-8"))
    packages = [package for package in lock["package"] if "registry" in package["source"]]
    resources = []
    wheelhouse = payload / "wheels"
    index = {"python_version": PYTHON_VERSION, "platforms": {}}
    for platform, (target, digest, platform_tags) in PLATFORMS.items():
        filename = f"cpython-{PYTHON_VERSION}+{PYTHON_RELEASE}-{target}-install_only_stripped.tar.gz"
        runtime_url = f"{PYTHON_SOURCE}/{filename}"
        runtime = payload / "runtimes" / f"{platform}.tar.gz"
        resources.append((runtime_url, digest, runtime))
        folder = wheelhouse / platform
        folder.mkdir(parents=True, exist_ok=True)
        wheels = []
        requirements = []
        for package in packages:
            wheel = select_wheel(package, platform_tags)
            name = wheel_name(wheel)
            resources.append((wheel["url"], wheel["hash"].removeprefix("sha256:"), folder / name))
            requirements.append(f"{package['name']}=={package['version']} --hash={wheel['hash']}")
            wheels.append({"filename": name, **wheel})
        (folder / "requirements.txt").write_text("\n".join(requirements) + "\n", encoding="utf-8")
        index["platforms"][platform] = {
            "python": {"url": runtime_url, "sha256": digest},
            "wheels": wheels,
        }
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(download, url, digest, target) for url, digest, target in resources]
        for future in futures:
            future.result()
    (payload / "dependencies.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")


def trim_extract(source, output):
    import osmium

    west, south, east, north = BOUNDS
    nearby = osmium.IdTracker()
    rail_modes = {"subway", "train", "light_rail", "tram", "monorail"}
    with osmium.BackReferenceWriter(output, source, remove_tags=False, relation_depth=1) as writer:
        for feature in osmium.FileProcessor(source):
            if feature.is_node():
                location = feature.location
                if location.valid() and west <= location.lon <= east and south <= location.lat <= north:
                    nearby.add_node(feature.id)
                    writer.add_node(feature)
            elif feature.is_way() and nearby.contains_any_references(feature):
                nearby.add_way(feature.id)
                writer.add_way(feature)
            elif feature.is_relation():
                kind = feature.tags.get("type", "")
                if (
                    kind in {"multipolygon", "restriction"}
                    or (kind == "route" and feature.tags.get("route", "") in rail_modes)
                ) and nearby.contains_any_references(feature):
                    writer.add_relation(feature)


def prepare_city(source, payload):
    city = payload / "city"
    city.mkdir(parents=True, exist_ok=True)
    snapshot = json.loads((source / "manifest.json").read_text(encoding="utf-8"))
    source_files = {entry["path"]: entry for entry in snapshot["files"]}
    raw = "osm/bangkok.osm.gz"
    original_overlay = "maps/bangkok.trains.json"
    timetable = "transit/bangkok-namtang.zip"
    for entry in (raw, original_overlay, timetable):
        if sha256(source / entry) != source_files[entry]["sha256"]:
            raise ValueError(f"Bangkok input does not match its snapshot manifest: {entry}")

    with tempfile.TemporaryDirectory(dir=city) as scratch:
        trimmed = Path(scratch) / "bangkok.osm.gz"
        trim_extract(source / raw, trimmed)
        compiled = convert(trimmed, name="Bangkok", bounds=BOUNDS)
        trimmed.replace(city / "bangkok.osm.gz")
    write_map(city / "bangkok.map.json.gz", compiled)

    overlay = json.loads((source / original_overlay).read_text(encoding="utf-8"))
    rails = {feature["id"] for feature in compiled["layers"]["rail"]}
    for line in overlay["lines"]:
        line["ways"] = [way for way in line["ways"] if way in rails]
    overlay["lines"] = [line for line in overlay["lines"] if line["ways"]]
    write_map(city / "bangkok.trains.json", overlay)
    shutil.copyfile(source / timetable, city / "bangkok-namtang.zip")
    shutil.copyfile(source / "DATA-LICENSES.md", city / "UPSTREAM-DATA-LICENSES.md")
    manifest = {
        "city": "Bangkok",
        "coverage_wgs84": BOUNDS,
        "snapshot": "https://github.com/Riftar/simlife/releases/tag/data-2026-11-21",
        "source_acquired_on": snapshot["acquired_on"],
        "source_files": [source_files[entry] for entry in (raw, original_overlay, timetable)],
        "changes": (
            "Keep nodes inside the bounding box, ways touching them, selected multipolygons, "
            "turn restrictions and rail routes with local members, and their available references. "
            "Compile the display map at the declared bounds and trim the overlay to displayed railway ways. "
            "The timetable is the original provider ZIP."
        ),
        "files": {
            path.name: {"sha256": sha256(path), "bytes": path.stat().st_size}
            for path in sorted(city.iterdir())
            if path.name != "manifest.json"
        },
    }
    (city / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared Bangkok with {len(compiled['layers']['roads']):,} display roads and {len(overlay['lines'])} train lines")


def pack(payload, ref, output):
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=output.parent) as scratch:
        archive = Path(scratch) / output.name
        subprocess.run(
            ["git", "archive", "--format=zip", f"--prefix={ZIP_ROOT}/", f"--output={archive}", ref],
            cwd=ROOT, check=True,
        )
        with ZipFile(archive, "a") as zip_file:
            for path in sorted(payload.rglob("*")):
                if path.is_file():
                    compression = ZIP_STORED if path.suffix in {".gz", ".whl", ".zip"} else ZIP_DEFLATED
                    zip_file.write(path, f"{ZIP_ROOT}/desktop/{path.relative_to(payload).as_posix()}", compression)
        if archive.stat().st_size > 1_000_000_000:
            raise ValueError("Desktop ZIP exceeds the 1 GB release limit")
        archive.replace(output)
    (output.parent / "SHA256SUMS.txt").write_text(f"{sha256(output)}  {output.name}\n", encoding="utf-8")
    print(f"Packed {output.stat().st_size:,} bytes at {output}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    prepare_parser = subparsers.add_parser("prepare")
    prepare_parser.add_argument("bangkok", type=Path, help="extracted Bangkok snapshot folder")
    prepare_parser.add_argument("payload", type=Path)
    pack_parser = subparsers.add_parser("pack")
    pack_parser.add_argument("payload", type=Path)
    pack_parser.add_argument("output", type=Path)
    pack_parser.add_argument("--ref", default="HEAD")
    args = parser.parse_args()
    if args.command == "prepare":
        prepare_dependencies(args.payload)
        prepare_city(args.bangkok, args.payload)
    else:
        pack(args.payload, args.ref, args.output)


if __name__ == "__main__":
    main()
