var ALLY_SKILL_TYPE = {
    ATTACK: "[ATTACK]",
    HEAL: "[HEAL]",
}

var ENEMY_SKILL_TYPE = {
    ATTACK: "[ATTACK]",
    HEAL: "[HEAL]",
}

var battleResult = {
    "count_win": 0,
    "count_lose": 0
};

var enemy;
var ally;

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
                console.log("ajaxエラー", "allySetting.json：");
            }
        );
    },
    // 通信失敗時の処理
    function() {
        console.log("ajaxエラー", "enemySetting.json：");
    }
);

function replace(eleId, text) {
    tg_ele = $(eleId);
    // loggingObj('replaceBefore : ' + eleId, text);
    if (!tg_ele) logging('Error @ replace' + document.currentScript, 'not found by id : ' + eleId);
    tg_ele.text(text);
    // loggingObj('replaceAfter : ' + eleId, tg_ele);
};

function initialize() {
    logging('initialize @ battleSimulator.js', 'start');

    initMemsStatus();
    loggingObj('initialized : enemy', enemy);
    loggingObj('initialized : ally', ally);

    replace('#battleResult_count_win', battleResult.count_win);
    replace('#battleResult_count_lose', battleResult.count_lose);

    replace('#enemy_name', enemy.party[0].name);
    replace('#enemy_hp', enemy.party[0].cur_hp + ' / ' + enemy.party[0].max_hp);
    replace('#enemy_mp', enemy.party[0].cur_mp + ' / ' + enemy.party[0].max_mp);

    for (var i = 0; i < enemy.party[0].skills.length; i++) {
        replace('#enemy_skill-' + i, enemy.party[0].skills[i].name);
        replace('#enemy_skill-select-probability-' + i, enemy.party[0].skills[i].probability);
    }

    replace('#ally_name', ally.party[0].name);
    replace('#ally_hp', ally.party[0].cur_hp + ' / ' + ally.party[0].max_hp);
    replace('#ally_mp', ally.party[0].cur_mp + ' / ' + ally.party[0].max_mp);

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

/**
 * allyアクションボタン押下時の処理を実装する
 */
function allyActionButtonMdown(event) {
    // 使用回数をデクリメントする
    var dcrmntNum = parseInt(this.textContent, 10) - 1;
    replace('#' + this.id, dcrmntNum);

    // 効果の反映を行う
    // id値の末尾番号から
    var skill_index = parseInt(this.attributes.skill_index.value, 10);

    actionAlly(ally.party[0], skill_index);
    actionEnemy();
    judgeFightOut();
};

function actionAlly(allyMem, skill_index) {
    var _effect = allyMem.skills[skill_index].effect;

    switch (_effect.type) {
        case ALLY_SKILL_TYPE.ATTACK:
            if (0 < enemy.party[0].cur_hp - _effect.damage) {
                // 減算した結果が0より大きい場合は減算した結果を現在HPに設定する
                enemy.party[0].cur_hp = enemy.party[0].cur_hp - _effect.damage;
            } else {
                // 減算した結果が0以下の場合は0を現在HPに設定する
                enemy.party[0].cur_hp = 0;
                beDead(enemy.party[0], '#ff9');
            }
            // HTML上に反映する
            replace('#enemy_hp', enemy.party[0].cur_hp + ' / ' + enemy.party[0].max_hp);
            appendSimulateLog(ALLY_SKILL_TYPE.ATTACK + ' ' + allyMem.name + 'は' + enemy.party[0].name + 'に' + allyMem.skills[skill_index].name + '。' + _effect.damage + 'のダメージを与えた。');
            break;
        case ALLY_SKILL_TYPE.HEAL:
            if (allyMem.max_hp < allyMem.cur_hp + _effect.amount) {
                // 加算した結果が最大HPより大きい場合は最大HPを現在HPに設定する
                allyMem.cur_hp = allyMem.max_hp;
            } else {
                // 加算した結果が最大HP以下の場合は加算した結果を現在HPに設定する
                allyMem.cur_hp = allyMem.cur_hp + _effect.amount;
            }
            // HTML上に反映する
            replace('#ally_hp', allyMem.cur_hp + ' / ' + allyMem.max_hp);
            break;
    }
}

function actionEnemy() {
    for (var enemyMem of enemy.party) {
        // 生きている場合のみ行動する
        if (enemyMem.isAlive) {
            actionEnemyMem(enemyMem, decideEnemyAction(enemyMem));
        }
    }
}

function actionEnemyMem(enemyMem, skill_index) {
	logging('actionEnemyMem', 'start. skill_index = ' + skill_index);
	var _effect = enemyMem.skills[skill_index].effect;

	switch(_effect.type) {
        case ENEMY_SKILL_TYPE.ATTACK:
            if (0 < ally.party[0].cur_hp - _effect.damage) {
                // 減算した結果が0より大きい場合は減算した結果を現在HPに設定する
                ally.party[0].cur_hp = ally.party[0].cur_hp - _effect.damage;
            } else {
                // 減算した結果が0以下の場合は0を現在HPに設定する
                ally.party[0].cur_hp = 0;
                beDead(ally.party[0], '#f36');
            }
            // HTML上に反映する
            replace('#ally_hp', ally.party[0].cur_hp + ' / ' + ally.party[0].max_hp);
            appendSimulateLog(ENEMY_SKILL_TYPE.ATTACK + ' ' + enemyMem.name + 'は' + ally.party[0].name + 'に' + enemyMem.skills[skill_index].name + '。' + _effect.damage + 'のダメージを与えた。');
            break;
        case ENEMY_SKILL_TYPE.HEAL:
            if (enemyMem.max_hp < enemyMem.cur_hp + _effect.amount) {
                // 加算した結果が最大HPより大きい場合は最大HPを現在HPに設定する
                enemyMem.cur_hp = enemyMem.max_hp;
            } else {
                // 加算した結果が最大HP以下の場合は加算した結果を現在HPに設定する
                enemyMem.cur_hp = enemyMem.cur_hp + _effect.amount;
            }
            // HTML上に反映する
            replace('#enemy_hp', enemyMem.cur_hp + ' / ' + enemyMem.max_hp);
            appendSimulateLog(ENEMY_SKILL_TYPE.HEAL + ' ' + enemyMem.name + 'は' + enemyMem.skills[skill_index].name + 'を' + enemyMem.name + 'に唱えた。' + _effect.amount + '回復した。');
            break;
    }
}

function decideEnemyAction(enemyMem) {
	var totalProbability = 0;
    var rndmNum = Math.floor(Math.random() * 101);
    for (var skill_index in enemyMem.skills) {
    	totalProbability = totalProbability + enemyMem.skills[skill_index].probability;
    	if (rndmNum < totalProbability) return skill_index;
    }
    alert('Error @ battolesSimulate.js decideEnemyAction()');
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

function beDead(member, color) {
    member.isAlive = false;
    appendSimulateLog('[DEAD]   ' + member.name + 'は力尽きた。', color);
};