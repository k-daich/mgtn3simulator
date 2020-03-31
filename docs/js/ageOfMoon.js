logging('ageOfMoon.js', 'loaded');

var AGE_OF_MOON = null;

var MoonManager = function() {
    const AGE_OF_MOON_KBN = {
        FULL: 8,
        SEVEN: 7,
        SIX: 6,
        FIVE: 5,
        HALF: 4,
        THREE: 3,
        TWO: 2,
        ONE: 1,
        NONE: 0,
    }

    this.setAgeOfMoon = function(age) {
    	AGE_OF_MOON = age;
    	$('#i_age_of_moon').html("月齢 " + AGE_OF_MOON);
    }
}

const moonManager = new MoonManager();

