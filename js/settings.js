// =========================
// AUCTION DRAFT DEBATE
// SETUP SCREEN
// VERSION 3.0
// =========================
//
// To add a new category: add one line to CATEGORIES below.
// The "file" value must match the filename inside your data/ folder,
// including capital letters.


const CATEGORIES = {

    "Songs":            { file: "songs.json" },
    "Ye Songs":         { file: "yeSongs.json" },
    "Movies":           { file: "movies.json" },
    "Music Artists":    { file: "musicArtists.json" },
    "Actors":           { file: "actors.json" },
    "Characters":       { file: "characters.json" },
    "Memes":            { file: "memes.json" },

    "Athletes":         { sports: true, current: "athletesCurrent.json", allTime: "athletesAllTime.json" },
    "MLB Players":      { sports: true, current: "mlbCurrent.json",      allTime: "mlbAllTime.json" },
    "NFL Players":      { sports: true, current: "nflCurrent.json",      allTime: "nflAllTime.json" },

    "Fast Food Chains": { file: "fastFood.json" },
    "Food Items":       { file: "foodItems.json" },
    "Candy":            { file: "Candy.json" },
    "Chips":            { file: "chips.json" },
    "Ice Cream":        { file: "icecream.json" },
    "Soft Drinks":      { file: "SoftDrinks.json" },
    "Alcohol":          { file: "alcohol.json" },

    "Clothing Brands":  { file: "clothingbrands.json" },
    "Vacation Spots":   { file: "vacationSpots.json" }

};


const MAX_PLAYERS = 4;

let playerCount = 2;



// =========================
// BUILD THE SCREEN
// =========================

function init() {

    buildCategoryList();
    buildPlayerCountButtons();
    showPlayerFields();

    document
        .getElementById("category")
        .addEventListener("change", categoryChanged);

    document
        .getElementById("startButton")
        .addEventListener("click", startGame);

    categoryChanged();

}


function buildCategoryList() {

    const dropdown = document.getElementById("category");

    dropdown.innerHTML = "";

    Object.keys(CATEGORIES).forEach(name => {

        const option = document.createElement("option");

        option.value = name;
        option.textContent = name;

        dropdown.appendChild(option);

    });

}


function buildPlayerCountButtons() {

    const row = document.getElementById("playerCount");

    row.innerHTML = "";

    for (let n = 2; n <= MAX_PLAYERS; n++) {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "seg-button" + (n === playerCount ? " selected" : "");
        button.textContent = n;

        button.addEventListener("click", () => {

            playerCount = n;

            buildPlayerCountButtons();
            showPlayerFields();

        });

        row.appendChild(button);

    }

}


// Only show as many name boxes as there are players.

function showPlayerFields() {

    for (let n = 1; n <= MAX_PLAYERS; n++) {

        const field = document.getElementById(`playerField${n}`);

        field.style.display = n <= playerCount ? "flex" : "none";

    }

}


// The current / all-time picker only applies to sports categories.

function categoryChanged() {

    const selected = document.getElementById("category").value;

    const sportsBox = document.getElementById("sportsModeContainer");

    sportsBox.style.display =
        CATEGORIES[selected] && CATEGORIES[selected].sports
            ? "flex"
            : "none";

}



// =========================
// START
// =========================

function startGame() {

    const names = [];

    for (let n = 1; n <= playerCount; n++) {

        const input = document.getElementById(`player${n}Name`);

        const name = input.value.trim();

        if (name === "") {

            alert(`Player ${n} needs a name.`);
            input.focus();

            return;

        }

        names.push(name);

    }

    const category = document.getElementById("category").value;

    const budget = Number(document.getElementById("budget").value);

    const rosterSize = Number(document.getElementById("rosterSize").value);

    if (!Number.isInteger(budget) || budget < 1) {

        alert("Budget must be a whole number of at least $1.");

        return;

    }

    if (!Number.isInteger(rosterSize) || rosterSize < 1) {

        alert("Roster size must be a whole number of at least 1.");

        return;

    }

    const info = CATEGORIES[category];

    let sportsMode = null;
    let file = info.file;

    if (info.sports) {

        sportsMode = document.getElementById("sportsMode").value;

        file = sportsMode === "current" ? info.current : info.allTime;

    }

    const settings = {

        names: names,
        category: category,
        sportsMode: sportsMode,
        file: file,
        budget: budget,
        rosterSize: rosterSize

    };

    localStorage.setItem("auctionSettings", JSON.stringify(settings));

    window.location.href = "game.html";

}


document.addEventListener("DOMContentLoaded", init);