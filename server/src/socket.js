import { Server } from "socket.io";
import { eq } from "drizzle-orm";
import { db } from "./config/db.js";
import { users, messages, entries } from "./db/schema.js";

const MAX_BODY = 500;
const RATE_LIMIT = 5; // messages...
const RATE_WINDOW = 5000; // ...per 5s, per socket

export const roomIdFor = (fixtureId) => `match:${fixtureId}`;
const fixtureOf = (roomId) => Number(roomId.split(":")[1]);

/**
 * Who is CONNECTED right now: roomId -> Set(userId). This is presence only.
 *
 * Membership of a room is a different thing entirely, and lives in the `entries`
 * table: joining a contest is durable, so navigating away must not remove you.
 * Presence merely decides whether your dot is green.
 */
const online = new Map();

function connect(roomId, userId) {
    if (!online.has(roomId)) online.set(roomId, new Set());
    online.get(roomId).add(userId);
}

function disconnect(roomId, userId) {
    const room = online.get(roomId);
    if (!room) return;
    room.delete(userId);
    if (room.size === 0) online.delete(roomId);
}

/**
 * The room's people: everyone who entered the contest (from the DB) plus anyone
 * currently connected who hasn't entered — each flagged online/offline and
 * carrying their pick.
 */
export async function buildMembers(fixtureId) {
    const roomId = roomIdFor(fixtureId);
    const connected = online.get(roomId) ?? new Set();

    const entrants = await db
        .select({
            id: users.id,
            wallet: users.wallet,
            username: users.username,
            points: users.points,
            pick: entries.pick,
        })
        .from(entries)
        .innerJoin(users, eq(entries.userId, users.id))
        .where(eq(entries.fixtureId, Number(fixtureId)));

    const members = entrants.map((e) => ({
        wallet: e.wallet,
        username: e.username,
        points: e.points ?? 0,
        pick: e.pick,
        online: connected.has(e.id),
    }));

    // Lurkers: connected, chatting, but no entry yet.
    const entered = new Set(entrants.map((e) => e.id));
    const lurkers = [...connected].filter((id) => !entered.has(id));

    if (lurkers.length) {
        const rows = await db.select().from(users);
        for (const u of rows.filter((u) => lurkers.includes(u.id))) {
            members.push({
                wallet: u.wallet,
                username: u.username,
                points: u.points ?? 0,
                pick: undefined,
                online: true,
            });
        }
    }

    return members;
}

let ioRef = null;

/** Push a fresh member list to a room — used by the socket AND by the entries API. */
export async function emitMembers(fixtureId) {
    if (!ioRef) return;
    const members = await buildMembers(fixtureId);
    ioRef.to(roomIdFor(fixtureId)).emit("room:members", { members });
}

export function attachSocket(server) {
    const io = new Server(server, {
        cors: { origin: process.env.FRONTEND_ORIGIN ?? true },
    });
    ioRef = io;

    /**
     * Handshake auth. The client sends its wallet; we resolve it to a real user
     * row and pin that on the socket. Every message is then attributed from
     * socket.data — NEVER from anything the client sends later, or one user could
     * post as another.
     *
     * NOTE: this trusts the claimed wallet. Production should have the client
     * sign a nonce (wallet-adapter signMessage) and verify it here with
     * tweetnacl before looking the user up.
     */
    io.use(async (socket, next) => {
        const wallet = socket.handshake.auth?.wallet;
        if (!wallet) return next(new Error("wallet required"));

        try {
            const [user] = await db.select().from(users).where(eq(users.wallet, wallet));
            if (!user) return next(new Error("no profile for wallet"));

            socket.data.user = {
                id: user.id,
                wallet: user.wallet,
                username: user.username,
                points: user.points ?? 0,
            };
            next();
        } catch (e) {
            next(new Error(e.message));
        }
    });

    io.on("connection", (socket) => {
        const user = socket.data.user;
        socket.data.sent = [];

        socket.on("room:join", async ({ fixtureId } = {}) => {
            if (!fixtureId) return;
            const roomId = roomIdFor(fixtureId);

            socket.join(roomId);
            socket.data.roomId = roomId;
            connect(roomId, user.id);

            await emitMembers(fixtureId);
        });

        socket.on("room:leave", async () => {
            const roomId = socket.data.roomId;
            if (!roomId) return;

            socket.leave(roomId);
            disconnect(roomId, user.id);
            socket.data.roomId = undefined;

            await emitMembers(fixtureOf(roomId));
        });

        socket.on("message:send", async ({ body, clientId } = {}) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;

            const text = String(body ?? "").trim().slice(0, MAX_BODY);
            if (!text) return;

            // Rate limit: drop the flood rather than letting one socket own the room.
            const now = Date.now();
            socket.data.sent = socket.data.sent.filter((t) => now - t < RATE_WINDOW);
            if (socket.data.sent.length >= RATE_LIMIT) {
                socket.emit("message:rejected", { clientId, reason: "Slow down." });
                return;
            }
            socket.data.sent.push(now);

            try {
                const [saved] = await db
                    .insert(messages)
                    .values({ roomId, userId: user.id, body: text })
                    .returning();

                io.to(roomId).emit("message:new", {
                    id: saved.id,
                    // Echo the sender's temp id so they can reconcile their optimistic copy.
                    clientId,
                    body: saved.body,
                    ts: new Date(saved.createdAt).getTime(),
                    user: { wallet: user.wallet, username: user.username },
                });
            } catch (e) {
                socket.emit("message:rejected", { clientId, reason: e.message });
            }
        });

        socket.on("disconnect", async () => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            disconnect(roomId, user.id);
            await emitMembers(fixtureOf(roomId));
        });
    });

    return io;
}
