import type { WeaponBase } from "@/data/weapons";

export const DELIVERY_GUARANTEED: WeaponBase = {
  id: "delivery_guaranteed",
  name: "Delivery Guaranteed",
  weaponType: "ARTS_UNIT",
  baseAtkLv1: 51,
  baseAtkLv90: 500,
  skills: [
    { id: "WIL_UP", name: "WIL Boost (L)", rank: 3, implemented: true },
    { id: "ULT_GAIN_UP", name: "Ult Gain UP",  rank: 3, implemented: false },
    { id: "UNIQUE", name: "Conditional Arts DMG UP",  rank: 3, implemented: false },
  ],
};

export const STANZA_OF_MEMORIALS: WeaponBase = {
  id: "stanza_of_memorials",
  name: "Stanza of Memorials",
  weaponType: "ARTS_UNIT",
  baseAtkLv1: 42,
  baseAtkLv90: 411,
  skills: [
    { id: "INT_UP", name: "INT Boost(M)",  rank: 2, implemented: true },
    { id: "ATK_UP", name: "ATK Boost(M)",  rank: 2, implemented: false }, 
    { id: "UNIQUE", name: "Conditional ATK% UP",  rank: 3, implemented: false },
  ],
};

export const DETONATION_UNIT: WeaponBase = {
  id: "detonation_unit",
  name: "Detonation Unit",
  weaponType: "ARTS_UNIT",
  baseAtkLv1: 50,
  baseAtkLv90: 490,
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attri Boost(L)",  rank: 3, implemented: true },
    { id: "ARTS_INTENSITY_UP", name: "Arts Intensity Boost(L)",  rank: 3, implemented: false },
    { id: "UNIQUE", name: "Conditional ATK% UP",  rank: 3, implemented: false },
  ],
};

export const DREAMS_OF_THE_STARRY_BEACH: WeaponBase = {
  id: "dreams_of_the_starry_beach",
  name: "Dreams of the Starry Beach",
  weaponType: "ARTS_UNIT",
  baseAtkLv1: 50,
  baseAtkLv90: 495,
  skills: [
    { id: "INT_UP", name: "INT Boost(L)",  rank: 3, implemented: true },
    { id: "HEALING_UP", name: "Treatment Efficiency Boost(L)",  rank: 3, implemented: false },
    { id: "UNIQUE", name: "Conditional ATK% UP",  rank: 3, implemented: false },
  ],
};