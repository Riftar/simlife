# SimLife roadmap

SimLife is a locally runnable city simulation about how people get home. Players will follow individual commuters, identify bottlenecks, and change the city while balancing the needs of different neighborhoods.

## Available now

- A 2D OpenStreetMap converter and browser viewer with roads, buildings, rail, water, and parks.
- City data for New York, Bangkok, Jakarta, Tokyo, and Paris, with selected transit schedules available in the [city data release](https://github.com/Riftar/simlife/releases/tag/data-2026-11-21).
- Color-coded train overlays for Bangkok, Jakarta, and Tokyo, plus landmark concepts for all five cities.
- A locked development environment and a toolchain check documented in the [README](README.md).

## Desktop mode

Use the pre-uploaded [Bangkok desktop ZIP](https://github.com/Riftar/simlife/releases/tag/desktop-2026-11-21) on the offline desktop. The ZIP stays under 1 GB and includes the project source, pinned local packages and Python runtimes, and one trimmed Bangkok OpenStreetMap extract with its compiled map and transit overlays. Run the map from `localhost` using the bundled launcher. City data retains its source licenses. [Desktop setup](README.md#desktop-mode-offline)

## Planned

### A playable rush hour

Build a headless C++17 core and CLI on a small synthetic city with home and job zones. Seed commute demand and use a deterministically ordered event queue. Model capacity-limited road links so a full link backs traffic into the previous one. Follow a commuter home in the browser, change a signal, and replay the same evening to compare neighborhood results. Verify save and load while trips are active and compare the continued state checksum.

### A 100,000-person city

Import a connected road network from a local map extract. Give 100,000 persistent residents homes, jobs, and commute schedules. Model route choice and congestion, and make any resident selectable in the browser. Benchmark a game day and use the same engine in the browser and command-line interface.

### City systems and challenges

Add editable zoning, utilities, an economy, and disasters. Provide scenarios that test traffic decisions and recovery. Build an editor to create, playtest, save, and share scenarios.

### Public transport and campaign

Add local timetable import, walking and transfers, buses, and trains. Complete the 20-scenario campaign and add a versioned modding interface.

## Full-version acceptance criteria

All four checks must pass on the same release build. Record the build and fixture versions, commands, and results in the release report.

| Goal | Pass condition |
| --- | --- |
| Simulate 100,000 residents for a year | Three fresh headless runs of the same benchmark city each advance 100,000 individually tracked residents through 365 game days in **600 seconds or less** on the documented reference machine. Time from opening the compiled fixture to emitting the final summary. Account for all 73 million baseline commute requests and match the final checksums across runs. |
| Resume a save deterministically | Save during rush-hour congestion, during an active disruption, and just before a day boundary. Restore each save in a fresh process. Hash the canonical simulation state and require exact matches to the uninterrupted run immediately after load, after the next day transition, and at year-end. |
| Win the whole campaign with bots | Finish **20 out of 20** published campaign scenarios on their canonical seeds. Bots use the same observations and commands as players. Each scenario's own scorer must award a win within its published limits. |
| Pass the mod API contract | Run at least **1,000 distinct** cases offline through the public mod API and package interfaces. Require all release cases to pass with zero failures or skips. Cover validation, commands and observations, replay and persistence, and editor package round trips. |
