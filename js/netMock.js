// =========================
// AUCTION DRAFT DEBATE
// MOCK TRANSPORT
// =========================
//
// A stand in for Firebase that keeps rooms in localStorage, so two
// tabs on the same computer can share one. Nothing leaves the machine.
//
// Add ?mock=1 to the address to use it. Handy for trying lobby
// changes without touching the real database.

import { MAX_PLAYERS } from "./firebaseConfig.js";


const KEY = code => `mockRoom:${code}`;

let uid = null;

const channel =
    typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("auctionMock")
        : null;


export async function connect() {

    if (uid) return uid;

    // One id per tab, so two tabs act like two different phones.
    uid = sessionStorage.getItem("mockUid");

    if (!uid) {

        uid = "u" + Math.random().toString(36).slice(2, 10);

        sessionStorage.setItem("mockUid", uid);

    }

    return uid;

}


export function myUid() {
    return uid;
}


function readRoom(code) {

    const raw = localStorage.getItem(KEY(code));

    return raw ? JSON.parse(raw) : null;

}


function writeRoom(code, room) {

    localStorage.setItem(KEY(code), JSON.stringify(room));

    if (channel) channel.postMessage({ code: code });

}



export async function createRoom(settings, hostName) {

    await connect();

    let code;

    do {
        code = makeCode();
    } while (readRoom(code));

    writeRoom(code, {

        hostUid: uid,
        status: "lobby",
        createdAt: Date.now(),
        settings: settings,

        players: {
            [uid]: { name: hostName, seat: 0, joinedAt: Date.now() }
        }

    });

    return code;

}


export async function joinRoom(code, name) {

    await connect();

    const room = readRoom(code);

    if (!room) throw new Error("No lobby with that code.");

    if (room.status !== "lobby") throw new Error("That game has already started.");

    room.players = room.players || {};

    if (!room.players[uid]) {

        const taken = Object.values(room.players).map(p => p.seat);

        if (taken.length >= MAX_PLAYERS) throw new Error("That lobby is full.");

        let seat = 0;
        while (taken.includes(seat)) seat++;

        room.players[uid] = { name: name, seat: seat, joinedAt: Date.now() };

        writeRoom(code, room);

    }

    return room.players[uid].seat;

}


export function watchRoom(code, callback) {

    let last = null;

    const push = () => {

        const room = readRoom(code);

        const json = JSON.stringify(room);

        if (json === last) return;

        last = json;

        callback(room);

    };

    push();

    // storage events cover other tabs, the interval covers this one.
    const onStorage = event => {
        if (!event.key || event.key === KEY(code)) push();
    };

    window.addEventListener("storage", onStorage);

    const onMessage = event => {
        if (event.data && event.data.code === code) push();
    };

    if (channel) channel.addEventListener("message", onMessage);

    const timer = setInterval(push, 250);

    return () => {

        window.removeEventListener("storage", onStorage);

        if (channel) channel.removeEventListener("message", onMessage);

        clearInterval(timer);

    };

}


export async function setStatus(code, status) {

    const room = readRoom(code);

    if (!room) return;

    room.status = status;

    writeRoom(code, room);

}


export async function leaveRoom(code) {

    const room = readRoom(code);

    if (!room || !room.players) return;

    delete room.players[uid];

    writeRoom(code, room);

}


export async function keepSeatOnDisconnect() {
    // Nothing to do without a real connection to watch.
}


const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {

    let code = "";

    for (let i = 0; i < 4; i++) {

        code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];

    }

    return code;

}