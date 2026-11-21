"""Verify the local tools needed to start building the simulation."""

from pathlib import Path
import shutil
import sqlite3
import subprocess
import sys
from tempfile import TemporaryDirectory

import osmium


ROOT = Path(__file__).resolve().parents[1]


def check_pbf(directory: Path) -> None:
    fixture = directory / "fixture.osm.pbf"
    with osmium.SimpleWriter(fixture) as writer:
        writer.add_node(osmium.osm.mutable.Node(id=1, location=(100.5, 13.7)))
    node_ids = [node.id for node in osmium.FileProcessor(fixture)]
    if node_ids != [1]:
        raise RuntimeError(f"Unexpected OSM PBF fixture node IDs: {node_ids}")
    print("Pyosmium PBF write and read passed", flush=True)


def check_sqlite() -> None:
    connection = sqlite3.connect(":memory:")
    try:
        version, = connection.execute("SELECT sqlite_version()").fetchone()
    finally:
        connection.close()
    print(f"SQLite {version} query passed", flush=True)


def main() -> None:
    cmake = shutil.which("cmake")
    ctest = shutil.which("ctest")
    if cmake is None or ctest is None:
        raise SystemExit("CMake and CTest are missing. Run the check with uv run --locked.")

    with TemporaryDirectory(prefix="simlife-toolchain-") as directory:
        scratch = Path(directory)
        check_pbf(scratch)
        check_sqlite()
        build = scratch / "build"
        subprocess.run(
            [cmake, "-S", str(ROOT / "tools/toolchain"), "-B", str(build),
             "-DCMAKE_BUILD_TYPE=Release"],
            check=True,
        )
        subprocess.run([cmake, "--build", str(build), "--config", "Release"], check=True)
        subprocess.run(
            [ctest, "--test-dir", str(build), "-C", "Release", "--output-on-failure"],
            check=True,
        )

    subprocess.run(
        [sys.executable, "-m", "unittest", "discover", "-s", "tests"],
        cwd=ROOT,
        check=True,
    )


if __name__ == "__main__":
    main()
