# Animation Frame Data

Character command timing (`durationFrames`, `offsetFrames`, and repeat timing) should be sourced from `public/gamedata.json`.

Conversion rule:
- `frames = seconds * 60`

When syncing a character:
- `attack_segments[].duration` -> basic sequence segment `durationFrames`
- `attack_segments[].damage_ticks[].offset` -> basic hit `offsetFrames`
- `skill_duration` / `link_duration` / `ultimate_duration` -> command `durationFrames`
- `skill_damage_ticks` / `link_damage_ticks` / `ultimate_damage_ticks` -> command hit timing
