import gzip
import json
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile

from simlife_map.__main__ import write_map
from simlife_map.convert import convert, parse_bounds
from simlife_map.trains import compile_lines, gtfs_colors


def fixture():
    points = {
        1: (100.000, 13.010), 2: (100.005, 13.010), 3: (100.010, 13.010),
        4: (100.001, 13.002), 5: (100.004, 13.002), 6: (100.004, 13.005), 7: (100.001, 13.005),
        8: (100.002, 13.003), 9: (100.003, 13.003), 10: (100.003, 13.004), 11: (100.002, 13.004),
        12: (100.006, 13.007), 13: (100.009, 13.007), 14: (100.009, 13.009), 15: (100.006, 13.009),
        16: (100.004, 13.016), 17: (100.011, 13.016), 18: (100.033, 13.010), 19: (100.036, 13.012),
    }
    records = ['<osm version="0.6"><bounds minlon="100" minlat="13" maxlon="100.02" maxlat="13.02"/>']
    for identifier, (lon, lat) in points.items():
        station = '<tag k="railway" v="station"/><tag k="name" v="Test Station"/>' if identifier == 2 else ""
        records.append(f'<node id="{identifier}" lat="{lat}" lon="{lon}">{station}</node>')
    for identifier, refs, tags in (
        (100, [1, 2, 3], {"highway": "primary", "bridge": "yes", "layer": "2"}),
        (101, [16, 17], {"railway": "subway", "tunnel": "yes"}),
        (102, [4, 5, 6], {}),
        (103, [4, 7, 6], {}),
        (104, [8, 9, 10, 11, 8], {}),
        (105, [12, 13, 14, 15, 12], {"building": "yes"}),
        (106, [18, 19], {"highway": "secondary"}),
        (107, [3, 99], {"highway": "residential"}),
    ):
        nodes = "".join(f'<nd ref="{ref}"/>' for ref in refs)
        tag_xml = "".join(f'<tag k="{key}" v="{value}"/>' for key, value in tags.items())
        records.append(f'<way id="{identifier}">{nodes}{tag_xml}</way>')
    records.append(
        '<relation id="200"><member type="way" ref="102" role="outer"/>'
        '<member type="way" ref="103" role="outer"/><member type="way" ref="104" role="inner"/>'
        '<tag k="type" v="multipolygon"/><tag k="natural" v="water"/></relation>'
        '<relation id="201"><member type="way" ref="109" role="outer"/>'
        '<tag k="type" v="multipolygon"/><tag k="natural" v="water"/></relation></osm>'
    )
    return "".join(records)


class MapTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.folder = Path(self.directory.name)
        self.source = self.folder / "fixture.osm"
        self.source.write_text(fixture(), encoding="utf-8")

    def test_layers_projection_and_incomplete_geometry(self):
        result = convert(self.source)
        layers = result["layers"]
        self.assertIn(result["size_m"][1], range(2220, 2226))
        self.assertEqual([feature["id"] for feature in layers["roads"]], ["w100"])
        self.assertEqual(layers["roads"][0]["level"], 2)
        self.assertEqual(layers["rail"][0]["structure"], "tunnel")
        self.assertEqual(layers["rail"][0]["level"], -1)
        self.assertEqual(layers["labels"][0]["name"], "Test Station")
        outer, inner = layers["areas"][0]["paths"]
        self.assertEqual(outer[:2], outer[-2:])
        self.assertEqual(inner[:2], inner[-2:])
        self.assertEqual(outer[2], outer[4])
        self.assertEqual(layers["buildings"][0]["kind"], "building")
        self.assertEqual(result["warnings"], {"incomplete_ways": 1, "incomplete_multipolygons": 1})

    def test_bbox_preserves_paths_crossing_the_viewport(self):
        bounds = parse_bounds("100.004,13.008,100.007,13.017")
        result = convert(self.source, bounds=bounds)
        path = result["layers"]["roads"][0]["paths"][0]
        self.assertLess(path[0], 0)
        self.assertGreater(path[-2], result["size_m"][0])
        self.assertEqual(result["layers"]["areas"], [])

    def test_gzip_input_and_output_are_repeatable(self):
        packed_source = self.source.with_suffix(".osm.gz")
        with gzip.open(packed_source, "wt", encoding="utf-8") as stream:
            stream.write(fixture())
        expected = convert(self.source)
        self.assertEqual(convert(packed_source), expected)
        first, second = (self.folder / name for name in ("first.json.gz", "second.json.gz"))
        write_map(first, expected)
        write_map(second, expected)
        self.assertEqual(first.read_bytes(), second.read_bytes())
        with gzip.open(first, "rt", encoding="utf-8") as stream:
            self.assertEqual(json.load(stream)["layers"], json.loads(json.dumps(expected["layers"])))

    def test_invalid_bounds_and_foreign_document(self):
        with self.assertRaisesRegex(ValueError, "positive size"):
            parse_bounds("179,1,-179,2")
        self.source.write_text("<html/>", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "OSM|OpenStreetMap"):
            convert(self.source)

    def test_train_overlay_uses_agency_color_and_deduplicates_track_ways(self):
        self.source.write_text(
            '<osm><relation id="10"><tag k="type" v="route"/><tag k="route" v="subway"/>'
            '<member type="way" ref="101" role=""/><member type="way" ref="102" role="platform_exit_only"/>'
            '</relation><relation id="11"><tag k="type" v="route"/><tag k="route" v="subway"/>'
            '<member type="way" ref="101" role=""/><member type="way" ref="103" role=""/>'
            '</relation><relation id="10285801"><tag k="type" v="route_master"/>'
            '<tag k="route_master" v="subway"/><tag k="colour" v="green"/>'
            '<member type="relation" ref="10" role=""/><member type="relation" ref="11" role=""/>'
            '</relation></osm>', encoding="utf-8",
        )
        feed = self.folder / "test.zip"
        with ZipFile(feed, "w") as archive:
            archive.writestr("routes.txt", "route_type,route_short_name,route_color\n1,Sukhumvit,abcdef\n3,Sukhumvit,000000\n")
        [route] = compile_lines(self.source, "bangkok", feed)["lines"]
        self.assertEqual(route["ways"], ["w101", "w103"])
        self.assertEqual((route["color"], route["color_source"]), ("#ABCDEF", "gtfs"))
        [fallback] = compile_lines(self.source, "bangkok")["lines"]
        self.assertEqual((fallback["color"], fallback["color_source"]), ("#008000", "osm"))

    def test_train_palette_skips_conflicting_and_missing_colors(self):
        feed = self.folder / "test.zip"
        with ZipFile(feed, "w") as archive:
            archive.writestr(
                "routes.txt",
                "route_type,route_short_name,route_long_name,route_color\n"
                "2,Red,Dark Red Line,FF0000\n"
                "2,Red,Light Red Line,FE6666\n"
                "2,Green,Green Line,\n",
            )
        self.assertEqual(gtfs_colors(feed), {"dark red line": "#FF0000", "light red line": "#FE6666"})


if __name__ == "__main__":
    unittest.main()
