# SimLife roadmap

SimLife is a locally runnable city simulation about how people get home. Players will follow individual commuters, identify bottlenecks, and change the city while balancing the needs of different neighborhoods.

## Available now

- A 2D OpenStreetMap converter and browser viewer with roads, buildings, rail, water, and parks.
- City data for New York, Bangkok, Jakarta, Tokyo, and Paris, with selected transit schedules available in the [city data release](https://github.com/Riftar/simlife/releases/tag/data-2026-11-21).
- Color-coded train overlays for Bangkok, Jakarta, and Tokyo, plus landmark concepts for all five cities.
- A locked development environment and a toolchain check documented in the [README](README.md).

## Planned

### A playable rush hour

Build a headless C++17 core and CLI on a small synthetic city with home and job zones. Seed commute demand and use a deterministically ordered event queue. Model capacity-limited road links so a full link backs traffic into the previous one. Follow a commuter home in the browser, change a signal, and replay the same evening to compare neighborhood results. Verify save and load while trips are active and compare the continued state checksum.

### A 100,000-person city

Import a connected road network from a local map extract. Give 100,000 persistent residents homes, jobs, and commute schedules. Model route choice and congestion, and make any resident selectable in the browser. Benchmark a game day and use the same engine in the browser and command-line interface.

### City systems and challenges

Add editable zoning, utilities, an economy, and disasters. Provide scenarios that test traffic decisions and recovery. Build an editor to create, playtest, save, and share scenarios.

### Public transport and campaign

Add local timetable import, walking and transfers, buses, and trains. Complete the 20-scenario campaign and add a versioned modding interface.

The full-version goals include completing a 100,000-resident simulation year in ten minutes on a documented reference machine, preserving checksums across save and load, passing all campaign scenarios with bots, and passing 1,000 mod API cases. These are targets to measure during development.

SimLife can use libraries and online sources when they improve development or gameplay. Pin and prepare dependencies and city data so builders can work locally after setup. City maps and transit snapshots carry their own data licenses.
