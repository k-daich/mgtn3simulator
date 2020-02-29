logging('setToday.js', 'loaded');

/*
 * idがtodayの要素の値を現在情報に設定する
 */
$(function() {
    var today = new Date();
    $("#today").html(today.getFullYear() + "年 " + (today.getMonth() + 1) + "月 " + today.getDate() + "日");
})
