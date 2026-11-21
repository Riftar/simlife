# Map data for future landmarks and building use

The published 2026-11-21 Tokyo and Bangkok OpenStreetMap XML extracts contain the original OSM names, feature IDs, tags, and coordinates. They are available offline after downloading the corresponding city archives from the [city data release](https://github.com/Riftar/simlife/releases/tag/data-2026-11-21).

The counts below come from the local source XML snapshot. They count OSM nodes, ways, and relations. A single place can have multiple records, and the totals are not counts of unique physical places.

| Extract | Named records | With name:en | With int_name | With name in local Latin script | building tags | shop tags | office tags |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Tokyo | 211,962 | 88,035 | 329 | 14,868 name:ja-Latn | 1,495,713 | 30,941 | 7,157 |
| Bangkok | 105,974 | 63,841 | 27 | 1,137 name:th-Latn | 467,951 | 11,155 | 2,067 |

English names are incomplete. The name:en tag is an English name, while name:ja-Latn and name:th-Latn indicate Latin-script variants when present. Preserve the original name and alternate tags. Use the local name when a suitable Latin name is unavailable. A name that already uses Latin characters may exist in name without name:en.

The source records include tourism and historic tags, building footprints, and point locations. Some landmarks are mapped as ways and relations. The corresponding city archive contains the member nodes needed to resolve their geometry. The compiled 2D maps were made for display and retain fewer names and building tags than the raw extracts. A future enhancement can derive additional display data from the already published XML.

OSM building tags describe the mapped physical building. shop=mall, office=*, amenity=*, landuse=*, and building=* can describe related uses at different points or footprints. They do not always appear on the same record. In particular, building=yes has no specific type. Preserve source tags and mark unknown or mixed uses rather than assigning an unsupported type.

The landmark examples in the companion README identify source features. Suggested placement points for the following ways are averages of their referenced source-node coordinates in latitude, longitude order. For the full site polygon or precise geometry use the OSM way rather than the approximate point.

| Landmark | Latitude | Longitude | Source |
| --- | ---: | ---: | --- |
| Tokyo Skytree | 35.7100509 | 139.8107133 | way 288269147 |
| Sensō-ji | 35.7141883 | 139.7964277 | way 173154847 |
| Wat Arun | 13.7441272 | 100.4889283 | way 23481741 |
| Grand Palace | 13.7501275 | 100.4916836 | way 23482754 |
| Giant Swing | 13.7518109 | 100.5012752 | way 178353988 |

Map data © OpenStreetMap contributors, available under the [Open Database License](https://www.openstreetmap.org/copyright).
