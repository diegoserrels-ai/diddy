// =========================
// AUCTION DEBATE GAME
// UI MODULE
// VERSION 1.2
// =========================

import { game } from "./gameState.js";
let expandedMobilePlayers = new Set();


// =========================
// PLAYER NAMES
// =========================

export function updatePlayerNames() {

    game.players.forEach((player, index) => {

        const title = document.getElementById(
            `player${index + 1}Title`
        );

        if (title) {

            title.textContent = player.name;

        }

    });

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

    game.players.forEach((player, index) => {

        const moneyElement = document.getElementById(
            `player${index + 1}Money`
        );

        if (moneyElement) {

            moneyElement.textContent = `$${player.money}`;

        }

    });

}



// =========================
// ROSTERS
// =========================

export function updateRosters() {

    game.players.forEach((player, index) => {

        drawRoster(

            `player${index + 1}Roster`,

            player.roster

        );

    });

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
// NEITHER KNOWS
// =========================

export function updateNeitherKnows() {

    const p1 =
        document.getElementById("player1SkipButton");

    const p2 =
        document.getElementById("player2SkipButton");

    document.getElementById("skipVotes1").textContent =
        `${game.neitherKnows.votes} / 2`;

    document.getElementById("skipVotes2").textContent =
        `${game.neitherKnows.votes} / 2`;

    document.getElementById("skipRemaining1").textContent =
        `${game.neitherKnows.remaining} Remaining`;

    document.getElementById("skipRemaining2").textContent =
        `${game.neitherKnows.remaining} Remaining`;

    const disabled =
        game.status.gameOver ||
        game.neitherKnows.remaining <= 0;

    p1.disabled = disabled;
    p2.disabled = disabled;

    p1.classList.toggle(
        "skip-armed",
        game.neitherKnows.votes === 1
    );

    p2.classList.toggle(
        "skip-armed",
        game.neitherKnows.votes === 1
    );

}
// =========================
// AUCTION NOTIFICATION
// =========================

export function showAuctionNotification(
    title,
    playerText,
    amount,
    item
) {

    document.getElementById("notificationTitle").textContent =
        title;

    document.getElementById("notificationPlayer").textContent =
        playerText;

    document.getElementById("notificationAmount").textContent =
        amount;

    document.getElementById("notificationItem").textContent =
        item;

    document
        .getElementById("auctionNotification")
        .classList.add("show");
        document.getElementById("bidButton").disabled = true;
document.getElementById("passButton").disabled = true;
document.getElementById("bidAmount").disabled = true;
}

export function hideAuctionNotification() {

    document
        .getElementById("auctionNotification")
        .classList.remove("show");
    document.getElementById("bidButton").disabled = false;
document.getElementById("passButton").disabled = false;
document.getElementById("bidAmount").disabled = false;
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
    updateNeitherKnows();

    // Highlight active player
    game.players.forEach((player, index) => {

    const card = document.getElementById(
        `player${index + 1}Card`
    );

    if (card) {

        card.classList.remove("active");

        if (
            !game.status.gameOver &&
            game.auction.currentTurn === index + 1
        ) {

            card.classList.add("active");

        }

    }

});

updateMobileUI();

updateMobileAuctionPanel();

}

function updateMobileUI() {

    const container = document.getElementById(
        "mobilePlayerContainer"
    );

    if (!container) return;

    container.innerHTML = "";

    game.players.forEach((player, index) => {

    container.appendChild(
        createMobilePlayerCard(player, index)
    );

});

}

function createMobilePlayerCard(player, index) {

    const card = document.createElement("div");

    card.className = "mobile-player-card";

if (
    !game.status.gameOver &&
    game.auction.currentTurn === index + 1
) {

    card.classList.add("active");

}

    const expanded = expandedMobilePlayers.has(index);

    card.innerHTML = `

        <div class="mobile-player-header">

            <div class="mobile-player-top">

                <div class="mobile-player-name">

                    ${player.name}

                </div>

                <div class="mobile-player-money">

                    $${player.money}

                </div>

            </div>

            <div class="mobile-player-category">

    ${game.settings.category}
    ${
        game.settings.category === "Sports"
            ? ` (${game.settings.sportsMode})`
            : ""
    }

</div>

<div class="mobile-player-status">

    ${
        game.currentBidder === index + 1
            ? `<span class="status-pill active">Current Bidder</span>`
            : ""
    }

    ${
        player.money <= 0
            ? `<span class="status-pill danger">No Money</span>`
            : ""
    }

    ${
        player.roster.length >= game.settings.rosterSize
            ? `<span class="status-pill complete">Roster Full</span>`
            : ""
    }

</div>

            <div class="mobile-player-bottom">

                <span>

                    Roster ${player.roster.length}/${game.settings.rosterSize}

                </span>

                <div class="mobile-expand-icon">

                    ${expanded ? "▲" : "▼"}

                </div>

            </div>

        </div>

        <div class="mobile-player-roster ${expanded ? "expanded" : ""}">

            ${
                player.roster.length
                    ? player.roster
                          .map(
                              item =>
                                  `<div class="mobile-roster-item">
                                      ${item.name}
                                      <span>$${item.price ?? 0}</span>
                                   </div>`
                          )
                          .join("")
                    : "<div><em>No players yet</em></div>"
            }

            <div class="mobile-neither-knows">

                <button
                    class="mobile-skip-button"
                    ${game.status.gameOver || game.neitherKnows.remaining <= 0 ? "disabled" : ""}
                >

                    Neither Knows

                </button>

                <div class="mobile-skip-info">

                    ${game.neitherKnows.remaining} Remaining

                    •

                    ${game.neitherKnows.votes}/2 Votes

                </div>

            </div>

        </div>

    `;

    card.querySelector(".mobile-player-header")
        .addEventListener("click", () => {

            if (expanded) {

                expandedMobilePlayers.delete(index);

            } else {

                expandedMobilePlayers.add(index);

            }

            updateMobileUI();

        });

    const skipButton = card.querySelector(".mobile-skip-button");

    if (skipButton) {

        skipButton.addEventListener("click", () => {

            const originalButton = document.getElementById(
                index === 0
                    ? "player1SkipButton"
                    : "player2SkipButton"
            );

            if (originalButton) {

                originalButton.click();

            }

        });

    }

    return card;

}

function updateMobileAuctionPanel() {

    const panel = document.getElementById(
        "mobileAuctionPanel"
    );

    if (!panel) return;

    const leader =
        game.auction.highestBidder === 1
            ? game.player1.name
            : game.auction.highestBidder === 2
                ? game.player2.name
                : "None";

    const turn =
        game.auction.currentTurn === 1
            ? game.player1.name
            : game.player2.name;

    panel.innerHTML = `

        <div class="mobile-auction-title">

            Current Auction

        </div>

        <div class="mobile-auction-player">

            ${
                game.auction.currentItem
                    ? game.auction.currentItem.name
                    : "Loading..."
            }

        </div>

        <div class="mobile-auction-row">

            <span>Current Bid</span>

            <strong>$${game.auction.currentBid}</strong>

        </div>

        <div class="mobile-auction-row">

            <span>Leader</span>

            <strong>${leader}</strong>

        </div>

                <div class="mobile-auction-row">

            <span>Turn</span>

            <strong>${turn}</strong>

        </div>

                <div class="mobile-auction-status">

            ${
                game.status.gameOver
                    ? "Game Over"
                    : `${turn}'s Turn`
            }

        </div>

        <div class="mobile-bid-section">

    <input
        id="mobileBidInput"
        class="mobile-bid-input"
        type="number"
        min="${game.auction.currentBid + 1}"
        value="${game.auction.currentBid + 1}"
    >

    <button
        id="mobileBidButton"
        class="mobile-bid-button"
    >

        Place Bid

    </button>

</div>

<button
    id="mobilePassButton"
    class="mobile-pass-button"
    ${game.status.gameOver ? "disabled" : ""}
>

    Pass

</button>

    `;

    const mobilePassButton =
        document.getElementById("mobilePassButton");

    if (mobilePassButton) {

        mobilePassButton.addEventListener("click", () => {

            document
                .getElementById("passButton")
                ?.click();

        });

    }

const mobileBidButton =
    document.getElementById("mobileBidButton");

if (mobileBidButton) {

    mobileBidButton.addEventListener("click", () => {

        const mobileInput =
            document.getElementById("mobileBidInput");

        const desktopInput =
            document.getElementById("bidAmount");

        if (!mobileInput || !desktopInput) return;

        desktopInput.value = mobileInput.value;

        document
            .getElementById("bidButton")
            ?.click();

    });

}

}