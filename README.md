# Endfield Toolbox

Endfield Toolbox is a browser-based build and rotation sandbox for **Arknights: Endfield** theorycrafting.
It lets you build teams, configure enemies, place commands on a timeline, and inspect total damage, DPS, and event flow.
Supposedly I am aiming at high accuracy reflection of ingame damage. As well as the ability to measure build cost to damage increase. Unfortunately most of the app are still WIP.

## Current Status

This project is in **Alpha**.

Most character data is still incomplete, and you may encounter bugs or inaccuracies.

## How To Use

1. Open the app and create a build from the build list.
2. In **Builder**, configure operators, weapons, gear, talents/potentials, and stats.
3. Switch to **Rotation** and place commands on the timeline.
4. Configure enemy level/commands, then inspect:
   - Total damage / DPS
   - Hit timeline
   - Buff/status state
   - SP and stagger behavior
5. Save multiple builds and compare setups.
6. You can use planner mode

## Running Locally

```bash
npm install
npm run dev
```

## Relatively Fully Implemented Characters

The following operators are currently among the most complete implementations in this repo (relative to others):

- Laevatain
- Ardelia
- Wulfgard
- Akekuri
- Rossi
- Perlica
- Gilberta
- Last Rite
- Yvonne

Implementation depth still varies by mechanic, and details may change as engine support expands.
