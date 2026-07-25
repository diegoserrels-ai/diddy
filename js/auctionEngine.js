// =========================
// AUCTION DRAFT DEBATE
// AUCTION ENGINE
// VERSION 3.0  (2-4 players)
// =========================
//
// HOW A ROUND WORKS
//
// 1. An item is drawn. Everyone who still has roster spots
//    and at least $1 is in the bidding.
// 2. The opening player has to open at $1 or more.
// 3. After that, each player in turn either raises or passes.
//    Passing takes you out of THIS item only.
// 4. When only the leader is left, the item is theirs.
// 5. If a player runs out of money or fills their roster,
//    they are skipped automatically. Leftover items go out free
//    so every roster still fills up.


import {
    game,
    resetGame,
    playerCount,
    stillDrafting,
    rosterFull,
    draftComplete,
    spendMoney,
    addRosterItem,
    nextMatching
} from "./gameState.js";

import {
    loadAuctionDeck,
    drawNextItem
} from "./dataLoader.js";

import {
    render,
    setMessage,
    primeBidInput,
    setControlsEnabled,
    lockControls,
    showNotification,
    hideNotification,
    updateSkipBar,
    openAllRosters,
    setSkipVoteHandler
} from "./ui.js";

import {
    playBidSound,
    playSoldSound
} from "./sound.js";


const BID_POPUP = 900;
const SOLD_POPUP = 1250;
const FREE_POPUP = 700;


function el(id) {
    return document.getElementById(id);
}

function nameOf(index) {
    return game.players[index].name;
}

// Everyone still bidding on the current item.
function contenders() {

    return game.players
        .map((p, i) => i)
        .filter(i => !game.auction.out[i]);

}



// =========================
// STARTUP
// =========================

window.addEventListener("DOMContentLoaded", start);


async function start() {

    const saved = localStorage.getItem("auctionSettings");

    if (!saved) {

        setMessage("No game settings found. Head back and start a new game.");

        return;

    }

    const settings = JSON.parse(saved);

    // Older saved games stored player1 / player2 instead of a list.
    if (!settings.names) {

        settings.names =
            [settings.player1, settings.player2].filter(Boolean);

    }

    game.settings = { ...game.settings, ...settings };

    resetGame();

    try {

        await loadAuctionDeck();

    } catch (error) {

        console.error(error);

        setMessage("Could not load the items for this category. Check the data folder.");

        return;

    }

    // Not enough items for everyone? Shrink the rosters instead of
    // running dry halfway through.
    const needed = playerCount() * game.settings.rosterSize;

    if (game.auction.deck.length < needed) {

        game.settings.rosterSize = Math.max(
            1,
            Math.floor(game.auction.deck.length / playerCount())
        );

        console.warn(
            `Category only has ${game.auction.deck.length} items. Roster size set to ${game.settings.rosterSize}.`
        );

    }

    game.status.started = true;

    wireControls();

    setSkipVoteHandler(toggleSkipVote);

    render();

    startRound();

}


function wireControls() {

    el("bidButton").addEventListener("click", placeBid);

    el("passButton").addEventListener("click", passBid);

    el("bidAmount").addEventListener("keydown", event => {

        if (event.key !== "Enter") return;

        event.preventDefault();

        if (!el("bidButton").disabled) placeBid();

    });

}



// =========================
// START A ROUND
// =========================

function startRound() {

    if (draftComplete()) {

        return finishDraft();

    }

    const item = drawNextItem();

    if (!item) {

        return finishDraft("That category ran out of items.");

    }

    const a = game.auction;

    a.currentItem = item;
    a.currentBid = 0;
    a.highestBidder = null;

    // Full rosters and empty wallets sit this one out.
    a.out = game.players.map(
        (p, i) => rosterFull(i) || p.money < 1
    );

    game.neitherKnows.votes = game.players.map(() => false);

    const bidders = contenders();

    // Nobody has a dollar left, so there is nothing to auction.
    // Deal out the rest of the spots in one go rather than making
    // everyone sit through a popup per pick.
    if (bidders.length === 0) {

        return giveAwayRemaining();

    }

    a.currentTurn = nextMatching(a.openingIndex, i => !a.out[i]);

    render();

    primeBidInput();

    updateActionButtons();

    focusBidInput();

    setMessage(

        bidders.length === 1
            ? `${nameOf(a.currentTurn)} is the only one who can bid. Open at $1 or pass it along.`
            : `${nameOf(a.currentTurn)} opens the bidding.`

    );

}



// =========================
// BUTTON STATE
// =========================

function updateActionButtons() {

    if (game.status.gameOver) {

        lockControls();

        return;

    }

    const a = game.auction;

    const me = game.players[a.currentTurn];

    // You need to be able to beat the current bid.
    const canBid = !a.out[a.currentTurn] && me.money > a.currentBid;

    // Passing is only allowed once there is a bid to pass on,
    // or when you are the only person who can bid at all.
    const canPass = a.currentBid > 0 || contenders().length === 1;

    setControlsEnabled(canBid, canPass);

}


// Auto focusing on a phone throws the keyboard over the screen,
// so only do it where there is room.

function focusBidInput() {

    if (!window.matchMedia("(min-width: 900px)").matches) return;

    const input = el("bidAmount");

    input.focus();
    input.select();

}



// =========================
// PLACE BID
// =========================

function placeBid() {

    if (game.status.gameOver) return;

    const a = game.auction;

    const bidder = game.players[a.currentTurn];

    const raw = el("bidAmount").value;

    const amount = Number(raw);

    if (raw === "" || !Number.isInteger(amount)) {

        alert("Whole dollar amounts only.");
        return;

    }

    if (amount < 1) {

        alert("Bids start at $1.");
        return;

    }

    if (amount <= a.currentBid) {

        alert(`That has to beat $${a.currentBid}.`);
        return;

    }

    if (amount > bidder.money) {

        alert(`${bidder.name} only has $${bidder.money}.`);
        return;

    }

    a.currentBid = amount;
    a.highestBidder = a.currentTurn;

    // Anyone who cannot go higher is out of this item.
    game.players.forEach((p, i) => {

        if (i !== a.highestBidder && p.money <= amount) {

            a.out[i] = true;

        }

    });

    render();

    showNotification(
        "BID",
        `${bidder.name} bids`,
        `$${amount}`,
        a.currentItem.name
    );

    playBidSound();

    setTimeout(() => {

        hideNotification();

        afterBid();

    }, BID_POPUP);

}


function afterBid() {

    const a = game.auction;

    const challengers = contenders().filter(i => i !== a.highestBidder);

    if (challengers.length === 0) {

        return awardItem(a.highestBidder, a.currentBid);

    }

    a.currentTurn = nextMatching(
        (a.currentTurn + 1) % playerCount(),
        i => challengers.includes(i)
    );

    render();

    primeBidInput();

    updateActionButtons();

    focusBidInput();

    setMessage(`${nameOf(a.currentTurn)}: raise it or pass.`);

}



// =========================
// PASS
// =========================

function passBid() {

    if (game.status.gameOver) return;

    const a = game.auction;

    const passer = a.currentTurn;

    a.out[passer] = true;

    // No bid on the table means this is the lone bidder turning
    // the item down, so it goes free to the next player who needs one.
    if (a.currentBid === 0) {

        const receiver = nextMatching(
            (passer + 1) % playerCount(),
            i => stillDrafting(i) && i !== passer
        );

        return awardItem(receiver === null ? passer : receiver, 0, true);

    }

    const challengers = contenders().filter(i => i !== a.highestBidder);

    if (challengers.length === 0) {

        return awardItem(a.highestBidder, a.currentBid);

    }

    a.currentTurn = nextMatching(
        (passer + 1) % playerCount(),
        i => challengers.includes(i)
    );

    render();

    primeBidInput();

    updateActionButtons();

    focusBidInput();

    setMessage(`${nameOf(passer)} passed. ${nameOf(a.currentTurn)} is up.`);

}



// =========================
// AWARD THE ITEM
// =========================

function recordPick(index, item, price) {

    const a = game.auction;

    spendMoney(index, price);

    addRosterItem(index, {

        id: item.id,
        name: item.name,
        price: price

    });

    a.history.push({

        round: a.round,
        item: item.name,
        winner: game.players[index].name,
        price: price

    });

    a.round++;

    // The opening seat rotates so the same person is not
    // always forced to bid first.
    a.openingIndex = (a.openingIndex + 1) % playerCount();

}


function awardItem(index, price, free = false) {

    const a = game.auction;

    const winner = game.players[index];

    recordPick(index, a.currentItem, price);

    render();

    showNotification(

        free ? "FREE PICK" : "SOLD",
        free ? `${winner.name} picks up` : `${winner.name} wins`,
        `$${price}`,
        a.currentItem.name

    );

    if (!free) playSoldSound();

    setTimeout(() => {

        hideNotification();

        continueDraft();

    }, free ? FREE_POPUP : SOLD_POPUP);

}


// Everyone is broke but rosters are not full. Deal the rest of the
// items out one seat at a time and end the draft.

function giveAwayRemaining() {

    const a = game.auction;

    let item = a.currentItem;

    let seat = a.openingIndex;

    let given = 0;

    while (item && !draftComplete()) {

        const receiver = nextMatching(seat, i => stillDrafting(i));

        if (receiver === null) break;

        recordPick(receiver, item, 0);

        given++;

        seat = (receiver + 1) % playerCount();

        if (draftComplete()) break;

        item = drawNextItem();

    }

    finishDraft(

        given === 0
            ? undefined
            : `Everyone ran out of money, so the last ${given} ${given === 1 ? "pick was" : "picks were"} dealt out free.`

    );

}


function continueDraft() {

    if (draftComplete()) {

        return finishDraft();

    }

    setTimeout(startRound, 250);

}



// =========================
// NEITHER KNOWS
// =========================

function toggleSkipVote(index) {

    if (game.status.gameOver) return;

    const nk = game.neitherKnows;

    if (nk.remaining <= 0) return;

    nk.votes[index] = !nk.votes[index];

    updateSkipBar();

    const voters = game.players.filter(p => stillDrafting(p.index));

    const everyone =
        voters.length > 0 &&
        voters.every(p => nk.votes[p.index]);

    if (!everyone) return;

    nk.remaining--;

    nk.votes = game.players.map(() => false);

    lockControls();

    setMessage("Skipped. Nobody knew that one.");

    setTimeout(startRound, 400);

}



// =========================
// END OF DRAFT
// =========================

function finishDraft(reason) {

    game.status.gameOver = true;

    hideNotification();

    lockControls();

    render();

    openAllRosters();

    setMessage(
        reason ||
        "Draft complete. Compare the rosters and argue it out."
    );

}



// =========================
// DEBUG
// =========================

window.game = game;