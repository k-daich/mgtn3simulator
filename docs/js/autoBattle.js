function AutoBattle() {
    var privateFunc = {};
    var intervalId = null;

    privateFunc.getSkillIndex = function(memIndex, skillName) {
        var _skills = allyParty[memIndex].skills;
        for(var _resultIndex in _skills) {
            if (_skills[_resultIndex].effect.name == skillName) return _resultIndex;
        }
        debugAlert('getSkillIndex', 'Not Found skill name : ' + skillName);
    }

    privateFunc.actOneAlly = function() {
        logging('actOneAlly', 'start');
        var skillIndex = null;
        if (allyParty[0].cur_hp < 13 &&
            allyParty[0].skills[1].remainingTimes != 0) {
            skillIndex = privateFunc.getSkillIndex(0, '回復薬');
        } else {
            skillIndex = privateFunc.getSkillIndex(0, "通常攻撃");
        }
        $('#ally_skill-limitedTimes-' + skillIndex).click();
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