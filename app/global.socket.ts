import type { Server } from "socket.io";

declare global {
    // eslint-disable-next-line no-var
    var __io: Server | undefined;
}

/**
 * Singleton access to the Socket.io server instance.
 * Helps prevent multiple instances during development HMR.
 */
export function setIo(io: Server) {
    global.__io = io;
}

export function getIo() {
    return global.__io;
}
