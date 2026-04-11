import type { GearBase, GearSetBonus } from "@/data/gears";

export const PULSER_LABS_SET_BONUS: GearSetBonus = {
  "name": "Pulser Labs",
  "description": "3-piece set effect: Wearer's Arts Intensity +30. \nAfter the wearer applies Electrification, the wearer gains Electric DMG +50% for 10s. After the wearer applies Solidification, the wearer gains Cryo DMG +50% for 10s. The aforementioned effects cannot stack."
};

export const PULSER_LABS: GearBase[] = [
  {
    "id": "item_equip_t4_suit_pulse_cryst01_body_01",
    "name": "Pulser Labs Disruptor Suit",
    "slot": "ARMOR",
    "set": "Pulser Labs",
    "defFlat": 56,
    "subs": [
      {
        "stat": "INT",
        "value": 87
      },
      {
        "stat": "WIL",
        "value": 58
      },
      {
        "stat": "ARTS_INTENSITY",
        "value": 20
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_pulse_cryst01_edc_01",
    "name": "Pulser Labs Probe",
    "slot": "KIT",
    "set": "Pulser Labs",
    "defFlat": 21,
    "subs": [
      {
        "stat": "INT",
        "value": 32
      },
      {
        "stat": "AGI",
        "value": 21
      },
      {
        "stat": "ARTS_INTENSITY",
        "value": 41
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_pulse_cryst01_edc_02",
    "name": "Pulser Labs Calibrator",
    "slot": "KIT",
    "set": "Pulser Labs",
    "defFlat": 21,
    "subs": [
      {
        "stat": "INT",
        "value": 41
      },
      {
        "stat": "ARTS_INTENSITY",
        "value": 41
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_pulse_cryst01_edc_03",
    "name": "Pulser Labs Invasion Core",
    "slot": "KIT",
    "set": "Pulser Labs",
    "defFlat": 21,
    "subs": [
      {
        "stat": "WIL",
        "value": 41
      },
      {
        "stat": "ULTIMATE_DMG_PCT",
        "value": 0.517
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_pulse_cryst01_hand_01",
    "name": "Pulser Labs Gloves",
    "slot": "GLOVES",
    "set": "Pulser Labs",
    "defFlat": 42,
    "subs": [
      {
        "stat": "WIL",
        "value": 65
      },
      {
        "stat": "INT",
        "value": 43
      }
    ],
  }
];

