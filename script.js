// =========================
// AUCTION DEBATE
// MAIN CONTROLLER
// VERSION 0.4
// =========================


import {
    game,
    resetGame
} from "./js/gameState.js";


import {
    initializeSettings
} from "./js/settings.js";


import {
    startAuction
} from "./js/auctionEngine.js";


import {
    updateMoney,
    createRosterSlots,
    showGameScreen
} from "./js/ui.js";





// =========================
// START BUTTON
// =========================


document
.getElementById("startGameBtn")
.addEventListener(
"click",
beginGame
);





function beginGame(){


let budget =
Number(
document.getElementById("customBudget").value ||
document.getElementById("budgetSlider").value
);



let roster =
Number(
document.getElementById("customRoster").value ||
document.getElementById("rosterSlider").value
);



let category =
document.getElementById(
"categorySelect"
).value;




let sportsMode =
document.getElementById(
"sportsMode"
).value;






resetGame();



game.budget =
budget;


game.rosterSize =
roster;


game.category =
category;


game.sportsMode =
sportsMode;




game.player1.money =
budget;


game.player2.money =
budget;




createRosterSlots(
"p1Roster",
roster
);


createRosterSlots(
"p2Roster",
roster
);




updateMoney();




showGameScreen();




startAuction();



}







// =========================
// INITIAL SETTINGS LOAD
// =========================


initializeSettings();