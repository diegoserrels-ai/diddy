// =========================
// AUCTION DRAFT DEBATE
// NETWORK
// =========================
//
// Picks a transport and forwards everything to it, so nothing else in
// the game cares whether a room lives in Firebase or in localStorage.
//
//   normal:   rooms live in Firebase
//   ?mock=1:  rooms live in this browser only, for testing
//
// The transport is loaded the first time somebody actually goes
// online. That matters: if Firebase is blocked, slow, or the phone has
// no signal, playing on one device still has to work.

const useMock =
    new URLSearchParams(location.search).get("mock") === "1";

export const isMock = useMock;


let loaded = null;
let loading = null;


function load() {

    if (loaded) return Promise.resolve(loaded);

    if (!loading) {

        loading = (useMock
            ? import("./netMock.js")
            : import("./netFirebase.js")
        ).then(module => (loaded = module));

    }

    return loading;

}


export async function connect() {
    return (await load()).connect();
}

export function myUid() {
    return loaded ? loaded.myUid() : null;
}

export async function createRoom(settings, hostName) {
    return (await load()).createRoom(settings, hostName);
}

export async function joinRoom(code, name) {
    return (await load()).joinRoom(code, name);
}

export async function setStatus(code, status) {
    return (await load()).setStatus(code, status);
}

export async function leaveRoom(code) {
    return (await load()).leaveRoom(code);
}

export async function keepSeatOnDisconnect(code) {
    return (await load()).keepSeatOnDisconnect(code);
}

export async function rejoin(code, name, seat) {
    return (await load()).rejoin(code, name, seat);
}

export async function publishState(code, state) {
    return (await load()).publishState(code, state);
}

export async function sendAction(code, action) {
    return (await load()).sendAction(code, action);
}

export async function clearActions(code) {
    return (await load()).clearActions(code);
}


// These hand back a stop function straight away, before the transport
// has finished loading, so callers do not have to await them.

function deferredWatch(method, code, callback) {

    let stop = null;
    let cancelled = false;

    load().then(module => {

        if (cancelled) return;

        stop = module[method](code, callback);

    });

    return () => {

        cancelled = true;

        if (stop) stop();

    };

}


export function watchRoom(code, callback) {
    return deferredWatch("watchRoom", code, callback);
}

export function watchActions(code, callback) {
    return deferredWatch("watchActions", code, callback);
}


// Players in seat order. Seat 0 is the host.

export function playerList(room) {

    if (!room || !room.players) return [];

    return Object.entries(room.players)
        .map(([uid, p]) => ({ uid, ...p }))
        .sort((a, b) => a.seat - b.seat);

}