"""SimLife map compiler and localhost preview."""

import argparse
import gzip
import io
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import shutil
import sys
import tempfile
import xml.etree.ElementTree as ET
from xml.parsers.expat import ExpatError
from zipfile import BadZipFile

from .convert import convert, parse_bounds
from .trains import PROFILES, compile_lines

WEB = Path(__file__).with_name("web")
WEB_FILES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/map.css": ("map.css", "text/css; charset=utf-8"),
    "/map.js": ("map.js", "text/javascript; charset=utf-8"),
}


def write_map(output, data):
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=output.parent, delete=False) as scratch:
        target = Path(scratch.name)
    try:
        if output.suffix == ".gz":
            with target.open("wb") as stream:
                with gzip.GzipFile(filename="", mode="wb", fileobj=stream, mtime=0, compresslevel=4) as packed:
                    with io.TextIOWrapper(packed, encoding="utf-8") as output_stream:
                        json.dump(data, output_stream, ensure_ascii=False, separators=(",", ":"))
        else:
            with target.open("w", encoding="utf-8") as stream:
                json.dump(data, stream, ensure_ascii=False, separators=(",", ":"))
        os.replace(target, output)
    finally:
        target.unlink(missing_ok=True)


def serve(data_file, port, trains_file=None):
    data_file = data_file.resolve(strict=True)
    if trains_file is not None:
        trains_file = trains_file.resolve(strict=True)

    class PreviewHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.route(head_only=False)

        def do_HEAD(self):
            self.route(head_only=True)

        def route(self, head_only):
            url = self.path.split("?", 1)[0]
            if url == "/map.json":
                self.send_file(data_file, "application/json", head_only, compressed=data_file.suffix == ".gz")
            elif url == "/train-lines.json":
                if trains_file is None:
                    self.send_response(204)
                    self.send_header("Cache-Control", "no-store")
                    self.end_headers()
                else:
                    self.send_file(trains_file, "application/json", head_only, compressed=trains_file.suffix == ".gz")
            elif url in WEB_FILES:
                filename, media_type = WEB_FILES[url]
                self.send_file(WEB / filename, media_type, head_only)
            else:
                self.send_error(404)

        def send_file(self, path, media_type, head_only, compressed=False):
            try:
                stream = path.open("rb")
            except OSError:
                self.send_error(404)
                return
            with stream:
                self.send_response(200)
                self.send_header("Content-Type", media_type)
                self.send_header("Content-Length", str(os.fstat(stream.fileno()).st_size))
                self.send_header("Cache-Control", "no-store")
                if compressed:
                    self.send_header("Content-Encoding", "gzip")
                self.end_headers()
                if head_only:
                    return
                try:
                    shutil.copyfileobj(stream, self.wfile)
                except (BrokenPipeError, ConnectionResetError):
                    pass

    with ThreadingHTTPServer(("127.0.0.1", port), PreviewHandler) as server:
        print(f"SimLife map preview at http://127.0.0.1:{server.server_port}/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    compiler = commands.add_parser("convert", help="compile .osm or .osm.gz to display JSON")
    compiler.add_argument("input", type=Path)
    compiler.add_argument("output", type=Path, help="path ending in .json or .json.gz")
    compiler.add_argument("--name")
    compiler.add_argument("--bounds", type=parse_bounds, metavar="WEST,SOUTH,EAST,NORTH")
    trains = commands.add_parser("train-lines", help="compile a city profile's line colours and track references")
    trains.add_argument("input", type=Path)
    trains.add_argument("output", type=Path)
    trains.add_argument("--profile", choices=PROFILES, required=True)
    trains.add_argument("--gtfs", type=Path, help="optional local agency GTFS Schedule ZIP for line colours")
    preview = commands.add_parser("serve", help="open a compiled map on localhost")
    preview.add_argument("map", type=Path)
    preview.add_argument("--port", type=int, default=8766)
    preview.add_argument("--train-lines", type=Path, help="optional train-lines export from the same OSM source")
    args = parser.parse_args()

    try:
        if args.command == "serve":
            serve(args.map, args.port, args.train_lines)
            return
        if not args.output.name.endswith((".json", ".json.gz")):
            raise ValueError("output must end in .json or .json.gz")
        if args.input.resolve() == args.output.resolve():
            raise ValueError("input and output must be different files")
        if args.command == "train-lines":
            if args.gtfs and args.gtfs.resolve() == args.output.resolve():
                raise ValueError("GTFS and output must be different files")
            data = compile_lines(args.input, args.profile, args.gtfs)
            write_map(args.output, data)
            print(json.dumps({"file": str(args.output), "lines": len(data["lines"]), "skipped": data["skipped"]}))
            return
        data = convert(args.input, name=args.name, bounds=args.bounds)
        write_map(args.output, data)
        counts = {key: len(features) for key, features in data["layers"].items()}
        print(json.dumps({"file": str(args.output), "layers": counts, "warnings": data["warnings"]}))
    except (OSError, ValueError, ET.ParseError, ExpatError, BadZipFile, KeyError, EOFError) as error:
        parser.exit(1, f"simlife-map: {error}\n")


if __name__ == "__main__":
    sys.exit(main())
