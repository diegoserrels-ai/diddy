// =========================
// AUCTION DRAFT DEBATE
// UI
// VERSION 3.0
// =========================
//
// There is now ONE layout instead of a separate mobile copy.
// The stylesheet reshapes it for phones, so anything drawn here
// shows up on both. Nothing in this file knows about screen size.

import { game } from "./gameState.js";


// Which roster lists the players have tapped open (phone only).
const openRosters = new Set();

// Filled in by auctionEngine so a tapped name can cast a skip vote.
let onSkipVote = () => {};

// Online only. The seat this device controls, so we can grey out
// everyone else's controls. Stays null for pass-and-play.
let mySeat = null;

export function setSeatLock(seat) {
    mySeat = seat;
}

export function seatLock() {
    return mySeat;
}

export function setSkipVoteHandler(handler) {
    onSkipVote = handler;
}


function el(id) {
    return document.getElementById(id);
}



// =========================
// HEADER
// =========================

export function updateCategoryPill() {

    const s = game.settings;

    el("categoryName").textContent = s.category;

    const parts = [];

    if (s.sportsMode) {

        parts.push(
            s.sportsMode === "current" ? "Current" : "All-Time"
        );

    }

    parts.push(
        `${s.rosterSize} ${s.rosterSize === 1 ? "spot" : "spots"}`
    );

    parts.push(`${game.players.length} players`);

    el("categoryMeta").textContent = parts.join(" · ");

}



// =========================
// AUCTION PANEL
// =========================

export function updateAuction() {

    el("auctionArea").classList.toggle("is-over", game.status.gameOver);

    el("currentItem").textContent =
        game.status.gameOver
            ? "Draft complete"
            : game.auction.currentItem
                ? game.auction.currentItem.name
                : "Loading...";

    el("currentBid").textContent = `$${game.auction.currentBid}`;

    el("currentBidder").textContent =
        game.auction.highestBidder === null
            ? "None"
            : game.players[game.auction.highestBidder].name;

    el("turnDisplay").textContent =
        game.status.gameOver
            ? "Draft complete"
            : mySeat === game.auction.currentTurn
                ? "Your turn"
                : `${game.players[game.auction.currentTurn].name}'s turn`;

}


export function setMessage(text = "") {

    el("gameMessage").textContent = text;

}



// =========================
// BID CONTROLS
// =========================

// Fills the bid box with the smallest legal raise so nobody
// has to type on a phone keyboard unless they want to.

export function primeBidInput() {

    const input = el("bidAmount");

    const bidder = game.players[game.auction.currentTurn];

    const minimum = game.auction.currentBid + 1;

    input.min = minimum;

    input.value = minimum <= bidder.money ? minimum : "";

}


export function setControlsEnabled(canBid, canPass) {

    el("bidButton").disabled = !canBid;
    el("passButton").disabled = !canPass;
    el("bidAmount").disabled = !canBid;

}


export function lockControls() {

    setControlsEnabled(false, false);

}



// =========================
// NEITHER KNOWS
// =========================

export function updateSkipBar() {

    const nk = game.neitherKnows;

    const voters = game.players.filter(
        p => p.roster.length < game.settings.rosterSize
    );

    const votes = voters.filter(p => nk.votes[p.index]).length;

    const chips = el("skipChips");

    chips.innerHTML = "";

    const locked = game.status.gameOver || nk.remaining <= 0;

    el("skipMeta").textContent =
        nk.remaining <= 0
            ? "No skips left"
            : `${votes}/${voters.length} · ${nk.remaining} left`;

    voters.forEach(p => {

        const chip = document.createElement("button");

        chip.type = "button";

        chip.className =
            "skip-chip" + (nk.votes[p.index] ? " voted" : "");

        chip.textContent = p.name;

        // Pass-and-play lets one device tap everyone. Online, you can
        // only speak for yourself.
        chip.disabled = locked || (mySeat !== null && p.index !== mySeat);

        chip.addEventListener("click", () => onSkipVote(p.index));

        chips.appendChild(chip);

    });

    el("skipBar").classList.toggle("locked", locked);

}



// =========================
// PLAYER CARDS
// =========================

function buildPlayerCard(p) {

    const card = document.createElement("aside");

    card.className = "player-card";

    const isTurn =
        !game.status.gameOver &&
        game.auction.currentTurn === p.index;

    if (isTurn) card.classList.add("active");

    const full = p.roster.length >= game.settings.rosterSize;

    const expanded = openRosters.has(p.index);

    // Status pills, capped so a phone row never wraps.
    const pills = [];

    if (game.auction.highestBidder === p.index) {

        pills.push(`<span class="pill pill-lead">Leading</span>`);

    }

    if (full) {

        pills.push(`<span class="pill pill-full">Roster full</span>`);

    } else if (p.money <= 0) {

        pills.push(`<span class="pill pill-broke">Out of money</span>`);

    } else if (game.auction.out[p.index] && !game.status.gameOver) {

        pills.push(`<span class="pill pill-out">Passed</span>`);

    }

    const rosterRows = p.roster.length

        ? p.roster
            .map(item => `
                <li class="roster-item">
                    <span>${escapeHTML(item.name)}</span>
                    <span class="roster-price">$${item.price ?? 0}</span>
                </li>`)
            .join("")

        : `<li class="roster-empty">No picks yet</li>`;

    // On a phone the pills are hidden and these classes carry the
    // same information through colour, which keeps each card to one line.
    if (game.auction.highestBidder === p.index) card.classList.add("leading");
    if (full) card.classList.add("full");
    if (game.auction.out[p.index] && !full && !game.status.gameOver) {
        card.classList.add("passed");
    }

    card.innerHTML = `

        <button class="pc-head" type="button">

            <span class="pc-line">

                <span class="pc-name">
                    ${isTurn ? `<span class="turn-dot"></span>` : ""}${escapeHTML(p.name)}
                </span>

                <span class="pc-right">

                    <span class="pc-count">
                        ${p.roster.length}/${game.settings.rosterSize}
                    </span>

                    <span class="pc-money ${p.money <= 0 ? "empty" : ""}">
                        $${p.money}
                    </span>

                    <span class="chev ${expanded ? "open" : ""}">▾</span>

                </span>

            </span>

            <span class="pc-pills">${pills.join("")}</span>

        </button>

        <ul class="pc-roster ${expanded ? "open" : ""}">
            ${rosterRows}
        </ul>
    `;

    card
        .querySelector(".pc-head")
        .addEventListener("click", () => {

            if (openRosters.has(p.index)) {

                openRosters.delete(p.index);

            } else {

                // One open at a time keeps the phone screen short.
                openRosters.clear();
                openRosters.add(p.index);

            }

            renderPlayers();

        });

    return card;

}


export function renderPlayers() {

    const board = el("board");

    board.dataset.count = game.players.length;

    board
        .querySelectorAll(".player-card")
        .forEach(card => card.remove());

    game.players.forEach(p => {

        board.appendChild(buildPlayerCard(p));

    });

}


// Opened at the end of the draft so everyone can compare.

export function openAllRosters() {

    game.players.forEach(p => openRosters.add(p.index));

    renderPlayers();

}



// =========================
// SOLD / BID POPUP
// =========================

export function showNotification(title, who, amount, item) {

    el("notifTitle").textContent = title;
    el("notifPlayer").textContent = who;
    el("notifAmount").textContent = amount;
    el("notifItem").textContent = item;

    el("notification").classList.add("show");

    lockControls();

}


export function hideNotification() {

    el("notification").classList.remove("show");

}



// =========================
// FULL REDRAW
// =========================

export function render() {

    updateCategoryPill();
    updateAuction();
    updateSkipBar();
    renderPlayers();

}



// Item names come from your own JSON files, but escaping keeps a
// stray < or & from breaking the page.

function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}