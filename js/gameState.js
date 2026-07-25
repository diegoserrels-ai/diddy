// =========================
// AUCTION DRAFT DEBATE
// GAME STATE
// VERSION 3.0  (2-4 players)
// =========================


export const game = {

    settings: {

        // names is now a list, so 2, 3 or 4 players all work
        names: [],

        category: "",
        sportsMode: null,
        file: "",

        budget: 100,
        rosterSize: 5

    },

    // players[0] is Player 1, players[1] is Player 2, etc.
    players: [],

    auction: {

        deck: [],

        currentItem: null,

        currentBid: 0,

        // index of the player currently leading, or null
        highestBidder: null,

        // index of the player whose turn it is
        currentTurn: 0,

        // index of the player who opens the next item (rotates)
        openingIndex: 0,

        round: 1,

        // out[i] === true means player i is done bidding on THIS item
        out: [],

        history: []

    },

    neitherKnows: {

        remaining: 0,

        // votes[i] === true means player i voted to skip this item
        votes: []

    },

    status: {

        started: false,
        gameOver: false

    }

};



// =========================
// RESET
// =========================

export function resetGame() {

    game.players = game.settings.names.map((name, index) => ({

        index: index,
        name: name,
        money: game.settings.budget,
        roster: []

    }));

    game.auction.deck = [];
    game.auction.currentItem = null;
    game.auction.currentBid = 0;
    game.auction.highestBidder = null;
    game.auction.currentTurn = 0;
    game.auction.openingIndex = 0;
    game.auction.round = 1;
    game.auction.out = game.players.map(() => false);
    game.auction.history = [];

    game.neitherKnows.remaining = skipAllowance(game.settings.rosterSize);
    game.neitherKnows.votes = game.players.map(() => false);

    game.status.started = false;
    game.status.gameOver = false;

}



// How many "neither knows" skips the table gets for the whole draft.

function skipAllowance(rosterSize) {

    if (rosterSize <= 3) return 0;
    if (rosterSize <= 6) return 1;
    if (rosterSize <= 10) return 2;
    if (rosterSize <= 15) return 3;
    if (rosterSize <= 25) return 4;

    return 5;

}



// =========================
// PLAYER HELPERS
// =========================

export function player(index) {

    return game.players[index];

}


export function playerCount() {

    return game.players.length;

}


// True when this player still has roster spots to fill.

export function stillDrafting(index) {

    return game.players[index].roster.length < game.settings.rosterSize;

}


export function rosterFull(index) {

    return !stillDrafting(index);

}


export function draftComplete() {

    return game.players.every((p, i) => rosterFull(i));

}



// =========================
// MONEY + ROSTER
// =========================

export function spendMoney(index, amount) {

    game.players[index].money -= amount;

}


export function addRosterItem(index, item) {

    game.players[index].roster.push(item);

}



// =========================
// TURN ORDER HELPERS
// =========================

// Walks forward through the seating order (wrapping around)
// and returns the first index that passes the test.
// Returns null if nobody passes the test.

export function nextMatching(startIndex, test) {

    const count = playerCount();

    for (let step = 0; step < count; step++) {

        const index = (startIndex + step) % count;

        if (test(index)) {

            return index;

        }

    }

    return null;

}