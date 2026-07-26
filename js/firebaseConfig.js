// =========================
// FIREBASE CONFIG
// =========================
//
// This is safe to have in a public repo. Firebase web configs are
// meant to be visible in page source. Your protection comes from the
// database rules in the Firebase console, not from hiding this.

export const firebaseConfig = {
    apiKey: "AIzaSyCdnbgKv5NO_hm0XaX5OdIIRIVUFsEzgcs",
    authDomain: "auction-draft-debate.firebaseapp.com",
    databaseURL: "https://auction-draft-debate-default-rtdb.firebaseio.com",
    projectId: "auction-draft-debate",
    storageBucket: "auction-draft-debate.firebasestorage.app",
    messagingSenderId: "904186438839",
    appId: "1:904186438839:web:c803090dd1a01edb109932"
};

// Highest player count a room accepts. The lobby starts on its own
// when this many people have joined.
export const MAX_PLAYERS = 4;

// Fewest players the host can start with.
export const MIN_PLAYERS = 2;