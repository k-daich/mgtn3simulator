var ALLY_SKILL_TYPE = {
    ATTACK: "[ATTACK]",
    HEAL: "[HEAL]",
}

var ENEMY_SKILL_TYPE = {
    ATTACK: "[ATTACK]",
    HEAL: "[HEAL]",
}

var TURN_PRESS_STATUS = {
    ALL: 10,
    TWO: 2,
    ONE: 1,
    HALF: 0.5,
    NONE: 0,
}

var battleResult = {
    "count_win": 0,
    "count_lose": 0
};

var enemy;
var ally;
var turnNum = 0;

function TurnPressManager() {
    var turnPress;
    var privateFunc = {};

    privateFunc.countInitTurn = function(party) {
        var actionableMemberNum = 0;
        for (var mem of party) {
            if (mem.isAlive) actionableMemberNum++;
        }
        loggingObj('TurnPressManager.countInitPTurn', actionableMemberNum);
        return actionableMemberNum;
    }

    this.init = function(party) {
        turnPress = Array(privateFunc.countInitPTurn(party));
        turnPress.fill(TURN_PRESS_STATUS.ONE);
        loggingObj('TurnPressManager.init', turnPress);
    }

    this.isTurnEnd = function(party) {
        for (var status of turnPress) {
            if (status != TURN_PRESS_STATUS.NONE) return false;
        }
        return true;
    }

    this.decrementTurn[TURN_PRESS_STATUS.ONE] = function() {
        for (var index in turnPress) {
            if (TURN_PRESS_STATUS.ONE == turnPress[index] ||
                TURN_PRESS_STATUS.HALF == turnPress[index]) {
                turnPress[index] = TURN_PRESS_STATUS.NONE;
                return;
            }
        }
        loggingObj('TurnPressManager.decrementTurn[ONE] Error : Unexpected turnPress values', turnPress);
    }

    this.decrementTurn[TURN_PRESS_STATUS.HALF] = function(decrementNum) {
        for (var index in turnPress) {
            if (TURN_PRESS_STATUS.ONE == turnPress[index]) {
                turnPress[index] = TURN_PRESS_STATUS.HALF;
                return;
            } else if (TURN_PRESS_STATUS.HALF == turnPress[index]) {
                for (var afterIdx = index + 1; afterIdx < turnPress.length(); afterIdx++) {
                    if (TURN_PRESS_STATUS.ONE == turnPress[afterIdx]) {
                        turnPress[index] = TURN_PRESS_STATUS.HALF;
                        return;
                    }
                }
                turnPress[index] = TURN_PRESS_STATUS.NONE;
            }
        }
        loggingObj('TurnPressManager.decrementTurn[HALF] Error : Unexpected turnPress values', turnPress);
    }

    this.decrementTurn[TURN_PRESS_STATUS.TWO] = function(decrementNum) {
        for (var index in turnPress) {
            if (TURN_PRESS_STATUS.ONE == turnPress[index] ||
                TURN_PRESS_STATUS.HALF == turnPress[index]) {
                turnPress[index] = TURN_PRESS_STATUS.NONE;
                if (turnPress.length() != index + 1) {
                    turnPress[index + 1] = TURN_PRESS_STATUS.NONE;
                }
                return;
            }
        }
        loggingObj('TurnPressManager.decrementTurn[ONE] Error : Unexpected turnPress values', turnPress);
    }

    this.decrementTurn[TURN_PRESS_STATUS.ALL] = function(decrementNum) {
        turnPress.fill(TURN_PRESS_STATUS.NONE);
    }
}

function SimulateEvent() {
    var pressTurn;
    var privateFunc = {};


    privateFunc.isHit = function(hitRate) {
        logging('SimulateEvent.isHit', 'hitRate : ' + hitRate + ' random : ' + Math.random() * 101);
        return Math.random() * 101 < hitRate;
    }

    privateFunc.isCritical = function(criticalRate) {
        logging('SimulateEvent.isCritical', 'start');
        logging('SimulateEvent.isCritical', 'criticalRate : ' + criticalRate + ' random : ' + Math.random() * 101);
        return Math.random() * 101 < criticalRate;
    }

    this.attack = function(damage, hitRate, criticalRate) {
        logging('SimulateEvent.attack', 'start');
        logging('SimulateEvent.attack', ' param:' + damage + hitRate + criticalRate);

        if (privateFunc.isHit(hitRate)) {
            logging('SimulateEvent.attack', 'hitted');
            if (privateFunc.isCritical(criticalRate)) {
                logging('SimulateEvent.attack', 'criticaled');
                return damage * 1.5;
            }
            return damage;
        }
        return 0;
    }

    this.decrementMp = function(member, costMp) {
        if (0 < member.cur_mp - costMp) {
            member.cur_mp - costMp;
            return true;
        } else {
            appendSimulateLog('[Not Enough MP]  ' + decrementMp.name + 'はMPが足りない！');
            return false;
        }
    }

    this.beDead = function(member, isAlly) {
        member.isAlive = false;
        if (isAlly) {
            appendSimulateLog('[DEAD]   ' + member.name + 'は力尽きた。', '#f36');
        } else {
            appendSimulateLog('[DEAD]   ' + member.name + 'は力尽きた。', '#ff9');
        }
    }
}

const simulateEvent = new SimulateEvent();

function AllyMember(allyMem) {
    this.name = allyMem.name;
    this.max_hp = allyMem.max_hp;
    this.cur_hp = allyMem.cur_hp;
    this.max_mp = allyMem.max_mp;
    this.cur_mp = allyMem.cur_mp;
    this.resistance = allyMem.resistance;
    this.skills = allyMem.skills;

    /**
     * 生きているかを返す
     */
    this.isAlive = function() {
        if (this.cur_hp == 0) {
            return false;
        }
        return true;
    }

    /**
     * 行動する
     */
    this.action = function(skill_index) {
        logging('AllyMember.action', 'start');
        var _effect = this.skills[skill_index].effect;

        switch (_effect.type) {
            case ALLY_SKILL_TYPE.ATTACK:
                var doneDamage = simulateEvent.attack(_effect.damage, _effect.hitRate, _effect.criticalRate);
                logging('actionEnemyMem : doneDamage', doneDamage);

                if (0 < enemy.party[0].cur_hp - doneDamage) {
                    // 減算した結果が0より大きい場合は減算した結果を現在HPに設定する
                    enemy.party[0].cur_hp = enemy.party[0].cur_hp - doneDamage;
                } else {
                    // 減算した結果が0以下の場合は0を現在HPに設定する
                    enemy.party[0].cur_hp = 0;
                    simulateEvent.beDead(enemy.party[0], false);
                }
                // HTML上に反映する
                replace('#enemy_hp', enemy.party[0].cur_hp + ' / ' + enemy.party[0].max_hp);
                appendSimulateLog(ALLY_SKILL_TYPE.ATTACK + ' ' + this.name + 'は' + enemy.party[0].name + 'に' + this.skills[skill_index].name + '。' + doneDamage + 'のダメージを与えた。');
                break;
            case ALLY_SKILL_TYPE.HEAL:
                if (this.max_hp < this.cur_hp + _effect.amount) {
                    // 加算した結果が最大HPより大きい場合は最大HPを現在HPに設定する
                    this.cur_hp = this.max_hp;
                } else {
                    // 加算した結果が最大HP以下の場合は加算した結果を現在HPに設定する
                    this.cur_hp = this.cur_hp + _effect.amount;
                }
                // HTML上に反映する
                replace('#ally_hp', this.cur_hp + ' / ' + this.max_hp);
                appendSimulateLog(ALLY_SKILL_TYPE.HEAL + ' ' + this.name + 'は' + this.skills[skill_index].name + 'を' + this.name + 'に唱えた。' + _effect.amount + '回復した。');

                break;
            default:
                logging('actionAlly', 'Error. _effect.type is not found.');
                break;
        }
    }
}

function EnemyMember(enemyMem) {
    this.name = enemyMem.name;
    this.max_hp = enemyMem.max_hp;
    this.cur_hp = enemyMem.cur_hp;
    this.max_mp = enemyMem.max_mp;
    this.cur_mp = enemyMem.cur_mp;
    this.resistance = enemyMem.resistance;
    this.skills = enemyMem.skills;

    var privateFunc = {};

    /**
     * 生きているかを返す
     */
    this.isAlive = function() {
        if (this.cur_hp == 0) {
            return false;
        }
        return true;
    }

    /**
     * 行動する
     */
    this.action = function() {
        logging('EnemyMember.action', 'start');
        var skill_index = privateFunc.decideEnemyAction(this.skills);
        logging('action', 'skill_index : ' + skill_index);
        var _effect = this.skills[skill_index].effect;

        switch (_effect.type) {
            case ENEMY_SKILL_TYPE.ATTACK:
                var doneDamage = simulateEvent.attack(_effect.damage, _effect.hitRate, _effect.criticalRate);
                logging('actionEnemyMem : doneDamage', doneDamage);
                if (0 < ally.party[0].cur_hp - doneDamage) {
                    // 減算した結果が0より大きい場合は減算した結果を現在HPに設定する
                    ally.party[0].cur_hp = ally.party[0].cur_hp - doneDamage;
                } else {
                    // 減算した結果が0以下の場合は0を現在HPに設定する
                    ally.party[0].cur_hp = 0;
                    simulateEvent.beDead(ally.party[0], true);
                }
                // HTML上に反映する
                replace('#ally_hp', ally.party[0].cur_hp + ' / ' + ally.party[0].max_hp);
                appendSimulateLog(ENEMY_SKILL_TYPE.ATTACK + ' ' + this.name + 'は' + ally.party[0].name + 'に' + this.skills[skill_index].name + '。' + doneDamage + 'のダメージを与えた。');
                break;
            case ENEMY_SKILL_TYPE.HEAL:
                if (this.max_hp < this.cur_hp + _effect.amount) {
                    // 加算した結果が最大HPより大きい場合は最大HPを現在HPに設定する
                    this.cur_hp = this.max_hp;
                } else {
                    // 加算した結果が最大HP以下の場合は加算した結果を現在HPに設定する
                    this.cur_hp = this.cur_hp + _effect.amount;
                }
                // HTML上に反映する
                replace('#enemy_hp', this.cur_hp + ' / ' + this.max_hp);
                appendSimulateLog(ENEMY_SKILL_TYPE.HEAL + ' ' + this.name + 'は' + this.skills[skill_index].name + 'を' + this.name + 'に唱えた。' + _effect.amount + '回復した。');
                break;
            default:
                logging('actionEnemy', 'Error. _effect.type is not found.');
                break;
        }
    }

    /**
     * 敵のアクションを乱数より決定する
     */
    privateFunc.decideEnemyAction = function(skills) {
        var totalProbability = 0;
        var rndmNum = Math.floor(Math.random() * 101);
        for (var skill_index in skills) {
            totalProbability = totalProbability + skills[skill_index].probability;
            if (rndmNum <= totalProbability) return skill_index;
        }
        alert('Error @ battolesSimulate.js decideEnemyAction() rndmNum : ' + rndmNum + ',totalProbability : ' + totalProbability);
    }

}

$.ajax({
    type: "get",
    url: "/mgtn3simulator/js/enemySetiting.json?query=" + Date.now(),
    dataType: "json",
}).then(
    // 通信成功時の処理
    function(data) {
        enemy = data;
        loggingObj('ajaxResult : enemy', enemy);
        $.ajax({
            type: "get",
            url: "/mgtn3simulator/js/allySetiting.json?query=" + Date.now(),
            dataType: "json",
        }).then(
            function(data) {
                ally = data;
                loggingObj('ajaxResult : ally', ally);
                initialize(enemy, ally);
                // allyのアクションボタンにイベントリスナー付与
                $('.ally-action-button').on('click', allyActionButtonMdown);
            },
            // 通信失敗時の処理
            function() {
                console.log("ajaxエラー", "allySetting.json failed.");
            }
        );
    },
    // 通信失敗時の処理
    function() {
        console.log("ajaxエラー", "enemySetting.json failed.");
    }
);

function replace(eleId, text) {
    tg_ele = $(eleId);
    // loggingObj('replaceBefore : ' + eleId, text);
    if (!tg_ele) logging('Error @ replace' + document.currentScript, 'not found by id : ' + eleId);
    tg_ele.text(text);
    // loggingObj('replaceAfter : ' + eleId, tg_ele);
};

function replaceAttr(eleId, attrName, value) {
    loggingObj('replaceAttrBefore : ' + eleId, 'attrName : ' + attrName + ', value : ' + value);

    $(eleId).attr(attrName, value);
    loggingObj('replaceAttrAfter : ' + eleId, 'replaced value : ' + $(eleId).attr(attrName));
};

function initialize() {
    logging('initialize @ battleSimulator.js', 'start');

    initMemsStatus();
    turnNum = 0;
    loggingObj('initialized : enemy', enemy);
    loggingObj('initialized : ally', ally);

    replace('#battleResult_count_win', battleResult.count_win);
    replace('#battleResult_count_lose', battleResult.count_lose);

    replace('#enemy_name', enemy.party[0].name);
    replace('#enemy_hp', enemy.party[0].cur_hp + ' / ' + enemy.party[0].max_hp);
    replace('#enemy_mp', enemy.party[0].cur_mp + ' / ' + enemy.party[0].max_mp);
    replaceAttr('#i_enemy_hp_meter', 'max', enemy.party[0].max_hp);
    replaceAttr('#i_enemy_hp_meter', 'value', enemy.party[0].cur_hp);
    replaceAttr('#i_enemy_mp_meter', 'max', enemy.party[0].max_mp);
    replaceAttr('#i_enemy_mp_meter', 'value', enemy.party[0].cur_mp);

    for (var i = 0; i < enemy.party[0].skills.length; i++) {
        replace('#enemy_skill-' + i, enemy.party[0].skills[i].name);
        replace('#enemy_skill-select-probability-' + i, enemy.party[0].skills[i].probability);
    }

    replace('#ally_name', ally.party[0].name);
    replace('#ally_hp', ally.party[0].cur_hp + ' / ' + ally.party[0].max_hp);
    replace('#ally_mp', ally.party[0].cur_mp + ' / ' + ally.party[0].max_mp);
    replaceAttr('#i_ally_hp_meter', 'max', ally.party[0].max_hp);
    replaceAttr('#i_ally_hp_meter', 'value', ally.party[0].cur_hp);
    replaceAttr('#i_ally_mp_meter', 'max', ally.party[0].max_mp);
    replaceAttr('#i_ally_mp_meter', 'value', ally.party[0].cur_mp);

    for (var i = 0; i < ally.party[0].skills.length; i++) {
        replace('#ally_skill-' + i, ally.party[0].skills[i].name);
        replace('#ally_skill-limitedTimes-' + i, ally.party[0].skills[i].limitedTimes);
    }
}

function initMemsStatus() {
    logging('initMemsStatus @ battleSimulator.js', 'start');
    enemy.party.forEach(function(enemyMem) {
        enemyMem.cur_hp = enemyMem.max_hp;
        enemyMem.cur_mp = enemyMem.max_mp;
        enemyMem.isAlive = true;
    });

    ally.party.forEach(function(allyMem) {
        allyMem.cur_hp = allyMem.max_hp;
        allyMem.cur_mp = allyMem.max_mp;
        allyMem.isAlive = true;
    });
}

var allyActionButtonMdown_runningFlg = false;
/**
 * allyアクションボタン押下時の処理を実装する
 */
function allyActionButtonMdown(event) {
    if (allyActionButtonMdown_runningFlg) {
        logging("Error", "doublicate pushed button");
        return;
    }
    // 二度押し防止用フラグ：立てる
    allyActionButtonMdown_runningFlg = true;

    turnNum++;
    // 使用回数をデクリメントする
    var dcrmntNum = parseInt(this.textContent, 10) - 1;
    replace('#' + this.id, dcrmntNum);

    // 効果の反映を行う
    // id値の末尾番号から
    var skill_index = parseInt(this.attributes.skill_index.value, 10);

    let allyMem = new AllyMember(ally.party[0]);
    allyMem.action(skill_index);
    // actionAlly(ally.party[0], skill_index);
    actionEnemy();

    replaceAttr('#i_enemy_hp_meter', 'value', enemy.party[0].cur_hp);
    replaceAttr('#i_enemy_mp_meter', 'value', enemy.party[0].cur_mp);
    replaceAttr('#i_ally_hp_meter', 'value', ally.party[0].cur_hp);
    replaceAttr('#i_ally_mp_meter', 'value', ally.party[0].cur_mp);

    appendLifeGageLog(ally.party[0].name, ally.party[0].cur_hp, ally.party[0].max_hp, turnNum, '#ff6');
    appendLifeGageLog(enemy.party[0].name, enemy.party[0].cur_hp, enemy.party[0].max_hp, turnNum, '#f36');

    judgeFightOut();
    // 二度押し防止用フラグ：落とす
    allyActionButtonMdown_runningFlg = false;
};

/**
 * 敵側のアクション
 */
function actionEnemy() {
    for (var index in enemy.party) {
        // 生きている場合のみ行動する
        if (enemy.party[index].isAlive) {
            loggingObj('TEMP : enemy.party[index]', enemy.party[index]);
            let enemyMem = new EnemyMember(enemy.party[index]);
            enemyMem.action();
        }
    }
}

function judgeFightOut() {
    ifLostInitialize();
    ifWonInitialize();
}

function ifLostInitialize() {
    for (var allyMem of ally.party) {
        logging('allyMem.isAlive', allyMem.isAlive);
        if (allyMem.isAlive) return;
    }
    // 全員死んでいたら負けを表示
    dispLose();
}

function ifWonInitialize() {
    for (var enemyMem of enemy.party) {
        logging('enemyMem.isAlive', enemyMem.isAlive);
        if (enemyMem.isAlive) return;
    }
    // 全員死んでいたら勝ちを表示
    dispWin();
}

function dispWin() {
    logging('dispWin', 'start')
    battleResult.count_win = ++battleResult.count_win;
    initialize();
}

function dispLose() {
    logging('dispLose', 'start')
    battleResult.count_lose = ++battleResult.count_lose;
    initialize();
}