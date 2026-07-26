// =========================
// CATEGORY LIST
// =========================
//
// One place for every category. To add one, add a line here.
// "file" must match the filename in your data/ folder exactly,
// capital letters included.

export const CATEGORIES = {

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


// Works out which JSON file a category + era combination needs.

export function resolveFile(category, sportsMode) {

    const info = CATEGORIES[category];

    if (!info) throw new Error(`Unknown category: ${category}`);

    if (!info.sports) return info.file;

    return sportsMode === "current" ? info.current : info.allTime;

}