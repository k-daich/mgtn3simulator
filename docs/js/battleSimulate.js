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

var ATK_RESULT = {
    HIT: 1,
    AVOID: 2,
    CRITICAL: 3,
    REFLECT: 4,
    ABSORP: 5,
}


var battleResult = {
    "count_win": 0,
    "count_lose": 0
};

var enemyParty = new Array();
var allyParty = new Array();
var turnNum;

function TurnPressManager() {
    var turnPress = new Array();
    var privateFunc = {};

    privateFunc.countInitTurn = function(party) {
        var actionableMemberNum = 0;
        for (var mem of party) {
            if (mem.isAlive()) actionableMemberNum++;
        }
        loggingObj('TurnPressManager.countInitTurn', actionableMemberNum);
        return actionableMemberNum;
    }

    this.toString = function(isAlly) {

        var str = isAlly ? 'ALLY [' : 'ENEMY [';
        for (var element of turnPress) {
            switch (element) {
                case TURN_PRESS_STATUS.ONE:
                    str = str + '■,';
                    break;
                case TURN_PRESS_STATUS.HALF:
                    str = str + '□,';
                    break;
                case TURN_PRESS_STATUS.NONE:
                    str = str + '-,';
                    break;
            }
        }
        return str.substring(0, str.length - 1) + ']';
    }

    this.initTurn = function(party) {
        turnPress = Array(privateFunc.countInitTurn(party));
        turnPress.fill(TURN_PRESS_STATUS.ONE);
        loggingObj('TurnPressManager.init', turnPress);
    }

    this.isTurnEnd = function(party) {
        for (var status of turnPress) {
            if (status != TURN_PRESS_STATUS.NONE) return false;
        }
        return true;
    }

    this.decrementTurn = {
        one: function() {
            for (var index in turnPress) {
                if (TURN_PRESS_STATUS.ONE == turnPress[index] ||
                    TURN_PRESS_STATUS.HALF == turnPress[index]) {
                    turnPress[index] = TURN_PRESS_STATUS.NONE;
                    return;
                }
            }
            loggingObj('TurnPressManager.decrementTurn[ONE] Error : Unexpected turnPress values', turnPress);
        },

        half: function() {
            for (var index in turnPress) {
                if (TURN_PRESS_STATUS.ONE == turnPress[index]) {
                    turnPress[index] = TURN_PRESS_STATUS.HALF;
                    return;
                } else if (TURN_PRESS_STATUS.HALF == turnPress[index]) {
                    for (var afterIdx = index + 1; afterIdx < turnPress.length; afterIdx++) {
                        if (TURN_PRESS_STATUS.ONE == turnPress[afterIdx]) {
                            turnPress[index] = TURN_PRESS_STATUS.HALF;
                            return;
                        }
                    }
                    turnPress[index] = TURN_PRESS_STATUS.NONE;
                }
            }
            loggingObj('TurnPressManager.decrementTurn[HALF] Error : Unexpected turnPress values', turnPress);
        },

        two: function() {
            for (var index in turnPress) {
                if (TURN_PRESS_STATUS.ONE == turnPress[index] ||
                    TURN_PRESS_STATUS.HALF == turnPress[index]) {
                    turnPress[index] = TURN_PRESS_STATUS.NONE;
                    if (turnPress.length != index + 1) {
                        turnPress[index + 1] = TURN_PRESS_STATUS.NONE;
                    }
                    return;
                }
            }
            loggingObj('TurnPressManager.decrementTurn[ONE] Error : Unexpected turnPress values', turnPress);
        },

        all: function() {
            turnPress.fill(TURN_PRESS_STATUS.NONE);
        },
    }
}

const trnPrssMngr = new TurnPressManager();

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
        logging('SimulateEvent.attack', ' param:' + damage + ',' + hitRate + ',' + criticalRate);

        if (privateFunc.isHit(hitRate)) {
            logging('SimulateEvent.attack', 'hitted');
            if (privateFunc.isCritical(criticalRate)) {
                logging('SimulateEvent.attack', 'criticaled');
                trnPrssMngr.decrementTurn.half();
                return damage * 1.5;
            }
            trnPrssMngr.decrementTurn.one();
            return damage;
        }
        trnPrssMngr.decrementTurn.two();
        return 0;
    }

    this.decrementMp = function(member, costMp) {
        if (0 < member.cur_mp - costMp) {
            member.cur_mp - costMp;
            return true;
        } else {
            smltrLggr.appendSimulateLog('[Not Enough MP]  ' + decrementMp.name + 'はMPが足りない！');
            return false;
        }
    }

    this.printDiedLog = function(member, isAlly) {
        if (isAlly) {
            smltrLggr.appendSimulateLog('[DEAD]   ' + member.name + 'は力尽きた。', '#f36');
        } else {
            smltrLggr.appendSimulateLog('[DEAD]   ' + member.name + 'は力尽きた。', '#ff9');
        }
    }

    this.judgeFightOut = function() {
        privateFunc.ifLostBattleReset();
        privateFunc.ifWonBattleReset();
    }

    privateFunc.ifLostBattleReset = function() {
        for (var allyMem of allyParty) {
            // logging('allyMem.isAlive', allyMem.isAlive());
            if (allyMem.isAlive()) return;
        }
        // 全員死んでいたら負けを表示
        privateFunc.dispLose();
    }

    privateFunc.ifWonBattleReset = function() {
        for (var enemyMem of enemyParty) {
            // logging('enemyMem.isAlive', enemyMem.isAlive());
            if (enemyMem.isAlive()) return;
        }
        // 全員死んでいたら勝ちを表示
        privateFunc.dispWin();
    }

    privateFunc.dispWin = function() {
        // logging('dispWin', 'start')
        battleResult.count_win = ++battleResult.count_win;
        battleReset();
    }

    privateFunc.dispLose = function() {
        // logging('dispLose', 'start')
        battleResult.count_lose = ++battleResult.count_lose;
        battleReset();
    }

    this.appendTurnPressLog = function(isAlly) {
        smltrLggr.appendSimulateLog(trnPrssMngr.toString(isAlly), '#ccc');
    }


    /**
     * 敵側の1ターンアクション
     */
    this.actEnemyTurn = function() {
        // プレスターン状態を初期化（敵側）
        trnPrssMngr.initTurn(enemyParty);
        // プレスターンが終了するまで繰り返す
        while (!trnPrssMngr.isTurnEnd()) {
            // logging('enemy is not end of turn', trnPrssMngr.isTurnEnd());
            // 前回行動したメンバーのIndexを保存する（初期値はパーティの最終Index）
            var preActedIdx = enemyParty.length - 1;
            // パーティの数だけ繰り返し、行動可能なメンバーを探す
            for (var actOrderIdx = 1; actOrderIdx != enemyParty.length + 1; actOrderIdx++) {
                // 前回行動したメンバーを始点とし、行動可能か判定する
                var i = (preActedIdx + actOrderIdx) % enemyParty.length;
                // logging('isActionable', 'index : ' + i );
                if (enemyParty[i].isActionable) {
                    preActedIdx = i;
                    // logging('actionEnemy', 'index : ' + i);
                    let enemyMem = new EnemyMember(enemyParty[i]);
                    enemyMem.action();
                    break;
                }
            }

        }
    }
}

const smltrEvnt = new SimulateEvent();

function SimulateLogger() {
    var privateFunc = {};

    var _ = {
        "isAllyTurn": true,
    };

    privateFunc.getBgColor = function(isAlly) {
        logging('privateFunc.getBgColor', isAlly);
        if (isAlly == undefined) return _.isAllyTurn ? '#446' : '#644';
        logging('privateFunc.getBgColor', 'judged undefined');
        return isAlly ? '#446' : '#644';
    }

    privateFunc.switchLogBgColor = function(isAllyTurn) {
        _.isAllyTurn = isAllyTurn;
    }

    this.appendTurnPartition = function(turnNum) {
        $('#i_simulateLog').append('<span>' + turnNum + 'ターン目　： ');
    }

    this.switchActionSide = function(isAllyTurn) {
    	privateFunc.switchLogBgColor(isAllyTurn);
        $('#i_simulateLog').append('<span>' + isAllyTurn ? 'ALLY TURN' : 'ENEMY TURN' + '　： ');
    }

    privateFunc.appendLifeGageLog = function(turnNum, lifeGageInfoArray) {
        loggingObj('privateFunc.appendLifeGageLog', lifeGageInfoArray)
        $('#i_simulateLog').append('<span class="c_simulateLog_details">' + turnNum + 'ターン目　： ');
        for (var info of lifeGageInfoArray) {
            $('#i_simulateLog').append('<span style="background-color:' + privateFunc.getBgColor(info.isAlly) + '">' + info.name + ' <meter id="i_enemyHpMeterLog" max="' + info.max_hp + '" value="' + info.cur_hp + '"></meter></span>');
        }
        $('#i_simulateLog').append('</span></span><br/>');
        $("#i_simulateLog").scrollTop($("#i_simulateLog")[0].scrollHeight);
    }

    function LifeGageInfo(member, isAlly) {
        this.name = member.name;
        this.cur_hp = member.cur_hp;
        this.max_hp = member.max_hp;
        this.isAlly = member.isAlly;
    }

    this.appendAllMemLifeGageLog = function(turnNum) {
        var lifeGageInfoArray = new Array();
        for (var allyMem of allyParty) {
            lifeGageInfoArray.push(new LifeGageInfo(allyMem, true));
        }
        for (var enemyMem of enemyParty) {
            lifeGageInfoArray.push(new LifeGageInfo(enemyMem, false));
        }
        privateFunc.appendLifeGageLog(turnNum, lifeGageInfoArray);
    }

    this.appendSimulateLog = function(text, color) {
        if (!color) color = '#fff';
        $('#i_simulateLog').append('<div class="c_simulateLog_details" style="color:' + color + '; background-color:' + privateFunc.getBgColor() + '">' + text + '</div>');
    }
}

const smltrLggr = new SimulateLogger();

function AllyMember(allyMem) {
    this.name = allyMem.name;
    this.max_hp = allyMem.max_hp;
    this.cur_hp = allyMem.cur_hp;
    this.max_mp = allyMem.max_mp;
    this.cur_mp = allyMem.cur_mp;
    this.resistance = allyMem.resistance;
    this.skills = allyMem.skills;
    this.isAlly = true;

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
        smltrEvnt.appendTurnPressLog(true);
        // logging('AllyMember.action', 'start');
        var _effect = this.skills[skill_index].effect;

        switch (_effect.type) {
            case ALLY_SKILL_TYPE.ATTACK:
                var doneDamage = smltrEvnt.attack(_effect.damage, _effect.hitRate, _effect.criticalRate);
                var beDeadflg = false;
                // logging('actionEnemyMem : doneDamage', doneDamage);

                if (0 < enemyParty[0].cur_hp - doneDamage) {
                    // 減算した結果が0より大きい場合は減算した結果を現在HPに設定する
                    enemyParty[0].cur_hp = enemyParty[0].cur_hp - doneDamage;
                } else {
                    // 減算した結果が0以下の場合は0を現在HPに設定する
                    enemyParty[0].cur_hp = 0;
                    beDeadflg = true;
                }
                // HTML上に反映する
                replace('#enemy_hp', enemyParty[0].cur_hp + ' / ' + enemyParty[0].max_hp);
                smltrLggr.appendSimulateLog(ALLY_SKILL_TYPE.ATTACK + ' ' + this.name + 'は' + enemyParty[0].name + 'に' + this.skills[skill_index].name + '。' + doneDamage + 'のダメージを与えた。');
                if (beDeadflg) smltrEvnt.printDiedLog(enemyParty[0], false);
                break;
            case ALLY_SKILL_TYPE.HEAL:
                if (this.max_hp < this.cur_hp + _effect.amount) {
                    // 加算した結果が最大HPより大きい場合は最大HPを現在HPに設定する
                    this.cur_hp = this.max_hp;
                } else {
                    // 加算した結果が最大HP以下の場合は加算した結果を現在HPに設定する
                    this.cur_hp = this.cur_hp + _effect.amount;
                }
                trnPrssMngr.decrementTurn.one();
                // HTML上に反映する
                replace('#ally_hp', this.cur_hp + ' / ' + this.max_hp);
                smltrLggr.appendSimulateLog(ALLY_SKILL_TYPE.HEAL + ' ' + this.name + 'は' + this.skills[skill_index].name + 'を' + this.name + 'に唱えた。' + _effect.amount + '回復した。');

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
    this.isAlly = false;

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
     * 行動可否を返す
     */
    this.isActionable = function() {
        // TODO : implements other factor
        return this.isAlive();
    }

    /**
     * 行動する
     */
    this.action = function() {
        smltrEvnt.appendTurnPressLog(false);
        // logging('EnemyMember.action', 'start');
        if (trnPrssMngr.isTurnEnd()) return;
        var skill_index = privateFunc.decideEnemyAction(this.skills);
        // logging('action', 'skill_index : ' + skill_index);
        var _effect = this.skills[skill_index].effect;

        switch (_effect.type) {
            case ENEMY_SKILL_TYPE.ATTACK:
                var doneDamage = smltrEvnt.attack(_effect.damage, _effect.hitRate, _effect.criticalRate);
                var beDeadflg = false;
                // logging('actionEnemyMem : doneDamage', doneDamage);
                if (0 < allyParty[0].cur_hp - doneDamage) {
                    // 減算した結果が0より大きい場合は減算した結果を現在HPに設定する
                    allyParty[0].cur_hp = allyParty[0].cur_hp - doneDamage;
                } else {
                    // 減算した結果が0以下の場合は0を現在HPに設定する
                    allyParty[0].cur_hp = 0;
                    beDeadflg = true;
                }
                // HTML上に反映する
                replace('#ally_hp', allyParty[0].cur_hp + ' / ' + allyParty[0].max_hp);
                smltrLggr.appendSimulateLog(ENEMY_SKILL_TYPE.ATTACK + ' ' + this.name + 'は' + allyParty[0].name + 'に' + this.skills[skill_index].name + '。' + doneDamage + 'のダメージを与えた。');
                if (beDeadflg) smltrEvnt.printDiedLog(allyParty[0], true);
                break;
            case ENEMY_SKILL_TYPE.HEAL:
                if (this.max_hp < this.cur_hp + _effect.amount) {
                    // 加算した結果が最大HPより大きい場合は最大HPを現在HPに設定する
                    this.cur_hp = this.max_hp;
                } else {
                    // 加算した結果が最大HP以下の場合は加算した結果を現在HPに設定する
                    this.cur_hp = this.cur_hp + _effect.amount;
                }
                trnPrssMngr.decrementTurn.one();
                // HTML上に反映する
                replace('#enemy_hp', this.cur_hp + ' / ' + this.max_hp);
                smltrLggr.appendSimulateLog(ENEMY_SKILL_TYPE.HEAL + ' ' + this.name + 'は' + this.skills[skill_index].name + 'を' + this.name + 'に唱えた。' + _effect.amount + '回復した。');
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
        // loggingObj('ajaxResult : enemy', data);
        data.party.forEach(member => enemyParty.push(new EnemyMember(member)));
        // loggingObj('ajaxResult : enemyParty', enemyParty);

        $.ajax({
            type: "get",
            url: "/mgtn3simulator/js/allySetiting.json?query=" + Date.now(),
            dataType: "json",
        }).then(
            function(data) {
                // loggingObj('ajaxResult : ally', data);
                data.party.forEach(member => allyParty.push(new AllyMember(member)));
                // loggingObj('ajaxResult : allyParty', allyParty);

                battleReset();
                // allyのアクションボタンにイベントリスナー付与
                $('.ally-action-button').on('click', allyActionButtonMdown);
            },
            // 通信失敗時の処理
            function() {
                logging("ajaxエラー", "allySetting.json failed.");
            }
        );
    },
    // 通信失敗時の処理
    function() {
        logging("ajaxエラー", "enemySetting.json failed.");
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
    // loggingObj('replaceAttrBefore : ' + eleId, 'attrName : ' + attrName + ', value : ' + value);
    $(eleId).attr(attrName, value);
    // loggingObj('replaceAttrAfter : ' + eleId, 'replaced value : ' + $(eleId).attr(attrName));
};

function battleReset() {
    logging('battleReset @ battleSimulator.js', 'start');

    trnPrssMngr.initTurn(allyParty);
    initMemsStatus();
    turnNum = 1;
    loggingObj('battleReset : enemyParty', enemyParty);
    loggingObj('battleReset : allyParty', allyParty);

    replace('#battleResult_count_win', battleResult.count_win);
    replace('#battleResult_count_lose', battleResult.count_lose);

    replace('#enemy_name', enemyParty[0].name);
    replace('#enemy_hp', enemyParty[0].cur_hp + ' / ' + enemyParty[0].max_hp);
    replace('#enemy_mp', enemyParty[0].cur_mp + ' / ' + enemyParty[0].max_mp);
    replaceAttr('#i_enemy_hp_meter', 'max', enemyParty[0].max_hp);
    replaceAttr('#i_enemy_hp_meter', 'value', enemyParty[0].cur_hp);
    replaceAttr('#i_enemy_mp_meter', 'max', enemyParty[0].max_mp);
    replaceAttr('#i_enemy_mp_meter', 'value', enemyParty[0].cur_mp);

    for (var i = 0; i < enemyParty[0].skills.length; i++) {
        replace('#enemy_skill-' + i, enemyParty[0].skills[i].name);
        replace('#enemy_skill-select-probability-' + i, enemyParty[0].skills[i].probability);
    }

    replace('#ally_name', allyParty[0].name);
    replace('#ally_hp', allyParty[0].cur_hp + ' / ' + allyParty[0].max_hp);
    replace('#ally_mp', allyParty[0].cur_mp + ' / ' + allyParty[0].max_mp);
    replaceAttr('#i_ally_hp_meter', 'max', allyParty[0].max_hp);
    replaceAttr('#i_ally_hp_meter', 'value', allyParty[0].cur_hp);
    replaceAttr('#i_ally_mp_meter', 'max', allyParty[0].max_mp);
    replaceAttr('#i_ally_mp_meter', 'value', allyParty[0].cur_mp);

    for (var i = 0; i < allyParty[0].skills.length; i++) {
        replace('#ally_skill-' + i, allyParty[0].skills[i].name);
        replace('#ally_skill-limitedTimes-' + i, allyParty[0].skills[i].limitedTimes);
    }
}

function initMemsStatus() {
    logging('initMemsStatus @ battleSimulator.js', 'start');
    enemyParty.forEach(function(enemyMem) {
        enemyMem.cur_hp = enemyMem.max_hp;
        enemyMem.cur_mp = enemyMem.max_mp;
    });

    allyParty.forEach(function(allyMem) {
        allyMem.cur_hp = allyMem.max_hp;
        allyMem.cur_mp = allyMem.max_mp;
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

    // 使用回数をデクリメントする
    var dcrmntNum = parseInt(this.textContent, 10) - 1;
    replace('#' + this.id, dcrmntNum);

    // 効果の反映を行う
    // id値の末尾番号から
    var skill_index = parseInt(this.attributes.skill_index.value, 10);

    smltrLggr.switchActionSide(true);
    smltrLggr.appendAllMemLifeGageLog(turnNum);
    let allyMem = new AllyMember(allyParty[0]);
    allyMem.action(skill_index);
    smltrLggr.appendAllMemLifeGageLog(turnNum);

    if (trnPrssMngr.isTurnEnd()) {
        smltrLggr.appendSimulateLog('[TURN END]  ALLY');
        smltrLggr.appendAllMemLifeGageLog(turnNum);
        smltrLggr.switchActionSide(false);
        logging('trnPrssMngr', 'Turn End');
        smltrEvnt.actEnemyTurn();
        smltrLggr.appendAllMemLifeGageLog(turnNum);
        smltrLggr.appendSimulateLog('[TURN END]  ENEMY');
        turnNum++;
    }

    replaceAttr('#i_enemy_hp_meter', 'value', enemyParty[0].cur_hp);
    replaceAttr('#i_enemy_mp_meter', 'value', enemyParty[0].cur_mp);
    replaceAttr('#i_ally_hp_meter', 'value', allyParty[0].cur_hp);
    replaceAttr('#i_ally_mp_meter', 'value', allyParty[0].cur_mp);

    smltrLggr.appendAllMemLifeGageLog(turnNum);

    smltrEvnt.judgeFightOut();
    // 二度押し防止用フラグ：落とす
    allyActionButtonMdown_runningFlg = false;
};