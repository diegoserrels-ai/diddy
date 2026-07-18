// =========================
// AUCTION DEBATE GAME
// DATA LOADER
// VERSION 1.0
// =========================

import { game } from "./gameState.js";



// =========================
// REMOVE DUPLICATES
// =========================

function removeDuplicates(array) {

    const seen = new Set();

    return array.filter(item => {

        const name =
            typeof item === "string"
                ? item
                : item.name;

        if (seen.has(name)) {
            return false;
        }

        seen.add(name);
        return true;

    });

}



// =========================
// SHUFFLE
// =========================

function shuffle(array) {

    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
        [shuffled[j], shuffled[i]];

    }

    return shuffled;

}



// =========================
// LOAD JSON
// =========================

async function loadJSON(file) {

    try {

        const response =
        await fetch(`data/${file}`);

        if (!response.ok) {

            throw new Error(
                `Unable to load ${file}`
            );

        }

        return await response.json();

    }

    catch (error) {

        console.error(error);

        return [];

    }

}



// =========================
// CATEGORY FILE
// =========================

function getFileName() {

    const s = game.settings;

    switch (s.category) {

        case "Athletes":

            return s.sportsMode === "current"
                ? "athletesCurrent.json"
                : "athletesAllTime.json";

        case "MLB Players":

            return s.sportsMode === "current"
                ? "mlbCurrent.json"
                : "mlbAllTime.json";

        case "NFL Players":

            return s.sportsMode === "current"
                ? "nflCurrent.json"
                : "nflAllTime.json";

        case "Songs":
            return "songs.json";

        case "Ye Songs":
            return "yeSongs.json";

        case "Movies":
            return "movies.json";

        case "Music Artists":
            return "musicArtists.json";

        case "Fast Food Chains":
            return "fastFood.json";

        case "Food Items":
            return "foodItems.json";

        case "Alcohol":
            return "alcohol.json";

                case "Actors":
            return "actors.json";

        case "Candy":
            return "Candy.json";

        case "Characters":
            return "characters.json";

        case "Chips":
            return "chips.json";

        case "Clothing Brands":
            return "clothingbrands.json";

        case "Ice Cream":
            return "icecream.json";

        case "Memes":
            return "memes.json";

        case "Soft Drinks":
            return "SoftDrinks.json";    

        case "Vacation Spots":
            return "vacationSpots.json";

        default:

            throw new Error(
                `Unknown category: ${s.category}`
            );

    }

}



// =========================
// NORMALIZE DATA
// =========================

function normalizeItems(data) {

    return data.map((item, index) => {

        if (typeof item === "string") {

            return {

                id: index + 1,

                name: item

            };

        }

        return {

            id: item.id ?? index + 1,

            ...item

        };

    });

}



// =========================
// LOAD AUCTION DECK
// =========================

export async function loadAuctionDeck() {

    const file = getFileName();

    let data =
    await loadJSON(file);

    data =
    normalizeItems(data);

    data =
    removeDuplicates(data);

    data =
    shuffle(data);

    game.auction.deck = data;

    console.log(
        `Loaded ${game.auction.deck.length} auction items`
    );

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