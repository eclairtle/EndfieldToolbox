import { WEAPONS } from "@/data/weapons";

const enWeaponNames = Object.fromEntries(
  WEAPONS.map((weapon) => [weapon.id, weapon.name]),
) as Record<string, string>;

const zhCNWeaponNameOverrides: Record<string, string> = {
  forgeborn_scathe: "熔铸火焰",
  thermite_cutter: "热熔切割器",
  khravengger: "赫拉芬格",
  artsy_tyrannical: "艺术暴君",
  clannibal: "同类相食",
  brigands_calling: "落草",
  jet: "J.E.T.",
  delivery_guaranteed: "使命必达",
  stanza_of_memorials: "悼亡诗",
  detonation_unit: "爆破单元",
  dreams_of_the_starry_beach: "沧溟星梦",
  chivalric_virtues: "骑士精神",
};

export const weaponNamesByLocale = {
  en: enWeaponNames,
  "zh-CN": {
    ...enWeaponNames,
    ...zhCNWeaponNameOverrides,
  },
} as const;
