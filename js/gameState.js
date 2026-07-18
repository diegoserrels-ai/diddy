// =========================
// AUCTION DEBATE GAME
// GAME STATE
// VERSION 1.0
// =========================

export const game = {

    settings: {

        player1: "",
        player2: "",

        category: "",
        sportsMode: null,

        budget: 100,
        rosterSize: 7

    },

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
    // NEITHER KNOWS
    // -------------------------

    neitherKnows: {

        votes: 0,

        player1Voted: false,

        player2Voted: false,

        remaining: 0

    },

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

    // -------------------------
    // SET SKIP LIMIT
    // -------------------------

    const size = game.settings.rosterSize;

    if (size <= 3) {

        game.neitherKnows.remaining = 0;

    } else if (size <= 6) {

        game.neitherKnows.remaining = 1;

    } else if (size <= 10) {

        game.neitherKnows.remaining = 2;

    } else if (size <= 15) {

        game.neitherKnows.remaining = 3;

    } else if (size <= 25) {

        game.neitherKnows.remaining = 4;

    } else {

        game.neitherKnows.remaining = 5;

    }

    game.neitherKnows.votes = 0;
    game.neitherKnows.player1Voted = false;
    game.neitherKnows.player2Voted = false;

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