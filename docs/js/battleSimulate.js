loadScript('/mgtn3simulator/js/enemyPartySetiting.js', function() {
    loadScript('/mgtn3simulator/js/allyPartySetiting.js', function() {
        loggingObj('enemyParty', enemyParty);
        loggingObj('allyParty', allyParty);

        var battleResult = {
            "count_win": 0,
            "count_lose": 0
        };

        logging('', $('#enemy_hp').text());
        $('#enemy_hp').text('aaaa');
        logging('', $('#enemy_hp').text());

        (function initialize() {
            logging('initialize @ battleSimulator.js', 'start');

            replace('battleResult_count_win', battleResult.count_win);
            replace('battleResult_count_lose', battleResult.count_lose);


            replace('enemy_name', enemyParty[0].name);
            replace('enemy_hp', enemyParty[0].cur_hp + ' / ' + enemyParty[0].max_hp);
            replace('enemy_mp', enemyParty[0].cur_mp + ' / ' + enemyParty[0].max_mp);

            for (var i = 0; i < enemyParty[0].skills.length; i++) {
                replace('enemy_skill-' + i, enemyParty[0].skills[i].name);
                replace('enemy_skill-select-probability-' + i, enemyParty[0].skills[i].probability);
            }

            replace('ally_name', allyParty[0].name);
            replace('ally_hp', allyParty[0].cur_hp + ' / ' + allyParty[0].max_hp);
            replace('ally_mp', allyParty[0].cur_mp + ' / ' + allyParty[0].max_mp);

            for (var i = 0; i < allyParty[0].skills.length; i++) {
                replace('ally_skill-' + i, allyParty[0].skills[i].name);
                replace('ally_skill-limitedTimes-' + i, allyParty[0].skills[i].limitedTimes);
            }
        })();


        // allyのアクションボタンにイベントリスナー付与
        $('.ally-action-button').on('click', allyActionButtonMdown);

    });
});

function replace(eleId, text) {
    tg_ele = $('#' + eleId);
    loggingObj('replace : ' + eleId, tg_ele);
    loggingObj('replace : ' + eleId, tg_ele.text());
    if (!tg_ele) logging('replace @ battleSimulator.js' + document.currentScript, 'not found by id : ' + eleId);
    tg_ele.text(text);
};

/**
 * allyアクションボタン押下時の処理を実装する
 */
function allyActionButtonMdown(event) {
	loggingObj('allyActionButtonMdown', this);
};
