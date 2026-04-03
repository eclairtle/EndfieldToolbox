# Gamedata Localization Guide (CN → EN)

This guide maps `public/gamedata.json` character move/buff identifiers to the English localization used on Warfarin Wiki (`/en/operators/{charactername}`).

Date: 2026-04-03

## 1) Core moveset field mapping (gamedata schema)

| gamedata field | Meaning in app data | English localization term |
|---|---|---|
| `attack_segments` | Normal attack chain + finisher + dive behavior | **Basic Attack** |
| `skill_*` | Main active skill package | **Battle Skill** |
| `link_*` | Follow-up trigger skill package | **Combo Skill** |
| `ultimate_*` | Ultimate skill package | **Ultimate** |
| `execution_*` | Finisher/execution interaction rules | **Finisher / Execution behavior** |

## 2) Shared status/buff localization map

> Notes:
> - Left side is from `gamedata` keys/types (`exclusive_buffs.key`, anomaly `type`, etc.).
> - Right side is the English term used by the wiki/game localization.
> - Entries marked **(inferred)** are best-fit mappings from skill text context.

| gamedata key/type | EN localization |
|---|---|
| `blaze_attach` | **Heat Infliction** |
| `nature_attach` | **Nature Infliction** |
| `corrosion` | **Corrosion** |
| `frozen` | **Solidification** *(inferred; Yvonne skill text matches this behavior)* |
| `affix_slow` | **Slow** |
| `spell_vulnerable` | **Arts Susceptibility** |
| `physical_vulnerable` | **Physical Susceptibility** |
| `antal_buff` / `聚焦` | **Focus** |
| `pulse_enhance` / `电磁增幅` | **Electric Amp** |
| `fire_enhance` / `灼热增幅` | **Heat Amp** |
| `combo` / `连击` | **Link** *(Akekuri talent wording)* |
| `magma_0..4` / `熔火0..4` | **Melting Flame** stacks *(Laevatain)* |

## 3) Character-by-character localization (current `src/data` roster)

### AKEKURI (`秋栗`)
- EN operator page: `https://warfarin.wiki/en/operators/akekuri`
- Basic Attack: **Sword of Aspiration**
- Battle Skill (`skill_*`): **Burst of Passion**
- Combo Skill (`link_*`): **Flash and Dash**
- Ultimate (`ultimate_*`): **SQUAD! ON ME!**
- Buff/status notes:
  - `combo` (`连击`) maps to **Link** (see talent wording “Link buff persists”).
  - anomaly `blaze_attach` maps to **Heat Infliction**.

### ANTAL (`安塔尔`)
- EN operator page: `https://warfarin.wiki/en/operators/antal`
- Basic Attack: **Exchange Current**
- Battle Skill (`skill_*`): **Specified Research Subject**
- Combo Skill (`link_*`): **EMP Test Site**
- Ultimate (`ultimate_*`): **Overclocked Moment**
- Buff/status notes:
  - `antal_buff` (`聚焦`) maps to **Focus**.
  - `pulse_enhance` (`电磁增幅`) maps to **Electric Amp**.
  - `fire_enhance` (`灼热增幅`) maps to **Heat Amp**.

### ARDELIA (`艾尔黛拉`)
- EN operator page: `https://warfarin.wiki/en/operators/ardelia`
- Basic Attack: **Rocky Whispers**
- Battle Skill (`skill_*`): **Dolly Rush**
- Combo Skill (`link_*`): **Eruption Column**
- Ultimate (`ultimate_*`): **Wooly Party**
- Buff/status notes:
  - `physical_vulnerable` (`物理脆弱`) maps to **Physical Susceptibility**.
  - `spell_vulnerable` (`法术脆弱`) maps to **Arts Susceptibility**.
  - anomaly `corrosion` maps to **Corrosion**.

### GILBERTA (`洁尔佩塔`)
- EN operator page: `https://warfarin.wiki/en/operators/gilberta`
- Basic Attack: **Arcane Staff: Beam Cohesion Arts**
- Battle Skill (`skill_*`): **Arcane Staff: Gravity Mode**
- Combo Skill (`link_*`): **Arcane Staff: Matrix Displacement**
- Ultimate (`ultimate_*`): **Arcane Staff: Gravity Field**
- Buff/status notes:
  - `affix_slow` (`缓速`) maps to **Slow**.
  - `spell_vulnerable` (`法术脆弱`) maps to **Arts Susceptibility**.
  - anomaly `nature_attach` maps to **Nature Infliction**.

### LAEVATAIN (`莱万汀`)
- EN operator page: `https://warfarin.wiki/en/operators/laevatain`
- Basic Attack: use operator page **Combat Skills** first entry (Basic Attack section).
- Battle Skill (`skill_*`): use operator page **Battle Skill** entry.
- Combo Skill (`link_*`): use operator page **Combo Skill** entry.
- Ultimate (`ultimate_*`): use operator page **Ultimate** entry.
- Buff/status notes:
  - `magma_0..4` (`熔火0..4`) maps to **Melting Flame** stacks.

### WULFGARD (`狼卫`)
- EN operator page: `https://warfarin.wiki/en/operators/wulfgard`
- Basic Attack: use operator page **Combat Skills** first entry (Basic Attack section).
- Battle Skill (`skill_*`): use operator page **Battle Skill** entry.
- Combo Skill (`link_*`): use operator page **Combo Skill** entry.
- Ultimate (`ultimate_*`): use operator page **Ultimate** entry.
- Buff/status notes:
  - anomaly `blaze_attach` maps to **Heat Infliction**.
  - anomaly `burning` maps to **Burning / Heat DoT** *(inferred)*.

### YVONNE (`伊冯`)
- EN operator page: `https://warfarin.wiki/en/operators/yvonne`
- Basic Attack: **Exuberant Trigger**
- Battle Skill (`skill_*`): **Brr-Brr-Bomb β**
- Combo Skill (`link_*`): **Flashfreezer υ37**
- Ultimate (`ultimate_*`): **Cryoblasting Pistolier**
- Buff/status notes:
  - anomaly `frozen` maps to **Solidification** *(inferred)*.

## 4) Practical implementation guidance

If you want this mapping to be programmatically consumable in `src`, create a dedicated lookup module keyed by `character.id` + per-character alias maps for:
1) move slots (`skill/link/ultimate`) to English display names;
2) status keys (`exclusive_buffs.key` and anomaly `type`) to localized terms;
3) optional confidence flags for inferred mappings.

This keeps raw `gamedata.json` untouched while giving UI/tooling a stable localization layer.
