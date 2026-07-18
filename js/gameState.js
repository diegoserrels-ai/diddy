// =========================
// AUCTION DEBATE GAME
// GAME STATE
// VERSION 1.0
// =========================

export const game = {

    // -------------------------
    // GAME SETTINGS
    // -------------------------

    settings: {

        player1: "",
        player2: "",

        category: "",
        sportsMode: null,

        budget: 100,
        rosterSize: 7

    },



    // -------------------------
    // PLAYERS
    // -------------------------

    player1: {

        name: "",
        money: 0,
        roster: []

    },



    player2: {

        name: "",
        money: 0,
        roster: []

    },



    // -------------------------
    // AUCTION
    // -------------------------

    auction: {

        deck: [],

        currentItem: null,

        currentBid: 0,

        highestBidder: null,

        currentTurn: 1,

        openingPlayer: 1,

        round: 1,

        history: []

    },



    // -------------------------
    // GAME STATUS
    // -------------------------

    status: {

        started: false,

        gameOver: false

    }

};



// =========================
// RESET GAME
// =========================

export function resetGame() {

    game.player1.name = game.settings.player1;
    game.player2.name = game.settings.player2;

    game.player1.money = game.settings.budget;
    game.player2.money = game.settings.budget;

    game.player1.roster = [];
    game.player2.roster = [];

    game.auction.deck = [];

    game.auction.currentItem = null;

    game.auction.currentBid = 0;

    game.auction.highestBidder = null;

    game.auction.currentTurn = 1;

    game.auction.openingPlayer = 1;

    game.auction.round = 1;

    game.auction.history = [];

    game.status.started = false;

    game.status.gameOver = false;

}



// =========================
// PLAYER HELPERS
// =========================

export function getPlayer(number) {

    return number === 1
        ? game.player1
        : game.player2;

}



export function getOpponent(number) {

    return number === 1
        ? game.player2
        : game.player1;

}



// =========================
// MONEY HELPERS
// =========================

export function spendMoney(playerNumber, amount) {

    getPlayer(playerNumber).money -= amount;

}



export function addRosterItem(playerNumber, item) {

    getPlayer(playerNumber).roster.push(item);

}



// =========================
// ROSTER HELPERS
// =========================

export function rosterFull(playerNumber) {

    return getPlayer(playerNumber).roster.length >=
        game.settings.rosterSize;

}



export function totalPicks() {

    return (
        game.player1.roster.length +
        game.player2.roster.length
    );

}



export function draftComplete() {

    return (
        rosterFull(1) &&
        rosterFull(2)
    );

}