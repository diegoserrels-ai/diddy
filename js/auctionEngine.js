// =========================
// AUCTION DEBATE GAME
// AUCTION ENGINE
// VERSION 2.0
// PART 1 OF 3
// =========================

import {
    game,
    resetGame,
    getPlayer,
    spendMoney,
    addRosterItem,
    rosterFull,
    draftComplete
} from "./gameState.js";

import {
    loadAuctionDeck,
    drawNextItem
} from "./dataLoader.js";

import {
    refreshUI,
    updateCurrentItem,
    updateBid,
    updateLeader,
    updateTurn,
    updateMoney,
    updateRosters,
    updateMessage
} from "./ui.js";



// =========================
// INITIALIZE GAME
// =========================

window.addEventListener("DOMContentLoaded", initializeGame);

async function initializeGame() {

    console.log("1 - initializeGame started");

    const settings = JSON.parse(localStorage.getItem("auctionSettings"));
    console.log("2 - Settings:", settings);

    if (!settings) {
        updateMessage("No game settings found.");
        return;
    }

    game.settings = { ...settings };
    console.log("3 - Game settings assigned");

    resetGame();
    console.log("4 - Game reset");

    await loadAuctionDeck();
    console.log("5 - Deck loaded:", game.auction.deck.length);

    game.status.started = true;
    console.log("6 - Status updated");

    refreshUI();
    console.log("7 - UI refreshed");

    startRound();
    console.log("8 - Round started");

    const bidInput = document.getElementById("bidAmount");

    bidInput.addEventListener("keydown", function (event) {

        if (game.status.gameOver) return;

        if (event.key === "Enter") {

            event.preventDefault();

            if (!document.getElementById("bidButton").disabled) {
                placeBid();
            }

        }

    });

}



// =========================
// START ROUND
// =========================

function startRound() {

    if (draftComplete()) {

        finishDraft();

        return;

    }

    const nextItem =
        drawNextItem();

    if (!nextItem) {

        finishDraft();

        return;

    }

    game.auction.currentItem =
        nextItem;

    game.auction.currentBid = 0;

    game.auction.highestBidder = null;

    game.auction.currentTurn =
        game.auction.openingPlayer;

    updateCurrentItem();

    updateBid();

    updateLeader();

    updateTurn();

    updateMessage(
        `${getPlayer(
            game.auction.currentTurn
        ).name} must open bidding.`
    );

    document.getElementById("bidAmount").value = "";
const bidBox =
    document.getElementById("bidAmount");

bidBox.focus();
bidBox.select();

    checkZeroDollarOpening();

    updateActionButtons();
}



// =========================
// ZERO-DOLLAR OPENING RULE
// =========================

function checkZeroDollarOpening() {

    const openingPlayer =
        getPlayer(game.auction.currentTurn);

    const otherPlayer =
        getPlayer(
            game.auction.currentTurn === 1 ? 2 : 1
        );

    // Normal auction if both players have money.
    if (
        openingPlayer.money > 0 &&
        otherPlayer.money > 0
    ) {
        return;
    }

    // If BOTH players are broke, the automatic
    // zero-dollar draft will handle everything.
    if (
        openingPlayer.money === 0 &&
        otherPlayer.money === 0
    ) {
        return;
    }

    // If the opening player is broke,
    // switch to the player with money.
    if (openingPlayer.money === 0) {

        game.auction.currentTurn =
            game.auction.currentTurn === 1 ? 2 : 1;

        updateTurn();

    }

    updateMessage(
        `${getPlayer(game.auction.currentTurn).name} may bid $1 or pass.`
    );

    document.getElementById("passButton").disabled = false;

}



// =========================
// BID BUTTON
// =========================

window.placeBid = function () {

    const amount =
        Number(
            document.getElementById("bidAmount").value
        );

    const bidder =
        getPlayer(
            game.auction.currentTurn
        );

     if (!canPlayerRaise(game.auction.currentTurn)) {

    return;

}

    if (!Number.isInteger(amount)) {

        alert("Whole dollar bids only.");

        return;

    }

    if (
        game.auction.currentBid === 0 &&
        amount < 1
    ) {

        alert(
            "Opening bid must be at least $1."
        );

        return;

    }

    if (
        amount <=
        game.auction.currentBid
    ) {

        alert(
            "Bid must be higher than the current bid."
        );

        return;

    }

    if (
        amount >
        bidder.money
    ) {

        alert(
            "You don't have enough money."
        );

        return;

    }

    game.auction.currentBid =
        amount;

    game.auction.highestBidder =
        game.auction.currentTurn;

    updateBid();

    updateLeader();

    switchTurn();

    updateActionButtons();

};



// =========================
// SWITCH TURN
// =========================

function canPlayerRaise(playerNumber) {

    const player =
        getPlayer(playerNumber);

    // Nobody has bid yet.
    // Any player with at least $1 can open.

    if (game.auction.currentBid === 0) {
        return player.money >= 1;
    }

    // To raise, the player must be able to bid
    // at least $1 more than the current bid.

    return player.money >
        game.auction.currentBid;

}

function updateActionButtons() {

    const bidButton =
        document.getElementById("bidButton");

    const passButton =
        document.getElementById("passButton");

    const bidInput =
        document.getElementById("bidAmount");

    if (game.status.gameOver) {

        bidButton.disabled = true;
        passButton.disabled = true;
        bidInput.disabled = true;

        return;

    }

bidButton.disabled =
    !canPlayerRaise(
        game.auction.currentTurn
    );

bidInput.disabled =
    bidButton.disabled;

    // Pass is only legal after a bid has been
    // placed OR during the special "$0 opponent"
    // opening rule.

    const currentPlayer =
        getPlayer(game.auction.currentTurn);

    const otherPlayer =
        getPlayer(
            game.auction.currentTurn === 1 ? 2 : 1
        );

    passButton.disabled = !(
        game.auction.currentBid > 0 ||
        (
            game.auction.currentBid === 0 &&
            currentPlayer.money > 0 &&
            otherPlayer.money === 0
        )
    );

}
function switchTurn() {

    game.auction.currentTurn =
        game.auction.currentTurn === 1
            ? 2
            : 1;

    updateTurn();

    updateActionButtons();

    updateMessage(

        `${getPlayer(
            game.auction.currentTurn
        ).name}'s turn.`

    );

    autoWinIfOpponentBroke();

}



// =========================
// AUTO WIN
// =========================

function autoWinIfOpponentBroke() {

    const currentPlayer =
        getPlayer(game.auction.currentTurn);

    // If nobody has bid yet,
    // don't auto-award anything.
    if (game.auction.currentBid === 0) {
        return;
    }

    // If the current player cannot legally
    // make another bid, the auction is over.

    if (!canPlayerRaise(game.auction.currentTurn)) {

    awardItem(
        game.auction.highestBidder,
        game.auction.currentBid
    );

}

}
// =========================
// PASS BUTTON
// =========================

window.passBid = function () {

    if (game.status.gameOver) {
        return;
    }

    // No bids have been placed yet.
    // This only occurs when one player has $0
    // and the player with money chooses to pass.

    if (game.auction.currentBid === 0) {

        const currentPlayer =
            game.auction.currentTurn;

        const otherPlayer =
            currentPlayer === 1 ? 2 : 1;

        awardItem(otherPlayer, 0);

        return;

    }

    // Normal auction:
    // Highest bidder wins.

    awardItem(
        game.auction.highestBidder,
        game.auction.currentBid
    );

};



// =========================
// AWARD ITEM
// =========================

function awardItem(playerNumber, price) {

    const player =
        getPlayer(playerNumber);

    spendMoney(
        playerNumber,
        price
    );

    addRosterItem(
        playerNumber,
        {
            id: game.auction.currentItem.id,
            name: game.auction.currentItem.name,
            price: price
        }
    );

    game.auction.history.push({

        round:
            game.auction.round,

        item:
            game.auction.currentItem.name,

        winner:
            player.name,

        price:
            price

    });

    game.auction.round++;

    updateMoney();

    updateRosters();

    game.auction.openingPlayer =
        game.auction.openingPlayer === 1
            ? 2
            : 1;

    continueDraft();

}



// =========================
// CONTINUE DRAFT
// =========================

function continueDraft() {

    if (draftComplete()) {

        finishDraft();

        return;

    }

    autoFillRoster();

    if (draftComplete()) {

        finishDraft();

        return;

    }

    if (
        game.player1.money === 0 &&
        game.player2.money === 0
    ) {

        finishZeroDollarDraft();

        finishDraft();

        return;

    }

    setTimeout(
        startRound,
        500
    );

}



// =========================
// AUTO FILL
// If one roster fills first,
// remaining player gets random items.
// =========================

function autoFillRoster() {

    if (
        rosterFull(1) &&
        rosterFull(2)
    ) {

        return;

    }

    if (
        rosterFull(1)
    ) {

        while (
            !rosterFull(2)
        ) {

            const item =
                drawNextItem();

            if (!item) {

                break;

            }

            addRosterItem(
                2,
                {
                    id: item.id,
                    name: item.name,
                    price: 0
                }
            );

        }

        updateRosters();

        return;

    }

    if (
        rosterFull(2)
    ) {

        while (
            !rosterFull(1)
        ) {

            const item =
                drawNextItem();

            if (!item) {

                break;

            }

            addRosterItem(
                1,
                {
                    id: item.id,
                    name: item.name,
                    price: 0
                }
            );

        }

        updateRosters();

    }

}



// =========================
// BOTH PLAYERS OUT OF MONEY
// Alternate random picks.
// =========================

function finishZeroDollarDraft() {

    let turn =
        game.auction.openingPlayer;

    while (!draftComplete()) {

        if (
            !rosterFull(turn)
        ) {

            const item =
                drawNextItem();

            if (!item) {

                break;

            }

            addRosterItem(
                turn,
                {
                    id: item.id,
                    name: item.name,
                    price: 0
                }
            );

        }

        turn =
            turn === 1
                ? 2
                : 1;

    }

    updateRosters();

}// =========================
// FINISH DRAFT
// =========================

function finishDraft() {

    game.status.gameOver = true;

    updateActionButtons();

    refreshUI();

    updateMessage(
        "Draft complete! Compare your rosters and debate the winner."
    );

    document.getElementById("passButton").disabled = true;

    const bidBox =
        document.getElementById("bidAmount");

    if (bidBox) {

        bidBox.disabled = true;

    }

}



// =========================
// OPTIONAL HISTORY HELPERS
// =========================



// =========================
// DEBUG HELPERS
// =========================

window.game = game;

window.nextRound = startRound;

window.refreshUI = refreshUI;



// =========================
// END OF FILE
// =========================