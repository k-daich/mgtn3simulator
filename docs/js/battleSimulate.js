var ALLY_SKILL_TYPE = {
	ATTACK : "ATTACK",
	HEAL : "HEAL",
}

var enemy = null;
var ally = null;

// loadScript('/mgtn3simulator/js/enemySetiting.json', function() {
//     loadScript('/mgtn3simulator/js/allySetiting.json', function() {
(function (handleload) {
    var xhr = new XMLHttpRequest;
    xhr.addEventListener('load', handleload, false);
    xhr.open('GET', 'http://localhost:31080/mgtn3simulator/js/enemySetiting.json', true);
    xhr.send(null);
}(function handleLoad(event) {
    var xhr = event.target,
        obj = JSON.parse(xhr.responseText);
    enemy = obj.name;

    logging('xhrResult :  enemy' , enemy);
}));

(function (handleload) {
    var xhr = new XMLHttpRequest;
    xhr.addEventListener('load', handleload, false);
    xhr.open('GET', 'http://localhost:31080/mgtn3simulator/js/allySetiting.json', true);
    xhr.send(null);
}(function handleLoad(event) {
    var xhr = event.target,
        obj = JSON.parse(xhr.responseText);
    ally = obj.name;

    logging('xhrResult :  ally' , ally);
}));

        loggingObj('enemy', enemy);
        loggingObj('ally', ally);

        var battleResult = {
            "count_win": 0,
            "count_lose": 0
        };

        (function initialize() {
            logging('initialize @ battleSimulator.js', 'start');

            replace('battleResult_count_win', battleResult.count_win);
            replace('battleResult_count_lose', battleResult.count_lose);


            replace('enemy_name', enemy[0].name);
            replace('enemy_hp', enemy[0].cur_hp + ' / ' + enemy[0].max_hp);
            replace('enemy_mp', enemy[0].cur_mp + ' / ' + enemy[0].max_mp);

            for (var i = 0; i < enemy[0].skills.length; i++) {
                replace('enemy_skill-' + i, enemy[0].skills[i].name);
                replace('enemy_skill-select-probability-' + i, enemy[0].skills[i].probability);
            }

            replace('ally_name', ally[0].name);
            replace('ally_hp', ally[0].cur_hp + ' / ' + ally[0].max_hp);
            replace('ally_mp', ally[0].cur_mp + ' / ' + ally[0].max_mp);

            for (var i = 0; i < ally[0].skills.length; i++) {
                replace('ally_skill-' + i, ally[0].skills[i].name);
                replace('ally_skill-limitedTimes-' + i, ally[0].skills[i].limitedTimes);
            }
        })();

        // allyのアクションボタンにイベントリスナー付与
        $('.ally-action-button').on('click', allyActionButtonMdown);

//     });
// });

function replace(eleId, text) {
    tg_ele = $('#' + eleId);
    loggingObj('replace : ' + eleId, tg_ele.text());
    if (!tg_ele) logging('Error @ replace' + document.currentScript, 'not found by id : ' + eleId);
    tg_ele.text(text);
};

/**
 * allyアクションボタン押下時の処理を実装する
 */
function allyActionButtonMdown(event) {
    // 使用回数をデクリメントする
    var dcrmntNum = parseInt(this.textContent, 10) - 1;
    replace(this.id, dcrmntNum);

    // 効果の反映を行う
    // id値の末尾番号から
    var skill_index = parseInt(this.skill_index, 10);
    loggingObj('tempDebug', ally[0].skills[skill_index]);
    var _effect = ally[0].skills[skill_index].effect;

    switch (_effect.type) {
        case ALLY_SKILL_TYPE.ATTACK:
            if (0 < enemy[0].cur_hp - _effect.damage) {
                // 減算した結果が0より大きい場合は減算した結果を現在HPに設定する
                enemy[0].cur_hp = enemy[0].cur_hp - _effect.damage;
            } else {
                // 減算した結果が0以下の場合は0を現在HPに設定する
                enemy[0].cur_hp = 0;
            }
            // HTML上に反映する
            replace('enemy_hp', enemy[0].cur_hp + ' / ' + enemy[0].max_hp);
            break;
        case ALLY_SKILL_TYPE.HEAL:
            if (ally[0].max_hp < ally[0].cur_hp + _effect.amount) {
                // 加算した結果が最大HPより大きい場合は最大HPを現在HPに設定する
                ally[0].cur_hp = ally[0].max_hp;
            } else {
                // 加算した結果が最大HP以下の場合は加算した結果を現在HPに設定する
                ally[0].cur_hp = ally[0].cur_hp + _effect.amount;
            }
            // HTML上に反映する
            replace('ally_hp', ally[0].cur_hp + ' / ' + ally[0].max_hp);
            break;
    }
};