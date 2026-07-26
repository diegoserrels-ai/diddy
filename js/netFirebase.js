// =========================
// AUCTION DRAFT DEBATE
// FIREBASE TRANSPORT
// =========================
//
// Everything that talks to Firebase lives in this one file.
// js/netMock.js implements the same handful of functions using
// localStorage, so the rest of the game never knows which is running.

import { initializeApp }
    from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import { getAuth, signInAnonymously, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getDatabase, ref, get, set, update, remove, push,
    onValue, onChildAdded, onDisconnect, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

import { firebaseConfig, MAX_PLAYERS } from "./firebaseConfig.js";


let db = null;
let uid = null;


// =========================
// SIGN IN
// =========================
//
// Anonymous sign in. Nobody makes an account. Firebase just hands
// this browser an id so the database rules can tell devices apart.

export async function connect() {

    if (uid) return uid;

    const app = initializeApp(firebaseConfig);

    db = getDatabase(app);

    const auth = getAuth(app);

    await signInAnonymously(auth);

    uid = await new Promise((resolve, reject) => {

        const stop = onAuthStateChanged(
            auth,
            user => {
                if (!user) return;
                stop();
                resolve(user.uid);
            },
            error => reject(error)
        );

    });

    return uid;

}


export function myUid() {
    return uid;
}


function roomRef(code, path = "") {
    return ref(db, `rooms/${code}${path}`);
}



// =========================
// CREATE A ROOM
// =========================

export async function createRoom(settings, hostName) {

    await connect();

    // Try codes until we land on one nobody is using.
    for (let attempt = 0; attempt < 12; attempt++) {

        const code = makeCode();

        const created = await runTransaction(roomRef(code), current => {

            // Somebody already has this code, so back off and retry.
            if (current !== null) return;

            return {

                hostUid: uid,
                status: "lobby",
                createdAt: serverTimestamp(),
                settings: settings,

                players: {
                    [uid]: { name: hostName, seat: 0, joinedAt: serverTimestamp() }
                }

            };

        });

        if (created.committed) {

            watchMyConnection(code);

            return code;

        }

    }

    throw new Error("Could not find a free room code. Try again.");

}



// =========================
// JOIN A ROOM
// =========================
//
// The seat is picked inside a transaction so two people tapping Join
// at the same moment can't land on the same seat.

export async function joinRoom(code, name) {

    await connect();

    const snapshot = await get(roomRef(code));

    if (!snapshot.exists()) {

        throw new Error("No lobby with that code.");

    }

    if (snapshot.val().status !== "lobby") {

        throw new Error("That game has already started.");

    }

    const result = await runTransaction(roomRef(code, "/players"), players => {

        players = players || {};

        // Rejoining after a reload keeps the seat you had.
        if (players[uid]) return players;

        const taken = Object.values(players).map(p => p.seat);

        if (taken.length >= MAX_PLAYERS) return;

        let seat = 0;
        while (taken.includes(seat)) seat++;

        players[uid] = { name: name, seat: seat, joinedAt: Date.now() };

        return players;

    });

    if (!result.committed) {

        throw new Error("That lobby is full.");

    }

    watchMyConnection(code);

    return result.snapshot.val()[uid].seat;

}



// =========================
// WATCH A ROOM
// =========================
//
// Fires straight away with the current room, then again on every
// change anyone makes. Returns a function that stops listening.

export function watchRoom(code, callback) {

    return onValue(roomRef(code), snapshot => {

        callback(snapshot.exists() ? snapshot.val() : null);

    });

}



// =========================
// SMALL WRITES
// =========================

export async function setStatus(code, status) {

    await update(roomRef(code), { status: status });

}


export async function leaveRoom(code) {

    await remove(roomRef(code, `/players/${uid}`));

}


// Drops you out of the player list if you close the tab or lose
// signal while still sitting in the lobby.

function watchMyConnection(code) {

    onDisconnect(roomRef(code, `/players/${uid}`)).remove();

}


// Once the draft is running, a dropped connection should not delete
// you, or your roster would vanish mid game.

export async function keepSeatOnDisconnect(code) {

    await onDisconnect(roomRef(code, `/players/${uid}`)).cancel();

}



// =========================
// ROOM CODES
// =========================
//
// No I, O, 0 or 1, so nobody mistypes a code read out loud.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {

    let code = "";

    for (let i = 0; i < 4; i++) {

        code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];

    }

    return code;

}


// =========================
// GAME STATE CHANNEL
// =========================
//
// Only the host writes here. Everyone else reads it and draws
// whatever it says.

export async function publishState(code, state) {

    await set(roomRef(code, "/state"), state);

}


// =========================
// ACTION CHANNEL
// =========================
//
// Players push what they want to do. The host reads each one,
// applies it, and deletes it. Pushing gives every action its own
// key, so two people acting at once cannot overwrite each other.

export async function sendAction(code, action) {

    await push(roomRef(code, "/actions"), action);

}


export function watchActions(code, callback) {

    return onChildAdded(roomRef(code, "/actions"), snapshot => {

        const action = snapshot.val();

        remove(snapshot.ref);

        callback(action);

    });

}


export async function clearActions(code) {

    await remove(roomRef(code, "/actions"));

}