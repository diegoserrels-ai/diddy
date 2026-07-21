const bidSound = new Audio("assets/bid.mp3");
const soldSound = new Audio("assets/sold.mp3");

bidSound.volume = 0.40;
soldSound.volume = 0.45;

function play(sound) {

    sound.currentTime = 0;

    sound.play().catch(() => {
        // Ignore playback errors
    });

}

export function playBidSound() {
    play(bidSound);
}

export function playSoldSound() {
    play(soldSound);
}