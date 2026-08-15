# Weapon draft stubs

These draft files are generated from https://warfarin.wiki/en/weapons for 6-star weapons.

Warfarin API indexes used to discover newly added equipment:

- https://api.warfarin.wiki/v1/en/weapons
- https://api.warfarin.wiki/v1/en/gear
- https://api.warfarin.wiki/v1/en/operators

Individual records are available at `/v1/en/weapons/{slug}` and
`/v1/en/gear/{slug}` respectively.

Each file includes:
- weapon type and wiki URL
- reusable exact Lv1-Lv90 base ATK table id
- final-stage tuning materials
- skill rank-1 descriptions

Remaining work per draft:
- hook shared skills into the live weapon skill layer where missing
- implement unique passives/effects
- integrate more weapons into src/data/weap/*.ts as needed
