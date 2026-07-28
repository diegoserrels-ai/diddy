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

import { setSeatLock } from "./ui.js";

import * as net from "./net.js";


// Build marker. Check this in the console to confirm the deployed
// files are not a stale cached copy: window.ADB_VERSION
window.ADB_VERSION = "online-5";

console.log("[ADB] auctionEngine loaded, build", window.ADB_VERSION);


// Anything that blows up before or during setup lands in the message
// bar, so a phone with no console still shows what went wrong.

function reportFatal(prefix, detail) {

    console.error("[ADB]", prefix, detail);

    const bar = document.getElementById("gameMessage");

    if (bar && !game.status.started) {

        bar.textContent = `${prefix}: ${detail && detail.message ? detail.message : detail}`;

    }

}

window.addEventListener("error", event => {

    if (event.filename && !event.filename.includes("/js/")) return;

    reportFatal("Error", event.message);

});

window.addEventListener("unhandledrejection", event => {

    reportFatal("Error", event.reason);

});


// "local"  one device, pass and play
// "host"   online, this browser is the referee
// "guest"  online, this browser shows what the host publishes
let mode = "local";

let mySeat = 0;
let roomCode = null;

// Copies of what is on screen, so the host can publish them.
let lastMessage = "";
let lastPopup = null;
let revision = 0;


const BID_POPUP = 900;
const SOLD_POPUP = 1250;
const FREE_POPUP = 700;
const RANDOM_POPUP = 1800;


function el(id) {
    return document.getElementById(id);
}


// Anything that changes what people see goes through these three, so
// the host can push the same picture out to everyone else.

function say(text) {

    lastMessage = text;

    setMessage(text);

    publish();

}


function popup(title, who, amount, item) {

    lastPopup = { title, who, amount, item };

    showNotification(title, who, amount, item);

    publish();

}


function unpopup() {

    lastPopup = null;

    hideNotification();

    publish();

}


function sync() {

    render();

    publish();

}


function publish() {

    if (mode !== "host" || !roomCode) return;

    // The JSON round trip strips any undefined that would make
    // Firebase reject the whole write.
    const state = JSON.parse(JSON.stringify(serialize()));

    net.publishState(roomCode, state).catch(error => {

        console.error("[ADB] publish failed", error);

        setMessage("Sync problem: " + error.message);

    });

}


// What the host sends out. The deck is deliberately left out: it
// would be a big payload and it would spoil the upcoming items.

function serialize() {

    const a = game.auction;

    return {

        rev: ++revision,

        players: game.players.map(p => ({
            name: p.name,
            money: p.money,
            roster: p.roster
        })),

        item: a.currentItem,
        bid: a.currentBid,
        leader: a.highestBidder,
        turn: a.currentTurn,
        out: a.out,
        round: a.round,

        rosterSize: game.settings.rosterSize,

        skipLeft: game.neitherKnows.remaining,
        votes: game.neitherKnows.votes,

        over: game.status.gameOver,

        message: lastMessage,
        popup: lastPopup

    };

}


// Firebase drops empty arrays and turns arrays into objects, so
// rebuild them at a known length rather than trusting what arrives.

function boolArray(raw, length) {

    return Array.from({ length }, (_, i) => !!(raw && raw[i]));

}


function applyState(s) {

    if (!s) return;

    game.players.forEach((p, i) => {

        const incoming = s.players && s.players[i];

        if (!incoming) return;

        p.name = incoming.name ?? p.name;
        p.money = incoming.money ?? 0;
        p.roster = incoming.roster || [];

    });

    if (s.rosterSize) game.settings.rosterSize = s.rosterSize;

    const a = game.auction;

    a.currentItem = s.item || null;
    a.currentBid = s.bid || 0;
    a.highestBidder = (s.leader === null || s.leader === undefined) ? null : s.leader;
    a.currentTurn = s.turn || 0;
    a.out = boolArray(s.out, game.players.length);
    a.round = s.round || 1;

    game.neitherKnows.remaining = s.skipLeft || 0;
    game.neitherKnows.votes = boolArray(s.votes, game.players.length);

    game.status.gameOver = !!s.over;

    setMessage(s.message || "");

    lastPopup = s.popup || null;

    if (s.popup) {

        showNotification(s.popup.title, s.popup.who, s.popup.amount, s.popup.item);

    } else {

        hideNotification();

    }

    render();

    if (game.status.gameOver) openAllRosters();

    updateActionButtons();

    primeBidInput();

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

if (document.readyState === "loading") {

    window.addEventListener("DOMContentLoaded", start);

} else {

    start();

}


async function start() {

    const saved = localStorage.getItem("auctionSettings");

    if (!saved) {

        setMessage("No game settings found. Head back and start a new game.");

        return;

    }

    const settings = JSON.parse(saved);

    if (settings.mode === "online") {

        return startOnline(settings);

    }

    return startLocal(settings);

}



// =========================
// ONE DEVICE
// =========================

async function startLocal(settings) {

    mode = "local";

    setSeatLock(null);

    // Older saved games stored player1 / player2 instead of a list.
    if (!settings.names) {

        settings.names =
            [settings.player1, settings.player2].filter(Boolean);

    }

    game.settings = { ...game.settings, ...settings };

    resetGame();

    if (!(await buildDeck())) return;

    game.status.started = true;

    wireControls();

    setSkipVoteHandler(toggleSkipVote);

    render();

    startRound();

}



// =========================
// ONLINE
// =========================
//
// Both sides watch the room. The host also runs the draft and
// publishes what happens; everyone else just draws it.

async function startOnline(settings) {

    roomCode = settings.code;

    console.log("[ADB] online start, room", roomCode);

    setMessage("Connecting...");

    try {

        await net.connect();

        console.log("[ADB] connected as", net.myUid());

    } catch (error) {

        reportFatal("Could not connect", error);

        return;

    }

    let ready = false;
    let rejoinTried = false;

    // Who we were in the last good snapshot. More trustworthy than
    // anything saved before the game started.
    let lastKnownMe = null;

    net.watchRoom(roomCode, async room => {

        try {

        if (!room) {

            setMessage("This lobby is gone. Start a new game.");

            return;

        }

        const players = net.playerList(room);

        let me = players.find(p => p.uid === net.myUid());

        // Our seat is missing. Almost always this means the lobby's
        // disconnect handler fired while we were moving to this page,
        // so put ourselves back rather than stranding the player.
        const known = lastKnownMe || {
            name: settings.myName,
            seat: settings.seat ?? 0
        };

        if (!me && !rejoinTried && known.name) {

            rejoinTried = true;

            console.log("[ADB] seat missing, rejoining as", known.name, "seat", known.seat);

            await net.rejoin(roomCode, known.name, known.seat);

            // That write brings us straight back here with a seat.
            return;

        }

        if (!me) {

            setMessage("You are not in this game any more. Go back and rejoin the lobby.");

            return;

        }

        lastKnownMe = { name: me.name, seat: me.seat };

        // Worked out from the room itself rather than trusting
        // whatever was saved before the game started.
        const amHost = room.hostUid === net.myUid();

        if (!ready) {

            ready = true;

            mode = amHost ? "host" : "guest";
            mySeat = me.seat;

            setSeatLock(mySeat);

            game.settings = {
                ...game.settings,
                ...room.settings,
                names: players.map(p => p.name)
            };

            resetGame();

            wireControls();

            setSkipVoteHandler(seat => sendOrApply({ type: "skip", seat: seat }));

            net.keepSeatOnDisconnect(roomCode).catch(() => {});

            console.log("[ADB] I am", mode, "seat", mySeat, "players:",
                players.map(p => p.name).join(", "));

            if (mode === "host") {

                await net.clearActions(roomCode);

                if (!(await buildDeck())) return;

                console.log("[ADB] deck ready:", game.auction.deck.length, "items");

                game.status.started = true;

                net.watchActions(roomCode, applyRemoteAction);

                render();

                startRound();

                return;

            }

            setMessage("Waiting for the host to deal the first item...");

        }

        if (mode === "guest" && room.state) {

            if (!game.status.started) {

                game.status.started = true;

                console.log("[ADB] first state received, rev", room.state.rev);

            }

            applyState(room.state);

        }

        } catch (error) {

            reportFatal("Game setup failed", error);

        }

    });

}


// Loads the item list and trims the roster size if the category is
// too small. Returns false when there is nothing to play with.

async function buildDeck() {

    try {

        await loadAuctionDeck();

    } catch (error) {

        console.error(error);

        setMessage("Could not load the items for this category. Check the data folder.");

        return false;

    }

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

    return true;

}



// =========================
// ACTIONS FROM OTHER PEOPLE
// =========================

// A guest sends its move to the host. The host just does it.

function sendOrApply(action) {

    if (mode === "guest") {

        net.sendAction(roomCode, action).catch(error => {

            console.error("Could not send that action", error);

        });

        return;

    }

    applyRemoteAction(action);

}


function applyRemoteAction(action) {

    if (mode === "guest") return;

    if (!action) return;

    if (action.type === "skip") {

        return toggleSkipVote(action.seat);

    }

    if (game.status.gameOver) return;

    // Somebody tapped out of turn, or a stale message arrived late.
    if (action.seat !== game.auction.currentTurn) return;

    if (action.type === "bid") {

        return submitBid(Number(action.amount));

    }

    if (action.type === "pass") {

        return passBid();

    }

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

    const needing = game.players
        .map((p, i) => i)
        .filter(i => stillDrafting(i));

    // Everyone else is full, so there is nobody left to bid against.
    // Asking this player to buy the rest one at a time is pointless,
    // so their remaining spots get filled at random.
    if (needing.length === 1) {

        return fillLastRoster(needing[0]);

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

    say(

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

    // A sold / bid popup is covering the board. Nothing is clickable
    // underneath it, so do not make the buttons look like they are.
    if (lastPopup) {

        lockControls();

        return;

    }

    const a = game.auction;

    const me = game.players[a.currentTurn];

    // You need to be able to beat the current bid.
    // Online, the controls only wake up on your own turn.
    const myTurn = mode === "local" || mySeat === a.currentTurn;

    const canBid = myTurn && !a.out[a.currentTurn] && me.money > a.currentBid;

    // Passing is only allowed once there is a bid to pass on,
    // or when you are the only person who can bid at all.
    const canPass = myTurn && (a.currentBid > 0 || contenders().length === 1);

    setControlsEnabled(canBid, canPass);

}


// Auto focusing on a phone throws the keyboard over the screen,
// so only do it where there is room.

function focusBidInput() {

    if (mode !== "local" && mySeat !== game.auction.currentTurn) return;

    if (!window.matchMedia("(min-width: 900px)").matches) return;

    const input = el("bidAmount");

    input.focus();
    input.select();

}



// =========================
// PLACE BID
// =========================

// Runs on whichever device pressed the button. Checks the obvious
// mistakes so the person gets an instant answer, then either applies
// the bid (host or local) or sends it on (guest).

function placeBid() {

    if (game.status.gameOver) return;

    const a = game.auction;

    const seat = mode === "local" ? a.currentTurn : mySeat;

    if (mode !== "local" && seat !== a.currentTurn) return;

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

    if (mode === "guest") {

        sendOrApply({ type: "bid", seat: seat, amount: amount });

        setControlsEnabled(false, false);

        return;

    }

    submitBid(amount);

}


// The real thing. Only ever runs on the host or in a local game, so
// there is one place where a bid actually counts.

function submitBid(amount) {

    if (game.status.gameOver) return;

    const a = game.auction;

    const bidder = game.players[a.currentTurn];

    if (!Number.isInteger(amount)) return;
    if (amount <= a.currentBid) return;
    if (amount > bidder.money) return;

    a.currentBid = amount;
    a.highestBidder = a.currentTurn;

    // Anyone who cannot go higher is out of this item.
    game.players.forEach((p, i) => {

        if (i !== a.highestBidder && p.money <= amount) {

            a.out[i] = true;

        }

    });

    render();

    popup("BID", `${bidder.name} bids`, `$${amount}`, a.currentItem.name);

    playBidSound();

    setTimeout(() => {

        unpopup();

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

    say(`${nameOf(a.currentTurn)}: raise it or pass.`);

}



// =========================
// PASS
// =========================

function passBid() {

    if (game.status.gameOver) return;

    const a = game.auction;

    if (mode === "guest") {

        if (mySeat !== a.currentTurn) return;

        sendOrApply({ type: "pass", seat: mySeat });

        setControlsEnabled(false, false);

        return;

    }

    const passer = a.currentTurn;

    a.out[passer] = true;

    // No bid on the table means this is the lone bidder turning
    // the item down. Handing it to the next seat every time quietly
    // favours whoever sits there, so the winner is drawn at random
    // and announced.
    if (a.currentBid === 0) {

        const candidates = game.players
            .map((p, i) => i)
            .filter(i => i !== passer && stillDrafting(i));

        if (candidates.length === 0) {

            return awardItem(passer, 0, "free");

        }

        const lucky =
            candidates[Math.floor(Math.random() * candidates.length)];

        say(
            `${nameOf(passer)} passed. ${nameOf(lucky)} was drawn at random from ${candidates.length}.`
        );

        return awardItem(lucky, 0, "random");

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

    say(`${nameOf(passer)} passed. ${nameOf(a.currentTurn)} is up.`);

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


// mode: "sold" (normal), "free" (nobody could pay),
// "random" (someone passed and the winner was drawn)

function awardItem(index, price, how = "sold") {

    const a = game.auction;

    const winner = game.players[index];

    recordPick(index, a.currentItem, price);

    render();

    const shout = {

        sold:   ["SOLD", `${winner.name} wins`, `$${price}`],
        free:   ["FREE PICK", `${winner.name} picks up`, `$${price}`],
        random: ["PASSED ON", `Randomly awarded to ${winner.name}`, "FREE"]

    }[how];

    popup(shout[0], shout[1], shout[2], a.currentItem.name);

    if (how !== "free") playSoldSound();

    // The random draw gets a longer beat so nobody misses who got it.
    const hold =
        how === "sold" ? SOLD_POPUP
        : how === "random" ? RANDOM_POPUP
        : FREE_POPUP;

    setTimeout(() => {

        unpopup();

        continueDraft();

    }, hold);

}


// Only one player still has spots to fill. The deck is already
// shuffled, so drawing off the top is a random pick.

function fillLastRoster(index) {

    let given = 0;

    while (stillDrafting(index)) {

        const item = drawNextItem();

        if (!item) break;

        recordPick(index, item, 0);

        given++;

    }

    finishDraft(

        given === 0
            ? undefined
            : `Everyone else was full, so ${nameOf(index)} got the last ${given} ${given === 1 ? "pick" : "picks"} at random.`

    );

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

    if (mode === "guest") return;

    if (game.status.gameOver) return;

    const nk = game.neitherKnows;

    if (nk.remaining <= 0) return;

    nk.votes[index] = !nk.votes[index];

    updateSkipBar();

    publish();

    const voters = game.players.filter(p => stillDrafting(p.index));

    const everyone =
        voters.length > 0 &&
        voters.every(p => nk.votes[p.index]);

    if (!everyone) return;

    nk.remaining--;

    nk.votes = game.players.map(() => false);

    lockControls();

    say("Skipped. Nobody knew that one.");

    setTimeout(startRound, 400);

}



// =========================
// END OF DRAFT
// =========================

function finishDraft(reason) {

    game.status.gameOver = true;

    lastPopup = null;

    hideNotification();

    lockControls();

    render();

    openAllRosters();

    publish();

    say(
        reason ||
        "Draft complete. Compare the rosters and argue it out."
    );

}



// =========================
// DEBUG
// =========================

window.game = game;

// Handy when something looks out of sync: run netDebug() in the console.
window.netDebug = () => ({
    mode: mode,
    mySeat: mySeat,
    room: roomCode,
    turn: game.auction.currentTurn,
    bidDisabled: document.getElementById("bidButton").disabled
});