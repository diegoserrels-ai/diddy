// =========================
// AUCTION DRAFT DEBATE
// SOUND
// =========================

const bidSound = new Audio("assets/bid.mp3");
const soldSound = new Audio("assets/sold.mp3");

bidSound.volume = 0.40;
soldSound.volume = 0.45;

bidSound.preload = "auto";
soldSound.preload = "auto";


function play(sound) {

    try {

        sound.currentTime = 0;

        // Phones block audio until the user taps something,
        // so a failed play is normal and safe to ignore.
        sound.play().catch(() => {});

    } catch (error) {

        // Missing or unsupported file. Not worth breaking the game over.

    }

}


export function playBidSound() {
    play(bidSound);
}


export function playSoldSound() {
    play(soldSound);
}