// =========================
// AUCTION DRAFT DEBATE
// DATA LOADER
// VERSION 2.0
// =========================
//
// The setup screen already worked out which JSON file to use
// and saved it as settings.file, so this file just loads it.
// Adding a new category only means editing js/settings.js.

import { game } from "./gameState.js";



// =========================
// LOAD JSON
// =========================

async function loadJSON(file) {

    const response = await fetch(`data/${file}`);

    if (!response.ok) {

        throw new Error(`Could not load data/${file}`);

    }

    return await response.json();

}



// =========================
// CLEAN UP THE LIST
// =========================

// Accepts either ["Hello - Adele", ...]
// or [{ name: "Hello - Adele" }, ...]

function normalize(data) {

    return data.map((item, index) => {

        if (typeof item === "string") {

            return { id: index + 1, name: item };

        }

        return { id: item.id ?? index + 1, ...item };

    });

}


function removeDuplicates(items) {

    const seen = new Set();

    return items.filter(item => {

        const key = String(item.name).trim().toLowerCase();

        if (seen.has(key)) return false;

        seen.add(key);

        return true;

    });

}


function shuffle(items) {

    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [copy[i], copy[j]] = [copy[j], copy[i]];

    }

    return copy;

}



// =========================
// BUILD THE DECK
// =========================

export async function loadAuctionDeck() {

    const file = game.settings.file;

    if (!file) {

        throw new Error("No category file was saved on the setup screen.");

    }

    const raw = await loadJSON(file);

    game.auction.deck = shuffle(removeDuplicates(normalize(raw)));

    console.log(`Loaded ${game.auction.deck.length} items from ${file}`);

    return game.auction.deck.length;

}



// =========================
// NEXT ITEM
// =========================

export function drawNextItem() {

    if (game.auction.deck.length === 0) {

        return null;

    }

    return game.auction.deck.shift();

}