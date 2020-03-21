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
        // loggingObj('TurnPressManager.countInitTurn', actionableMemberNum);
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
        // loggingObj('TurnPressManager.init', turnPress);
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
            debugAlert('TurnPressManager.decrementTurn[ONE]', 'Error : Unexpected turnPress values: ' + turnPress);
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
            debugAlert('TurnPressManager.decrementTurn[HALF]', 'Error : Unexpected turnPress values: ' + turnPress);
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
            debugAlert('TurnPressManager.decrementTurn[TWO]', 'Error : Unexpected turnPress values: ' + turnPress);
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
        // logging('SimulateEvent.isHit', 'hitRate : ' + hitRate + ' random : ' + Math.random() * 101);
        return Math.random() * 101 < hitRate;
    }

    privateFunc.isCritical = function(criticalRate) {
        // logging('SimulateEvent.isCritical', 'criticalRate : ' + criticalRate + ' random : ' + Math.random() * 101);
        return Math.random() * 101 < criticalRate;
    }

    this.attack = function(src, dest, skill_index) {
        var effect = src.skills[skill_index].effect;
        var doneDamage = null;
        // hitした場合
        if (privateFunc.isHit(effect.hitRate)) {
            // critical hitした場合
            if (privateFunc.isCritical(effect.criticalRate)) {
                // logging('SimulateEvent.attack', 'criticaled');
                trnPrssMngr.decrementTurn.half();
                doneDamage = effect.damage * 1.5;
                smltrLggr.appendSimulateLog(effect.type + ' Critical Hit! ' + src.name + 'は' + dest.name + 'に' + effect.name + '。' + doneDamage + 'のダメージを与えた。');
            }
            // critical hitしなかった場合
            else {
                // logging('SimulateEvent.attack', 'hitted');
                trnPrssMngr.decrementTurn.one();
                doneDamage = effect.damage;
                smltrLggr.appendSimulateLog(effect.type + ' ' + src.name + 'は' + dest.name + 'に' + effect.name + '。' + doneDamage + 'のダメージを与えた。');
            }
        }
        // hitしなかった場合
        else {
            trnPrssMngr.decrementTurn.two();
            doneDamage = 0;
            smltrLggr.appendSimulateLog(effect.type + ' ' + src.name + 'は' + dest.name + 'に' + effect.name + '。' + 'だが攻撃は外れた。');
        }

        loggingObj('action : src', src);
        loggingObj('action : dest', dest);
        logging('dest.cur_hp : ' + dest.cur_hp + ' , doneDamage : ' + doneDamage);
        var beDeadflg = false;
        if (0 < dest.cur_hp - doneDamage) {
            // 減算した結果が0より大きい場合は減算した結果を現在HPに設定する
            dest.cur_hp = dest.cur_hp - doneDamage;
        } else {
            // loggingObj('attack : dest', dest)
            // 減算した結果が0以下の場合は0を現在HPに設定する
            dest.cur_hp = 0;
            beDeadflg = true;
        }
        // HTML上に反映する
        var hpId = dest.isAlly ? '#ally_hp' : '#enemy_hp';
        // logging('replace hp : id', hpId);
        replace(hpId, dest.cur_hp + ' / ' + dest.max_hp);
        if (beDeadflg) smltrEvnt.printDiedLog(dest);
    }

    this.heal = function(src, dest, skill_index) {
        var _effect = src.skills[skill_index].effect;
        if (dest.max_hp < dest.cur_hp + _effect.amount) {
            // 加算した結果が最大HPより大きい場合は最大HPを現在HPに設定する
            dest.cur_hp = dest.max_hp;
            // debugAlert('MAX HEALED' , 'cur_hp' + this.cur_hp);
        } else {
            // 加算した結果が最大HP以下の場合は加算した結果を現在HPに設定する
            dest.cur_hp = dest.cur_hp + _effect.amount;
            // debugAlert('HEALED' , 'cur_hp' + this.cur_hp);
        }
        trnPrssMngr.decrementTurn.one();
        // HTML上に反映する
        var hpId = dest.isAlly ? '#ally_hp' : '#enemy_hp';
        debugAlert('HEALED', 'cur_hp' + dest.cur_hp);
        replace(hpId, dest.cur_hp + ' / ' + dest.max_hp);
        smltrLggr.appendSimulateLog(_effect.type + ' ' + src.name + 'は' + _effect.name + 'を' + dest.name + 'に唱えた。' + _effect.amount + '回復した。');
    }

    this.printDiedLog = function(member) {
        if (member.isAlly) {
            smltrLggr.appendSimulateLog('[DEAD]   ' + member.name + 'は力尽きた。', '#f36');
        } else {
            smltrLggr.appendSimulateLog('[DEAD]   ' + member.name + 'は力尽きた。', '#ff9');
        }
    }

    this.isLose = function() {
        for (var allyMem of allyParty) {
            // logging('allyMem.isAlive', allyMem.isAlive());
            if (allyMem.isAlive()) return false;
        }
        return true;
    }

    this.isWin = function() {
        for (var enemyMem of enemyParty) {
            // logging('enemyMem.isAlive', enemyMem.isAlive());
            if (enemyMem.isAlive()) return false;
        }
        return true;
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
        // logging('actEnemyTurn', 'init');
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
                    smltrLggr.appendAllMemLifeGageLog(turnNum);
                    break;
                }
            }

        }
    }

    this.decrementMp = function(effect, mem) {
        if (!effect.costMp) {
            // costMpが未定義、もしくは0の場合は何もしない
        }
        // costMpが足りている場合はMPを減算したうえでアクションを実行する
        else if (privateFunc.isEnoughMp(effect.costMp, this)) {
            mem.cur_mp = mem.cur_mp - effect.costMp;
            if (mem.isAlly) {
                replace('#ally_mp', mem.cur_mp + ' / ' + mem.max_mp);
            } else {
                replace('#enemy_mp', mem.cur_mp + ' / ' + mem.max_mp);
            }
        }
        // MPが足りていない場合はシミュレートログに出力して何もしない
        else {
            smltrLggr.appendSimulateLog(_effect.type + ' ' + mem.name + 'は' + effect.name + 'をしようとしたがMPが足りない！');
            trnPrssMngr.decrementTurn.one();
            return;
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
        // logging('privateFunc.getBgColor', isAlly);
        if (isAlly == undefined) return _.isAllyTurn ? '#446' : '#644';
        // logging('privateFunc.getBgColor', 'judged undefined');
        return isAlly ? '#446' : '#644';
    }

    privateFunc.switchLogBgColor = function(isAllyTurn) {
        _.isAllyTurn = isAllyTurn;
    }

    privateFunc.append = function(content) {
        $('#i_simulateLog').append(content);
    }

    this.appendTurnPartition = function(turnNum) {
        privateFunc.append('<div>' + turnNum + 'ターン目</div>');
    }

    this.appendBattlePartition = function() {
        privateFunc.append('<div>' + parseInt(battleResult.count_win + battleResult.count_lose + 1) + '戦目</div>');
    }

    this.switchActionSide = function(isAllyTurn) {
        privateFunc.switchLogBgColor(isAllyTurn);
    }

    privateFunc.appendLifeGageLog = function(turnNum, lifeGageInfoArray) {
        // loggingObj('privateFunc.appendLifeGageLog', lifeGageInfoArray)
        privateFunc.append('<span class="c_simulateLog_details">');
        for (var lifeGageInfo of lifeGageInfoArray) {
            $('#i_simulateLog').append('<span style="background-color:' + privateFunc.getBgColor(lifeGageInfo.isAlly) + '">' + lifeGageInfo.name + ' <meter id="i_enemyHpMeterLog" max="' + lifeGageInfo.max_hp + '" value="' + lifeGageInfo.cur_hp + '"></meter></span>');
        }
        privateFunc.append('</span></span><br/>');
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

function Member() {
    // TODO: 共通fieldをここに宣言したい
}

Member.prototype = {
    /**
     * 生きているかを返す
     */
    isAlive: function() {
        if (this.cur_hp <= 0) {
            return false;
        }
        return true;
    },

    /**
     * 行動可否を返す
     */
    isActionable: function() {
        // TODO : implements other factor
        return this.isAlive();
    },
}

var AllyMember = function(allyMem) {
    this.name = allyMem.name;
    this.max_hp = allyMem.max_hp;
    this.cur_hp = allyMem.cur_hp;
    this.max_mp = allyMem.max_mp;
    this.cur_mp = allyMem.cur_mp;
    this.resistance = allyMem.resistance;
    this.skills = allyMem.skills;
    this.isAlly = true;
    // skillsの各要素にインデックスのフィールドを設定
    (function() {
        allyMem.skills.forEach(function(skill, index) {
            skill.index = index;
        });
    })();

    var privateFunc = {};

    /**
     * 行動する
     */
    this.action = function(skill_index) {
        smltrEvnt.appendTurnPressLog(true);
        // logging('AllyMember.action', 'start');
        var _effect = this.skills[skill_index].effect;
        if (!_effect.costMp) {
            // costMpが未定義、もしくは0の場合は何もしない
        }
        // costMpが足りている場合はMPを減算したうえでアクションを実行する
        else if (privateFunc.isEnoughMp(_effect.costMp, this)) {
            this.cur_mp = this.cur_mp - _effect.costMp;
            replace('#ally_mp', this.cur_mp + ' / ' + this.max_mp);
        }
        // MPが足りていない場合はシミュレートログに出力して何もしない
        else {
            smltrLggr.appendSimulateLog(_effect.type + ' ' + this.name + 'は' + _effect.name + 'をしようとしたがMPが足りない！');
            // allyMemberでMP足りない場合は何もしないで良い
            //// trnPrssMngr.decrementTurn.one();
            return;
        }
        // スキル使用制限回数を減算する
        privateFunc.decrementRemainingTimes(this.skills[skill_index]);

        switch (_effect.type) {
            case ALLY_SKILL_TYPE.ATTACK:
                var doneDamage = smltrEvnt.attack(this, enemyParty[0], skill_index);
                break;

            case ALLY_SKILL_TYPE.HEAL:
                smltrEvnt.heal(this, allyParty[0], skill_index);
                break;

            default:
                debugAlert('actionAlly' + 'Error. _effect.type is not found.');
                break;
        }
    }

    /**
     * 行動回数に制限がある場合は行動回数をデクリメントする
     * ※"-"は無制限という意なので何もしない
     */
    privateFunc.decrementRemainingTimes = function(skill) {
        loggingObj('decrementRemainingTimes', skill);
        if (skill.remainingTimes == "無限") {
            logging('skill.remainingTimes', 'judged 無限');
            // 無制限の場合は何もしない
            return;
        }
        logging('skill.remainingTimes', 'before : ' + skill.remainingTimes);
        skill.remainingTimes--;
        logging('skill.remainingTimes', 'after : ' + skill.remainingTimes);
        replace('#ally_skill-limitedTimes-' + skill.index, skill.remainingTimes);
    }

    /**
     * MPが足りているか
     * ※足りている場合は減算する
     */
    privateFunc.isEnoughMp = function(costMp, mem) {
        // logging('isEnoughMp', 'costMp : ' + costMp + 'cur_mp : ' + mem.cur_mp);
        // costMpが未定義の場合は何もせずtrueを返す
        // logging('isEnoughMp : judge', costMp < mem.cur_mp);
        return costMp < mem.cur_mp;
    }

}
AllyMember.prototype = new Member();

function EnemyMember(enemyMem) {
    // this.prototype = new Member(enemyMem);
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
     * 行動する
     */
    this.action = function() {
        smltrEvnt.appendTurnPressLog(false);
        // logging('EnemyMember.action', 'start');
        if (trnPrssMngr.isTurnEnd()) return;
        var skill_index = privateFunc.decideEnemyAction(this.skills);
        logging('action', 'skill_index : ' + skill_index);
        var _effect = this.skills[skill_index].effect;

        if (!_effect.costMp) {
            // costMpが未定義、もしくは0の場合は何もしない
        }
        // costMpが足りている場合はMPを減算したうえでアクションを実行する
        else if (privateFunc.isEnoughMp(_effect.costMp, this)) {
            this.cur_mp = this.cur_mp - _effect.costMp;
            replace('#enemy_mp', this.cur_mp + ' / ' + this.max_mp);
        }
        // MPが足りていない場合はシミュレートログに出力して何もしない
        else {
            smltrLggr.appendSimulateLog(_effect.type + ' ' + this.name + 'は' + _effect.name + 'をしようとしたがMPが足りない！');
            trnPrssMngr.decrementTurn.one();
            return;
        }

        switch (_effect.type) {
            case ENEMY_SKILL_TYPE.ATTACK:
                var doneDamage = smltrEvnt.attack(this, allyParty[0], skill_index);
                break;

            case ENEMY_SKILL_TYPE.HEAL:
                smltrEvnt.heal(this, enemyParty[0], skill_index);
                break;
            default:
                debugAlert('actionEnemy', 'Error. _effect.type is not found.');
                break;
        }
    }

    /**
     * MPが足りているか
     * ※足りている場合は減算する
     */
    privateFunc.isEnoughMp = function(costMp, mem) {
        logging('isEnoughMp', costMp);
        // costMpが未定義の場合は何もせずtrueを返す
        if (!costMp) return true;
        return costMp < mem.cur_mp;
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
        debugAlert('Error decideEnemyAction', 'totalProbability is less than 100 [rndmNum] : ' + rndmNum + ',[totalProbability] : ' + totalProbability);
    }
}
EnemyMember.prototype = new Member();

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
                // 戦闘設定の初期化を実施する
                battleReset();
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
    tg_ele.addClass("animate-glow").one('animationend', function() {
        $(eleId).removeClass("animate-glow");
    });
    tg_ele.text(text);
    // loggingObj('replaceAfter : ' + eleId, tg_ele);
};

function removeAll_AnimateGlow() {
    // logging('removeAll_AnimateGlow', 'start');
    $('.animate-glow').each(function(index, element) {
        // loggingObj('removeAll_AnimateGlow : before', $(element));
        // $(element).removeClass('animate-glow');
        // loggingObj('removeAll_AnimateGlow : after', $(element));
    });
}

function replaceAttr(eleId, attrName, value) {
    // loggingObj('replaceAttrBefore : ' + eleId, 'attrName : ' + attrName + ', value : ' + value);
    $(eleId).attr(attrName, value);
    // loggingObj('replaceAttrAfter : ' + eleId, 'replaced value : ' + $(eleId).attr(attrName));
};

function battleReset() {
    logging('battleReset @ battleSimulator.js', 'start');
    turnNum = 1;

    removeAll_AnimateGlow();
    smltrLggr.appendBattlePartition();
    smltrLggr.appendTurnPartition(turnNum);
    smltrLggr.switchActionSide(true);
    initMemsStatus();
    memberHtmlBuilder.buildAllyParty(allyParty);
    memberHtmlBuilder.buildEnemyParty(enemyParty);
    loggingObj('battleReset : enemyParty', enemyParty);
    loggingObj('battleReset : allyParty', allyParty);

    replace('#battleResult_count_win', battleResult.count_win);
    replace('#battleResult_count_lose', battleResult.count_lose);

    for (var memIndex in enemyParty) {
        replace('#enemy_' + memIndex + '_name', enemyParty[memIndex].name);
        replace('#enemy_' + memIndex + '_hp', enemyParty[memIndex].cur_hp + ' / ' + enemyParty[memIndex].max_hp);
        replace('#enemy_' + memIndex + '_mp', enemyParty[memIndex].cur_mp + ' / ' + enemyParty[memIndex].max_mp);
        replaceAttr('#i_enemy_' + memIndex + '_hp_meter', 'max', enemyParty[memIndex].max_hp);
        replaceAttr('#i_enemy_' + memIndex + '_hp_meter', 'value', enemyParty[memIndex].cur_hp);
        replaceAttr('#i_enemy_' + memIndex + '_mp_meter', 'max', enemyParty[memIndex].max_mp);
        replaceAttr('#i_enem_' + memIndex + '_mp_meter', 'value', enemyParty[memIndex].cur_mp);

        for (var skillIndex in enemyParty[memIndex].skills) {
            replace('#enemy_skill-' + skillIndex, enemyParty[memIndex].skills[skillIndex].effect.name);
            replace('#enemy_skill-select-probability-' + skillIndex, enemyParty[memIndex].skills[skillIndex].probability);
        }
    }

    for (var memIndex in allyParty) {
        replace('#ally_' + memIndex + '_name', allyParty[memIndex].name);
        replace('#ally_' + memIndex + '_hp', allyParty[memIndex].cur_hp + ' / ' + allyParty[memIndex].max_hp);
        replace('#ally_' + memIndex + '_mp', allyParty[memIndex].cur_mp + ' / ' + allyParty[memIndex].max_mp);
        replaceAttr('#i_ally_' + memIndex + '_hp_meter', 'max', allyParty[memIndex].max_hp);
        replaceAttr('#i_ally_' + memIndex + '_hp_meter', 'value', allyParty[memIndex].cur_hp);
        replaceAttr('#i_ally_' + memIndex + '_mp_meter', 'max', allyParty[memIndex].max_mp);
        replaceAttr('#i_ally_' + memIndex + '_mp_meter', 'value', allyParty[memIndex].cur_mp);

        for (var skillIndex in allyParty[memIndex].skills) {
            replace('#ally_skill-' + skillIndex, allyParty[memIndex].skills[skillIndex].effect.name);
            replace('#ally_skill-limitedTimes-' + skillIndex, allyParty[memIndex].skills[skillIndex].limitTimes);
        }
    }
    // ターンプレスの初期化を行う（味方が先制であること前提でallyPartyからターンを生成する）
    trnPrssMngr.initTurn(allyParty);
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
        // スキルの使用制限回数をリセット
        for (var skill of allyMem.skills) {
            skill.remainingTimes = skill.limitTimes;
        }
    });
}

var allyActionButtonMdown_runningFlg = false;

/**
 * allyアクションボタン押下時の処理を実装する
 */
function allyActionButtonMdown(event) {
    try {
        if (allyActionButtonMdown_runningFlg) {
            logging("Error", "doublicate pushed button");
            return;
        }
        // 二度押し防止用フラグ：立てる
        allyActionButtonMdown_runningFlg = true;
        removeAll_AnimateGlow();
        // 使用回数をデクリメントする
        var dcrmntNum = parseInt(this.textContent, 10) - 1;
        replace('#' + this.id, dcrmntNum);


        // 効果の反映を行う
        // id値の末尾番号から
        var skill_index = parseInt(this.attributes.skill_index.value, 10);

        let allyMem = new AllyMember(allyParty[0]);
        allyMem.action(skill_index);
        smltrLggr.appendAllMemLifeGageLog(turnNum);

        if (trnPrssMngr.isTurnEnd()) {
            smltrLggr.switchActionSide(false);
            logging('trnPrssMngr', 'Turn End');
            smltrEvnt.actEnemyTurn();
            if (smltrEvnt.isWin()) {
                battleResult.count_win = ++battleResult.count_win;
                battleReset();
                return;
            } else if (smltrEvnt.isLose()) {
                battleResult.count_lose = ++battleResult.count_lose;
                battleReset();
                return;
            }
            // プレスターン状態を初期化（味方側）
            trnPrssMngr.initTurn(allyParty);
            smltrLggr.appendTurnPartition(turnNum);
            smltrLggr.switchActionSide(true);
            turnNum++;
        }

        replaceAttr('#i_enemy_hp_meter', 'value', enemyParty[0].cur_hp);
        replaceAttr('#i_enemy_mp_meter', 'value', enemyParty[0].cur_mp);
        replaceAttr('#i_ally_hp_meter', 'value', allyParty[0].cur_hp);
        replaceAttr('#i_ally_mp_meter', 'value', allyParty[0].cur_mp);

    } finally {
        // 二度押し防止用フラグ：落とす
        allyActionButtonMdown_runningFlg = false;
    }
};

function AutoBattle() {
    var privateFunc = {};
    var intervalId = null;

    privateFunc.actOneAlly = function() {
        logging('actOneAlly', 'start');
        if (allyParty[0].cur_hp < 13) {
            $('#ally_skill-limitedTimes-1').click();
        } else {
            $('#ally_skill-limitedTimes-0').click();
        }
    }

    /**
     * allyアクションボタン押下時の処理を実装する
     */
    this.switchMode = function(event) {
        if (this.textContent == 'start') {
            logging('switchMode', 'start');
            replace('#i_auto-battle-btn', 'end');
            intervalId = setInterval(privateFunc.actOneAlly, 500);
        } else {
            logging('switchMode', 'end');
            clearInterval(intervalId);
            replace('#i_auto-battle-btn', 'start');
        }
    }
}
const autoBattle = new AutoBattle();