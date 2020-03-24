function AutoBattle() {
    var privateFunc = {};
    var intervalId = null;

    privateFunc.actOneAlly = function() {
    }

    privateFunc.actOneAlly = function() {
        logging('actOneAlly', 'start');
        if (allyParty[0].cur_hp < 13 &&
            allyParty[0].skills[1].remainingTimes != 0) {
            $('.ally-skill[text="回復薬"]').click();
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

// allyのアクションボタンにイベントリスナーを付与
$('#i_auto-battle-btn').on('click', autoBattle.switchMode);
