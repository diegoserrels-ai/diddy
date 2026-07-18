// =========================
// AUCTION DEBATE GAME
// UI MODULE
// VERSION 1.2
// =========================

import { game } from "./gameState.js";



// =========================
// PLAYER NAMES
// =========================

export function updatePlayerNames() {

    document.getElementById("player1Title").textContent =
        game.player1.name;

    document.getElementById("player2Title").textContent =
        game.player2.name;

}



// =========================
// CATEGORY
// =========================

export function updateCategory() {

    document.getElementById("gameCategory").textContent =
        game.settings.category;

}



// =========================
// MONEY
// =========================

export function updateMoney() {

    document.getElementById("player1Money").textContent =
        `$${game.player1.money}`;

    document.getElementById("player2Money").textContent =
        `$${game.player2.money}`;

}



// =========================
// ROSTERS
// =========================

export function updateRosters() {

    drawRoster(
        "player1Roster",
        game.player1.roster
    );

    drawRoster(
        "player2Roster",
        game.player2.roster
    );

}



function drawRoster(id, roster) {

    const list =
        document.getElementById(id);

    list.innerHTML = "";

    roster.forEach(item => {

        const li =
            document.createElement("li");

        li.textContent =
            `${item.name} ($${item.price ?? 0})`;

        list.appendChild(li);

    });

}



// =========================
// CURRENT ITEM
// =========================

export function updateCurrentItem() {

    document.getElementById("currentItem").textContent =

        game.auction.currentItem
            ? game.auction.currentItem.name
            : "Loading...";

}



// =========================
// CURRENT BID
// =========================

export function updateBid() {

    document.getElementById("currentBid").textContent =
        `$${game.auction.currentBid}`;

}



// =========================
// CURRENT BIDDER
// =========================

export function updateLeader() {

    let text = "None";

    if (game.auction.highestBidder === 1) {

        text = game.player1.name;

    }
    else if (game.auction.highestBidder === 2) {

        text = game.player2.name;

    }

    document.getElementById("currentBidder").textContent =
        text;

}



// =========================
// TURN DISPLAY
// =========================

export function updateTurn() {

    const player =

        game.auction.currentTurn === 1
            ? game.player1
            : game.player2;

    document.getElementById("turnDisplay").textContent =
        `${player.name}'s Turn`;

}



// =========================
// GAME MESSAGE
// =========================

export function updateMessage(message = "") {

    document.getElementById("gameMessage").textContent =
        message;

}



// =========================
// FULL REFRESH
// =========================

export function refreshUI() {

    updatePlayerNames();
    updateCategory();
    updateMoney();
    updateRosters();
    updateCurrentItem();
    updateBid();
    updateLeader();
    updateTurn();

    // Highlight active player
    const player1Card = document.getElementById("player1Card");
    const player2Card = document.getElementById("player2Card");

    if (player1Card && player2Card) {

        player1Card.classList.remove("active");
        player2Card.classList.remove("active");

        if (!game.status.gameOver) {

            if (game.auction.currentTurn === 1) {
                player1Card.classList.add("active");
            } else {
                player2Card.classList.add("active");
            }

        }

    }

}