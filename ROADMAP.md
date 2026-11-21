# SimLife roadmap

SimLife is an offline city simulation in development. Players will follow individual commuters, identify bottlenecks, and compare how changes affect different neighborhoods.

## Available now

- A 2D OpenStreetMap converter and browser viewer with roads, buildings, rail, water, and parks.
- City data for New York, Bangkok, Jakarta, Tokyo, and Paris, with selected transit schedules available in the [city data release](https://github.com/Riftar/simlife/releases/tag/data-2026-11-21).
- Color-coded train overlays for Bangkok, Jakarta, and Tokyo, plus landmark concepts for all five cities.
- Editable portraits, vehicle sprites, and icons in the [game asset kit](assets/game/README.md).
- A locked development environment and a toolchain check documented in the [README](README.md).

## Desktop mode

The [255 MB Bangkok desktop ZIP](https://github.com/Riftar/simlife/releases/tag/desktop-2026-11-21) stays under 1 GB. It includes the tagged source, artwork, pinned packages and Python runtimes, and a trimmed Bangkok OpenStreetMap extract with its compiled map and transit data. Run the map from `localhost` using the bundled launcher. City data retains its source licenses. [Desktop setup](README.md#desktop-mode-offline)

## Planned

### A playable rush hour

Follow a commuter through two fictional neighborhoods that share a bridge. See why they wait, rewind, and change one signal. Compare on-time arrivals in both neighborhoods and resume the same rush hour from a save made during congestion.

### A Bangkok rush hour with 100,000 commuters

Bring commuter follow to one Bangkok district with 100,000 synthetic residents. Play through a road closure and recovery, compare outcomes by neighborhood, and benchmark the rush hour on the offline Linux reference machine.

### City systems and the year benchmark

Add zoning, utilities, an economy, and disasters. Check performance and save/load across a simulated year.

### Campaign, scenario editor, and mods

Build 20 scenarios around traffic decisions and recovery, with a deterministic bot that can win each one. Build an editor to create, playtest, import, and export scenarios through the versioned mod API.

Extend the map scenarios with local timetable import, walking and transfers, buses, and trains.

## Full-version acceptance criteria

All four checks must pass on the same release build. Record the build and fixture versions, commands, and results in the release report.

| Goal | Pass condition |
| --- | --- |
| Simulate 100,000 residents for a year | Three headless runs of the same 365-day benchmark, each in **600 seconds or less** on the documented offline Linux reference machine. The final checksums match across runs. |
| Resume a save deterministically | Saves taken during congestion, during a disruption, and before a day change must each reproduce the uninterrupted run's checksums through year-end. |
| Win the whole campaign with bots | Finish **20 out of 20** published campaign scenarios on their canonical seeds. Bots use the same observations and commands as players. Each scenario's own scorer must award a win within its published limits. |
| Pass the mod API contract | Pass at least **1,000 distinct** offline tests of the mod API and scenario packages, with zero failures or skips. |
