// =========================
// AUCTION DRAFT DEBATE
// MENU + LOBBY
// VERSION 1.0
// =========================
//
// Runs the front page. Five screens live in index.html and this file
// swaps between them:
//
//   menu      pick local or online
//   local     names and settings for one device  (unchanged behaviour)
//   host      settings for an online lobby
//   join      type a code and a name
//   lobby     wait for people, host starts the game

import { CATEGORIES, resolveFile } from "./categories.js";

import {
    connect, createRoom, joinRoom, watchRoom, setStatus,
    leaveRoom, myUid, playerList, isMock
} from "./net.js";

import { MAX_PLAYERS, MIN_PLAYERS } from "./firebaseConfig.js";


const MAX_LOCAL = 4;

let localCount = 2;

let roomCode = null;
let stopWatching = null;
let iAmHost = false;


function el(id) {
    return document.getElementById(id);
}


function show(screen) {

    document.querySelectorAll(".screen").forEach(s => {

        s.classList.toggle("visible", s.id === `screen-${screen}`);

    });

}



// =========================
// STARTUP
// =========================

function init() {

    fillCategoryDropdown("category");
    fillCategoryDropdown("hostCategory");

    buildLocalCountButtons();
    showLocalNameFields();

    el("category").addEventListener("change", () => eraToggle("category", "sportsModeContainer"));
    el("hostCategory").addEventListener("change", () => eraToggle("hostCategory", "hostSportsContainer"));

    eraToggle("category", "sportsModeContainer");
    eraToggle("hostCategory", "hostSportsContainer");

    el("menuLocalButton").addEventListener("click", () => show("local"));
    el("menuHostButton").addEventListener("click", () => show("host"));
    el("menuJoinButton").addEventListener("click", () => show("join"));

    document.querySelectorAll("[data-back]").forEach(button => {

        button.addEventListener("click", () => show("menu"));

    });

    el("startLocalButton").addEventListener("click", startLocalGame);
    el("createLobbyButton").addEventListener("click", createLobby);
    el("joinLobbyButton").addEventListener("click", joinLobby);
    el("startOnlineButton").addEventListener("click", startOnlineGame);
    el("leaveLobbyButton").addEventListener("click", leaveLobby);

    el("copyCodeButton").addEventListener("click", copyCode);

    // Codes are always upper case, so save people the shift key.
    el("joinCode").addEventListener("input", event => {

        event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    });

    if (isMock) {

        el("mockBanner").style.display = "block";

    }

    show("menu");

}


function fillCategoryDropdown(id) {

    const dropdown = el(id);

    dropdown.innerHTML = "";

    Object.keys(CATEGORIES).forEach(name => {

        const option = document.createElement("option");

        option.value = name;
        option.textContent = name;

        dropdown.appendChild(option);

    });

}


// The current / all-time picker only applies to sports categories.

function eraToggle(selectId, containerId) {

    const chosen = el(selectId).value;

    el(containerId).style.display =
        CATEGORIES[chosen] && CATEGORIES[chosen].sports ? "flex" : "none";

}



// =========================
// LOCAL GAME
// =========================

function buildLocalCountButtons() {

    const row = el("playerCount");

    row.innerHTML = "";

    for (let n = 2; n <= MAX_LOCAL; n++) {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "seg-button" + (n === localCount ? " selected" : "");
        button.textContent = n;

        button.addEventListener("click", () => {

            localCount = n;

            buildLocalCountButtons();
            showLocalNameFields();

        });

        row.appendChild(button);

    }

}


function showLocalNameFields() {

    for (let n = 1; n <= MAX_LOCAL; n++) {

        el(`playerField${n}`).style.display = n <= localCount ? "flex" : "none";

    }

}


function readSettings(prefix) {

    const category = el(prefix ? "hostCategory" : "category").value;

    const budget = Number(el(prefix ? "hostBudget" : "budget").value);

    const rosterSize = Number(el(prefix ? "hostRosterSize" : "rosterSize").value);

    if (!Number.isInteger(budget) || budget < 1) {

        alert("Budget must be a whole number of at least $1.");
        return null;

    }

    if (!Number.isInteger(rosterSize) || rosterSize < 1) {

        alert("Roster size must be a whole number of at least 1.");
        return null;

    }

    const info = CATEGORIES[category];

    const sportsMode = info.sports
        ? el(prefix ? "hostSportsMode" : "sportsMode").value
        : null;

    return {

        category: category,
        sportsMode: sportsMode,
        file: resolveFile(category, sportsMode),
        budget: budget,
        rosterSize: rosterSize

    };

}


function startLocalGame() {

    const names = [];

    for (let n = 1; n <= localCount; n++) {

        const input = el(`player${n}Name`);

        const name = input.value.trim();

        if (name === "") {

            alert(`Player ${n} needs a name.`);
            input.focus();

            return;

        }

        names.push(name);

    }

    const settings = readSettings(false);

    if (!settings) return;

    localStorage.setItem("auctionSettings", JSON.stringify({

        mode: "local",
        names: names,
        ...settings

    }));

    location.href = "game.html";

}



// =========================
// CREATE A LOBBY
// =========================

async function createLobby() {

    const name = el("hostName").value.trim();

    if (name === "") {

        alert("You need a name.");
        el("hostName").focus();

        return;

    }

    const settings = readSettings(true);

    if (!settings) return;

    const button = el("createLobbyButton");

    button.disabled = true;
    button.textContent = "Creating...";

    try {

        await connect();

        roomCode = await createRoom(settings, name);

        iAmHost = true;

        enterLobby();

    } catch (error) {

        console.error(error);

        alert("Could not create the lobby.\n\n" + error.message);

    } finally {

        button.disabled = false;
        button.textContent = "Create lobby";

    }

}



// =========================
// JOIN A LOBBY
// =========================

async function joinLobby() {

    const code = el("joinCode").value.trim().toUpperCase();

    const name = el("joinName").value.trim();

    if (code.length < 4) {

        alert("Enter the 4 character code.");
        return;

    }

    if (name === "") {

        alert("You need a name.");
        el("joinName").focus();

        return;

    }

    const button = el("joinLobbyButton");

    button.disabled = true;
    button.textContent = "Joining...";

    try {

        await connect();

        await joinRoom(code, name);

        roomCode = code;

        iAmHost = false;

        enterLobby();

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        button.disabled = false;
        button.textContent = "Join lobby";

    }

}



// =========================
// LOBBY
// =========================

function enterLobby() {

    el("lobbyCode").textContent = roomCode;

    show("lobby");

    stopWatching = watchRoom(roomCode, renderLobby);

}


function renderLobby(room) {

    // The host closed the lobby out from under everyone.
    if (!room) {

        alert("The lobby was closed.");

        return exitLobby();

    }

    iAmHost = room.hostUid === myUid();

    const players = playerList(room);

    // Someone kicked us or the seat was lost.
    if (!players.some(p => p.uid === myUid())) {

        alert("You are no longer in this lobby.");

        return exitLobby();

    }

    el("lobbySettings").textContent = describe(room.settings);

    drawSlots(players, room.hostUid);

    const startButton = el("startOnlineButton");

    startButton.style.display = iAmHost ? "block" : "none";

    el("lobbyWaitNote").style.display = iAmHost ? "none" : "block";

    startButton.disabled = players.length < MIN_PLAYERS;

    startButton.textContent =
        players.length < MIN_PLAYERS
            ? "Waiting for one more..."
            : `Start with ${players.length}`;

    // Fills up, starts itself. Only the host writes the change.
    if (iAmHost && room.status === "lobby" && players.length >= MAX_PLAYERS) {

        setStatus(roomCode, "playing");

    }

    if (room.status === "playing") {

        el("lobbyStatus").textContent = "Starting the draft...";

        handoffToGame(room);

    }

}


function drawSlots(players, hostUid) {

    const list = el("lobbySlots");

    list.innerHTML = "";

    for (let seat = 0; seat < MAX_PLAYERS; seat++) {

        const player = players.find(p => p.seat === seat);

        const row = document.createElement("div");

        row.className = "slot" + (player ? " filled" : "");

        if (player) {

            row.innerHTML = `
                <span class="slot-name">${escapeHTML(player.name)}</span>
                <span class="slot-tags">
                    ${player.uid === hostUid ? `<span class="slot-tag host">Host</span>` : ""}
                    ${player.uid === myUid() ? `<span class="slot-tag you">You</span>` : ""}
                </span>`;

        } else {

            row.innerHTML = `<span class="slot-empty">Open seat</span>`;

        }

        list.appendChild(row);

    }

}


function describe(settings) {

    const bits = [settings.category];

    if (settings.sportsMode) {

        bits.push(settings.sportsMode === "current" ? "Current" : "All-Time");

    }

    bits.push(`$${settings.budget}`);

    bits.push(`${settings.rosterSize} spots`);

    return bits.join("  ·  ");

}


async function startOnlineGame() {

    el("startOnlineButton").disabled = true;

    await setStatus(roomCode, "playing");

}


// Everyone lands here the moment the host starts. Each device saves
// who it is, then goes to the game screen.

function handoffToGame(room) {

    if (stopWatching) {

        stopWatching();
        stopWatching = null;

    }

    localStorage.setItem("auctionSettings", JSON.stringify({

        mode: "online",
        code: roomCode,
        uid: myUid(),
        isHost: iAmHost,
        names: playerList(room).map(p => p.name),
        ...room.settings

    }));

    el("lobbyStatus").textContent = "Starting...";

    // Keeps ?mock=1 on the address when testing offline.
    location.href = "game.html" + location.search;

}


async function leaveLobby() {

    try {

        await leaveRoom(roomCode);

    } catch (error) {

        console.error(error);

    }

    exitLobby();

}


function exitLobby() {

    if (stopWatching) {

        stopWatching();
        stopWatching = null;

    }

    roomCode = null;
    iAmHost = false;

    el("lobbyStatus").textContent = "";

    show("menu");

}


function copyCode() {

    if (!roomCode) return;

    navigator.clipboard
        ?.writeText(roomCode)
        .then(() => {

            const button = el("copyCodeButton");

            button.textContent = "Copied";

            setTimeout(() => (button.textContent = "Copy"), 1200);

        })
        .catch(() => {});

}


function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}


// net.js uses a top-level await, which means this module can finish
// evaluating AFTER DOMContentLoaded has already fired. Listening for
// that event alone would silently never run init().

if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", init);

} else {

    init();

}