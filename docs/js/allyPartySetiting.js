{
    party: [{
        "name": "人修羅",
        "max_hp": 30,
        "cur_hp": 30,
        "max_mp": 29,
        "cur_mp": 29,
        "resistance": {
            "アギ": "weak",
            "ブフ": "weak",
            "ジオ": "weak",
            "ガル": "weak",
            "ハマ": "",
            "ムド": "none",
            "魔力": "",
            "神経": "",
            "精神": ""
        },
        "skills": [{
                name: "通常攻撃",
                limitedTimes: 999,
                effect: {
                    type: ALLY_SKILL_TYPE.ATTACK,
                    damage: 8,
                    criticalRate: 10
                }
            },
            {
                name: "回復薬",
                limitedTimes: 1,
                effect: {
                    type: ALLY_SKILL_TYPE.HEAL,
                    amount: 50
                }
            }
        ]
    }]
};