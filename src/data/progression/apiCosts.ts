/* eslint-disable */
// Generated from locally cached Warfarin API payloads.

export type CostItem = {
  id: string;
  count: number;
};

export type CharacterSkillCostTable = {
  basic: Record<number, CostItem[]>;
  battleSkill: Record<number, CostItem[]>;
  comboSkill: Record<number, CostItem[]>;
  ultimate: Record<number, CostItem[]>;
};

export type CharacterApiCostEntry = {
  ascensionByStage: Partial<Record<1 | 2 | 3 | 4, CostItem[]>>;
  skillByKey: CharacterSkillCostTable;
  genericTalentCosts: Array<{ breakStage: number; name: string; costs: CostItem[] }>;
  uniqueTalentCosts: Array<{ name: string; level: number; index: number; costs: CostItem[] }>;
};

export type WeaponApiCostEntry = {
  levelUpByLevel: Record<number, { exp: number; gold: number }>;
  tuningByAscension: Partial<Record<1 | 2 | 3 | 4, CostItem[]>>;
};

export const CHARACTER_LEVEL_UP_TABLE: Record<number, { exp: number; gold: number }> = {
  "1": {
    "exp": 20,
    "gold": 0
  },
  "2": {
    "exp": 30,
    "gold": 0
  },
  "3": {
    "exp": 40,
    "gold": 0
  },
  "4": {
    "exp": 60,
    "gold": 0
  },
  "5": {
    "exp": 90,
    "gold": 0
  },
  "6": {
    "exp": 140,
    "gold": 0
  },
  "7": {
    "exp": 200,
    "gold": 0
  },
  "8": {
    "exp": 280,
    "gold": 0
  },
  "9": {
    "exp": 390,
    "gold": 0
  },
  "10": {
    "exp": 510,
    "gold": 10
  },
  "11": {
    "exp": 700,
    "gold": 10
  },
  "12": {
    "exp": 940,
    "gold": 20
  },
  "13": {
    "exp": 1230,
    "gold": 30
  },
  "14": {
    "exp": 1580,
    "gold": 40
  },
  "15": {
    "exp": 2000,
    "gold": 60
  },
  "16": {
    "exp": 2560,
    "gold": 90
  },
  "17": {
    "exp": 3210,
    "gold": 130
  },
  "18": {
    "exp": 3990,
    "gold": 180
  },
  "19": {
    "exp": 4890,
    "gold": 250
  },
  "20": {
    "exp": 6080,
    "gold": 310
  },
  "21": {
    "exp": 7610,
    "gold": 390
  },
  "22": {
    "exp": 8440,
    "gold": 430
  },
  "23": {
    "exp": 9200,
    "gold": 470
  },
  "24": {
    "exp": 9890,
    "gold": 500
  },
  "25": {
    "exp": 10510,
    "gold": 530
  },
  "26": {
    "exp": 11050,
    "gold": 560
  },
  "27": {
    "exp": 11830,
    "gold": 600
  },
  "28": {
    "exp": 12370,
    "gold": 620
  },
  "29": {
    "exp": 12690,
    "gold": 640
  },
  "30": {
    "exp": 13100,
    "gold": 660
  },
  "31": {
    "exp": 13510,
    "gold": 680
  },
  "32": {
    "exp": 14100,
    "gold": 710
  },
  "33": {
    "exp": 14580,
    "gold": 730
  },
  "34": {
    "exp": 14950,
    "gold": 750
  },
  "35": {
    "exp": 15210,
    "gold": 770
  },
  "36": {
    "exp": 15460,
    "gold": 780
  },
  "37": {
    "exp": 15720,
    "gold": 790
  },
  "38": {
    "exp": 15990,
    "gold": 800
  },
  "39": {
    "exp": 16250,
    "gold": 820
  },
  "40": {
    "exp": 16520,
    "gold": 830
  },
  "41": {
    "exp": 17010,
    "gold": 860
  },
  "42": {
    "exp": 17510,
    "gold": 880
  },
  "43": {
    "exp": 18030,
    "gold": 910
  },
  "44": {
    "exp": 18570,
    "gold": 930
  },
  "45": {
    "exp": 19050,
    "gold": 960
  },
  "46": {
    "exp": 19760,
    "gold": 990
  },
  "47": {
    "exp": 20470,
    "gold": 1030
  },
  "48": {
    "exp": 21230,
    "gold": 1070
  },
  "49": {
    "exp": 22070,
    "gold": 1110
  },
  "50": {
    "exp": 22990,
    "gold": 1150
  },
  "51": {
    "exp": 23980,
    "gold": 1200
  },
  "52": {
    "exp": 25050,
    "gold": 1260
  },
  "53": {
    "exp": 26210,
    "gold": 1320
  },
  "54": {
    "exp": 27460,
    "gold": 1380
  },
  "55": {
    "exp": 28820,
    "gold": 1450
  },
  "56": {
    "exp": 30270,
    "gold": 1520
  },
  "57": {
    "exp": 31840,
    "gold": 1600
  },
  "58": {
    "exp": 33530,
    "gold": 1680
  },
  "59": {
    "exp": 35340,
    "gold": 1770
  },
  "60": {
    "exp": 14510,
    "gold": 1820
  },
  "61": {
    "exp": 14710,
    "gold": 1960
  },
  "62": {
    "exp": 14910,
    "gold": 2110
  },
  "63": {
    "exp": 15030,
    "gold": 2250
  },
  "64": {
    "exp": 15390,
    "gold": 2430
  },
  "65": {
    "exp": 15920,
    "gold": 2660
  },
  "66": {
    "exp": 16620,
    "gold": 2930
  },
  "67": {
    "exp": 17500,
    "gold": 3240
  },
  "68": {
    "exp": 18560,
    "gold": 3610
  },
  "69": {
    "exp": 19810,
    "gold": 4050
  },
  "70": {
    "exp": 21250,
    "gold": 4560
  },
  "71": {
    "exp": 22880,
    "gold": 5140
  },
  "72": {
    "exp": 24710,
    "gold": 5820
  },
  "73": {
    "exp": 26750,
    "gold": 6590
  },
  "74": {
    "exp": 29000,
    "gold": 7470
  },
  "75": {
    "exp": 31460,
    "gold": 8480
  },
  "76": {
    "exp": 33400,
    "gold": 9400
  },
  "77": {
    "exp": 35440,
    "gold": 10410
  },
  "78": {
    "exp": 37580,
    "gold": 11520
  },
  "79": {
    "exp": 39800,
    "gold": 12730
  },
  "80": {
    "exp": 42100,
    "gold": 14040
  },
  "81": {
    "exp": 45220,
    "gold": 15720
  },
  "82": {
    "exp": 48510,
    "gold": 17570
  },
  "83": {
    "exp": 51960,
    "gold": 19600
  },
  "84": {
    "exp": 55550,
    "gold": 21830
  },
  "85": {
    "exp": 59300,
    "gold": 24260
  },
  "86": {
    "exp": 63180,
    "gold": 26910
  },
  "87": {
    "exp": 67190,
    "gold": 29800
  },
  "88": {
    "exp": 71340,
    "gold": 32930
  },
  "89": {
    "exp": 75600,
    "gold": 36320
  },
  "90": {
    "exp": -1,
    "gold": -1
  }
};

export const CHARACTER_API_COSTS: Record<string, CharacterApiCostEntry> = {
  "alesh": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_1",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Flash-frozen for Freshness",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Flash-frozen for Freshness",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Veteran Angler",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Veteran Angler",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "arclight": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_1",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Wildland Trekker",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Wildland Trekker",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Hannabit Wisdom",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Hannabit Wisdom",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "avywenna": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_3",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Expedited Delivery",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Expedited Delivery",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Tactful Approach",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Tactful Approach",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "catcher": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_3",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Resilient Defense",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Resilient Defense",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Comprehensive Mindset",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Comprehensive Mindset",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "chenqianyu": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_4",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Slashing Edge",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Slashing Edge",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Momentum Breaker",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Momentum Breaker",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "dapan": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_5",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Reduce and Thicken",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Reduce and Thicken",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Salty or Mild",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Salty or Mild",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "ember": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_2",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Inflamed for the Assault",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Inflamed for the Assault",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Pay the Ferric Price",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Pay the Ferric Price",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "endministrator": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_1",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Essence Disintegration",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Essence Disintegration",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Realspace Stasis",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Realspace Stasis",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "estella": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_4",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Commiseration",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Commiseration",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Laziness Pays Off Now",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Laziness Pays Off Now",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "fluorite": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_5",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Love the Stab and Twist",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Love the Stab and Twist",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Unpredictable",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Unpredictable",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "lastrite": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_5",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Hypothermia",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Hypothermia",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Cryogenic Embrittlement",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Cryogenic Embrittlement",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "lifeng": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_1",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Illumination",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Illumination",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Subduer of Evil",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Subduer of Evil",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "perlica": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_3",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Obliteration Protocol",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Obliteration Protocol",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10800
          }
        ]
      },
      {
        "name": "Cycle Protocol",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 36
          },
          {
            "id": "item_gold",
            "count": 32000
          }
        ]
      }
    ]
  },
  "snowshine": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_4",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Forged",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Polar Survival",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Polar Survival",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "SAR Professional",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "SAR Professional",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "tangtang": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_1",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Skirmisher",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Fam of Honor",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Fam of Honor",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Riot Bringer",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Riot Bringer",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "xaihi": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_2",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Execute Process",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Execute Process",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10800
          }
        ]
      },
      {
        "name": "Freeze Protocol",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 36
          },
          {
            "id": "item_gold",
            "count": 32000
          }
        ]
      }
    ]
  },
  "ardelia": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_4",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_3",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Friendly Presence",
        "level": 1,
        "index": 0,
        "costs": []
      },
      {
        "name": "Friendly Presence",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 36
          },
          {
            "id": "item_gold",
            "count": 7200
          }
        ]
      },
      {
        "name": "Friendly Presence",
        "level": 3,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 85
          },
          {
            "id": "item_gold",
            "count": 26000
          }
        ]
      },
      {
        "name": "Mountainpeak Surfer",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 85
          },
          {
            "id": "item_gold",
            "count": 26000
          }
        ]
      }
    ]
  },
  "laevatain": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_2",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_1",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Scorching Heart",
        "level": 1,
        "index": 0,
        "costs": []
      },
      {
        "name": "Scorching Heart",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Scorching Heart",
        "level": 3,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 18
          },
          {
            "id": "item_gold",
            "count": 16000
          }
        ]
      },
      {
        "name": "Re-Ignition",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10800
          }
        ]
      },
      {
        "name": "Re-Ignition",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 18
          },
          {
            "id": "item_gold",
            "count": 16000
          }
        ]
      }
    ]
  },
  "yvonne": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_3",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_1",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_2",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Keen Mind",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Barrage of Technology",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Barrage of Technology",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Freezing Point",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Freezing Point",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  },
  "gilberta": {
    "ascensionByStage": {
      "1": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 8
        },
        {
          "id": "item_plant_mushroom_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 1600
        }
      ],
      "2": [
        {
          "id": "item_char_break_stage_1_2",
          "count": 25
        },
        {
          "id": "item_plant_mushroom_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 6500
        }
      ],
      "3": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 24
        },
        {
          "id": "item_plant_mushroom_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 18000
        }
      ],
      "4": [
        {
          "id": "item_char_break_stage_3_4",
          "count": 36
        },
        {
          "id": "item_char_skill_specialize_3",
          "count": 20
        },
        {
          "id": "item_plant_mushroom_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 100000
        }
      ]
    },
    "skillByKey": {
      "basic": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "battleSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "comboSkill": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_4",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      },
      "ultimate": {
        "2": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ],
        "3": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_plant_crylplant_1_1",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 2700
          }
        ],
        "4": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 3200
          }
        ],
        "5": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 21
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 4200
          }
        ],
        "6": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 27
          },
          {
            "id": "item_plant_crylplant_1_2",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 5400
          }
        ],
        "7": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 8200
          }
        ],
        "8": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 8
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 1
          },
          {
            "id": "item_gold",
            "count": 10500
          }
        ],
        "9": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_plant_crylplant_1_3",
            "count": 2
          },
          {
            "id": "item_gold",
            "count": 18000
          }
        ],
        "10": [
          {
            "id": "item_char_skill_crown",
            "count": 1
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 15
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 6
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 3
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ],
        "11": [
          {
            "id": "item_char_skill_crown",
            "count": 2
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 24
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 16
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 6
          },
          {
            "id": "item_gold",
            "count": 30000
          }
        ],
        "12": [
          {
            "id": "item_char_skill_crown",
            "count": 3
          },
          {
            "id": "item_char_skill_level_7_12",
            "count": 50
          },
          {
            "id": "item_char_skill_specialize_5",
            "count": 36
          },
          {
            "id": "item_plant_crylplant_2_2",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 65000
          }
        ]
      }
    },
    "genericTalentCosts": [
      {
        "breakStage": 1,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 5
          },
          {
            "id": "item_gold",
            "count": 1000
          }
        ]
      },
      {
        "breakStage": 2,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 1800
          }
        ]
      },
      {
        "breakStage": 3,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 10
          },
          {
            "id": "item_gold",
            "count": 6000
          }
        ]
      },
      {
        "breakStage": 4,
        "name": "Stalwart",
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 20
          },
          {
            "id": "item_gold",
            "count": 12000
          }
        ]
      }
    ],
    "uniqueTalentCosts": [
      {
        "name": "Messenger's Song",
        "level": 1,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 12
          },
          {
            "id": "item_gold",
            "count": 2400
          }
        ]
      },
      {
        "name": "Messenger's Song",
        "level": 2,
        "index": 0,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 40
          },
          {
            "id": "item_gold",
            "count": 8600
          }
        ]
      },
      {
        "name": "Late Reply",
        "level": 1,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_1_6",
            "count": 48
          },
          {
            "id": "item_gold",
            "count": 10000
          }
        ]
      },
      {
        "name": "Late Reply",
        "level": 2,
        "index": 1,
        "costs": [
          {
            "id": "item_char_skill_level_7_12",
            "count": 28
          },
          {
            "id": "item_gold",
            "count": 24000
          }
        ]
      }
    ]
  }
};

export const WEAPON_API_COSTS: Record<string, WeaponApiCostEntry> = {
  "forgeborn_scathe": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_2",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "thermite_cutter": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_2",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "khravengger": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_5",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "artsy_tyrannical": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_3",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "clannibal": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_4",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "brigands_calling": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_4",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "jet": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_4",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "delivery_guaranteed": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_3",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "stanza_of_memorials": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_4",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "detonation_unit": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_5",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "dreams_of_the_starry_beach": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_4",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_1",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  },
  "chivalric_virtues": {
    "levelUpByLevel": {
      "1": {
        "exp": 10,
        "gold": 0
      },
      "2": {
        "exp": 10,
        "gold": 0
      },
      "3": {
        "exp": 10,
        "gold": 0
      },
      "4": {
        "exp": 20,
        "gold": 0
      },
      "5": {
        "exp": 40,
        "gold": 0
      },
      "6": {
        "exp": 50,
        "gold": 0
      },
      "7": {
        "exp": 80,
        "gold": 0
      },
      "8": {
        "exp": 110,
        "gold": 0
      },
      "9": {
        "exp": 150,
        "gold": 0
      },
      "10": {
        "exp": 200,
        "gold": 10
      },
      "11": {
        "exp": 270,
        "gold": 10
      },
      "12": {
        "exp": 370,
        "gold": 10
      },
      "13": {
        "exp": 480,
        "gold": 20
      },
      "14": {
        "exp": 620,
        "gold": 30
      },
      "15": {
        "exp": 780,
        "gold": 50
      },
      "16": {
        "exp": 990,
        "gold": 70
      },
      "17": {
        "exp": 1250,
        "gold": 100
      },
      "18": {
        "exp": 1550,
        "gold": 140
      },
      "19": {
        "exp": 1900,
        "gold": 200
      },
      "20": {
        "exp": 2360,
        "gold": 240
      },
      "21": {
        "exp": 2960,
        "gold": 300
      },
      "22": {
        "exp": 3280,
        "gold": 330
      },
      "23": {
        "exp": 3580,
        "gold": 360
      },
      "24": {
        "exp": 3850,
        "gold": 390
      },
      "25": {
        "exp": 4090,
        "gold": 410
      },
      "26": {
        "exp": 4300,
        "gold": 430
      },
      "27": {
        "exp": 4600,
        "gold": 460
      },
      "28": {
        "exp": 4810,
        "gold": 490
      },
      "29": {
        "exp": 4940,
        "gold": 500
      },
      "30": {
        "exp": 5090,
        "gold": 510
      },
      "31": {
        "exp": 5250,
        "gold": 530
      },
      "32": {
        "exp": 5480,
        "gold": 550
      },
      "33": {
        "exp": 5670,
        "gold": 570
      },
      "34": {
        "exp": 5820,
        "gold": 590
      },
      "35": {
        "exp": 5910,
        "gold": 600
      },
      "36": {
        "exp": 6010,
        "gold": 610
      },
      "37": {
        "exp": 6110,
        "gold": 620
      },
      "38": {
        "exp": 6220,
        "gold": 630
      },
      "39": {
        "exp": 6320,
        "gold": 640
      },
      "40": {
        "exp": 6430,
        "gold": 650
      },
      "41": {
        "exp": 6620,
        "gold": 670
      },
      "42": {
        "exp": 6810,
        "gold": 690
      },
      "43": {
        "exp": 7010,
        "gold": 710
      },
      "44": {
        "exp": 7220,
        "gold": 730
      },
      "45": {
        "exp": 7410,
        "gold": 750
      },
      "46": {
        "exp": 7690,
        "gold": 770
      },
      "47": {
        "exp": 7960,
        "gold": 800
      },
      "48": {
        "exp": 8260,
        "gold": 830
      },
      "49": {
        "exp": 8580,
        "gold": 860
      },
      "50": {
        "exp": 8940,
        "gold": 900
      },
      "51": {
        "exp": 9320,
        "gold": 940
      },
      "52": {
        "exp": 9740,
        "gold": 980
      },
      "53": {
        "exp": 10190,
        "gold": 1020
      },
      "54": {
        "exp": 10680,
        "gold": 1070
      },
      "55": {
        "exp": 11210,
        "gold": 1130
      },
      "56": {
        "exp": 11770,
        "gold": 1180
      },
      "57": {
        "exp": 12380,
        "gold": 1240
      },
      "58": {
        "exp": 13040,
        "gold": 1310
      },
      "59": {
        "exp": 13740,
        "gold": 1380
      },
      "60": {
        "exp": 14110,
        "gold": 1420
      },
      "61": {
        "exp": 15870,
        "gold": 1540
      },
      "62": {
        "exp": 17690,
        "gold": 1670
      },
      "63": {
        "exp": 19480,
        "gold": 1800
      },
      "64": {
        "exp": 21670,
        "gold": 1960
      },
      "65": {
        "exp": 24220,
        "gold": 2160
      },
      "66": {
        "exp": 27210,
        "gold": 2390
      },
      "67": {
        "exp": 30700,
        "gold": 2680
      },
      "68": {
        "exp": 34780,
        "gold": 3010
      },
      "69": {
        "exp": 39510,
        "gold": 3400
      },
      "70": {
        "exp": 44990,
        "gold": 3860
      },
      "71": {
        "exp": 48870,
        "gold": 4400
      },
      "72": {
        "exp": 53240,
        "gold": 5020
      },
      "73": {
        "exp": 58140,
        "gold": 5730
      },
      "74": {
        "exp": 63580,
        "gold": 6560
      },
      "75": {
        "exp": 69600,
        "gold": 7500
      },
      "76": {
        "exp": 74420,
        "gold": 8380
      },
      "77": {
        "exp": 79530,
        "gold": 9350
      },
      "78": {
        "exp": 84940,
        "gold": 10420
      },
      "79": {
        "exp": 90620,
        "gold": 11590
      },
      "80": {
        "exp": 96570,
        "gold": 12880
      },
      "81": {
        "exp": 103570,
        "gold": 14400
      },
      "82": {
        "exp": 110930,
        "gold": 16070
      },
      "83": {
        "exp": 118620,
        "gold": 17900
      },
      "84": {
        "exp": 126650,
        "gold": 19910
      },
      "85": {
        "exp": 134990,
        "gold": 22090
      },
      "86": {
        "exp": 143620,
        "gold": 24470
      },
      "87": {
        "exp": 152540,
        "gold": 27060
      },
      "88": {
        "exp": 161720,
        "gold": 29860
      },
      "89": {
        "exp": 171160,
        "gold": 32900
      },
      "90": {
        "exp": 0,
        "gold": 0
      }
    },
    "tuningByAscension": {
      "1": [
        {
          "id": "item_weapon_break_low",
          "count": 5
        },
        {
          "id": "item_plant_spcstone_1_1",
          "count": 3
        },
        {
          "id": "item_gold",
          "count": 2200
        }
      ],
      "2": [
        {
          "id": "item_weapon_break_low",
          "count": 18
        },
        {
          "id": "item_plant_spcstone_1_2",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 8500
        }
      ],
      "3": [
        {
          "id": "item_weapon_break_high",
          "count": 20
        },
        {
          "id": "item_plant_spcstone_1_3",
          "count": 5
        },
        {
          "id": "item_gold",
          "count": 25000
        }
      ],
      "4": [
        {
          "id": "item_weapon_break_high",
          "count": 30
        },
        {
          "id": "item_char_skill_specialize_2",
          "count": 16
        },
        {
          "id": "item_plant_spcstone_2_2",
          "count": 8
        },
        {
          "id": "item_gold",
          "count": 90000
        }
      ]
    }
  }
};

export const API_ITEM_NAME_OVERRIDES: Record<string, string> = {
  "item_character_exp_lv1_60": "Lv1~60 EXP",
  "item_character_exp_lv61_90": "Lv61~90 EXP",
  "item_weapon_exp": "Weapon EXP",
  "item_weapon_break_low": "Cast Die",
  "item_plant_spcstone_1_1": "Kalkonyx",
  "item_plant_spcstone_1_2": "Auronyx",
  "item_weapon_break_high": "Heavy Cast Die",
  "item_plant_spcstone_1_3": "Umbronyx",
  "item_char_skill_specialize_2": "D96 Steel Sample 4",
  "item_plant_spcstone_2_2": "Wulingstone",
  "item_gold": "T-Creds",
  "item_plant_spcstone_2_1": "Igneosite",
  "item_char_skill_specialize_5": "Triphasic Nanoflake",
  "item_char_skill_specialize_3": "Tachyon Screening Lattice",
  "item_char_skill_specialize_4": "Quadrant Fitting Fluid",
  "item_char_break_stage_1_2": "Protodisk",
  "item_char_break_stage_3_4": "Protoset",
  "item_char_skill_crown": "Mark of Perseverance",
  "item_char_skill_level_1_6": "Protoprism",
  "item_char_skill_level_7_12": "Protohedron",
  "item_char_skill_specialize_1": "Metadiastima Photoemission Tube",
  "item_plant_crylplant_1_1": "Kalkodendra",
  "item_plant_crylplant_1_2": "Chrysodendra",
  "item_plant_crylplant_1_3": "Vitrodendra",
  "item_plant_crylplant_2_1": "Blighted Jadeleaf",
  "item_plant_crylplant_2_2": "False Aggela",
  "item_plant_mushroom_1_1": "Pink Bolete",
  "item_plant_mushroom_1_2": "Red Bolete",
  "item_plant_mushroom_1_3": "Ruby Bolete",
  "item_plant_mushroom_2_1": "Bloodcap",
  "item_plant_mushroom_2_2": "Cosmagaric"
};

export const API_ITEM_NAME_OVERRIDES_ZH: Record<string, string> = {
  "item_character_exp_lv1_60": "1~60级经验值",
  "item_character_exp_lv61_90": "61~90级经验值",
  "item_weapon_exp": "武器经验值",
  "item_char_break_stage_1_2": "协议圆盘",
  "item_char_break_stage_3_4": "协议圆盘组",
  "item_char_skill_crown": "存续的痕迹",
  "item_char_skill_level_1_6": "协议棱柱",
  "item_char_skill_level_7_12": "协议棱柱组",
  "item_char_skill_specialize_1": "超距辉映管",
  "item_char_skill_specialize_2": "D96钢样品四",
  "item_char_skill_specialize_3": "快子遴捡晶格",
  "item_char_skill_specialize_4": "象限拟合液",
  "item_char_skill_specialize_5": "三相纳米片",
  "item_gold": "折金票",
  "item_plant_crylplant_1_1": "晶化多齿叶",
  "item_plant_crylplant_1_2": "纯晶多齿叶",
  "item_plant_crylplant_1_3": "至晶多齿叶",
  "item_plant_crylplant_2_1": "受蚀玉化叶",
  "item_plant_crylplant_2_2": "岩天使叶",
  "item_plant_mushroom_1_1": "轻红柱状菌",
  "item_plant_mushroom_1_2": "中红柱状菌",
  "item_plant_mushroom_1_3": "重红柱状菌",
  "item_plant_mushroom_2_1": "血菌",
  "item_plant_mushroom_2_2": "星门菌",
  "item_plant_spcstone_1_1": "轻黯石",
  "item_plant_spcstone_1_2": "中黯石",
  "item_plant_spcstone_1_3": "重黯石",
  "item_plant_spcstone_2_1": "燎石",
  "item_plant_spcstone_2_2": "武陵石",
  "item_weapon_break_high": "重型强固模具",
  "item_weapon_break_low": "强固模具"
};
