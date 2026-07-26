// =========================
// AUCTION DRAFT DEBATE
// NETWORK
// =========================
//
// Picks which transport to use and re-exports it. Everything else in
// the game imports from here, so nothing outside this file cares
// whether the room lives in Firebase or in localStorage.
//
//   normal:      rooms live in Firebase
//   ?mock=1:     rooms live in this browser only, for testing

const useMock =
    new URLSearchParams(location.search).get("mock") === "1";

const transport = useMock
    ? await import("./netMock.js")
    : await import("./netFirebase.js");


export const isMock = useMock;

export const connect = transport.connect;
export const myUid = transport.myUid;
export const createRoom = transport.createRoom;
export const joinRoom = transport.joinRoom;
export const watchRoom = transport.watchRoom;
export const setStatus = transport.setStatus;
export const leaveRoom = transport.leaveRoom;
export const keepSeatOnDisconnect = transport.keepSeatOnDisconnect;


// Players sorted into seat order. Seat 0 is the host.

export function playerList(room) {

    if (!room || !room.players) return [];

    return Object.entries(room.players)
        .map(([uid, p]) => ({ uid, ...p }))
        .sort((a, b) => a.seat - b.seat);

}