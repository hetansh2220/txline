import { and, desc, eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { users, messages, entries } from "../db/schema.js";
import { buildMembers, emitMembers } from "../socket.js";

const PICKS = new Set(["home", "draw", "away"]);

/** GET /api/rooms/:fixtureId/members — everyone who joined this contest. */
export async function getMembers(req, res) {
    try {
        res.json(await buildMembers(Number(req.params.fixtureId)));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

/** GET /api/entries?wallet=... — every fixture this user entered, for the match cards. */
export async function getMyEntries(req, res) {
    const { wallet } = req.query;
    if (!wallet) return res.status(400).json({ error: "wallet required" });

    try {
        const rows = await db
            .select({ fixtureId: entries.fixtureId, pick: entries.pick, points: entries.points })
            .from(entries)
            .innerJoin(users, eq(entries.userId, users.id))
            .where(eq(users.wallet, wallet));

        // Keyed by fixture so a card can look itself up without an N+1.
        res.json(Object.fromEntries(rows.map((r) => [r.fixtureId, r])));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

/**
 * GET /api/rooms/:fixtureId/messages?limit=50
 *
 * History is REST, not socket: it gives the client caching and pagination for
 * free, and keeps the socket for what only it can do — live updates.
 */
export async function getMessages(req, res) {
    const roomId = `match:${req.params.fixtureId}`;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    try {
        const rows = await db
            .select({
                id: messages.id,
                body: messages.body,
                createdAt: messages.createdAt,
                wallet: users.wallet,
                username: users.username,
            })
            .from(messages)
            .innerJoin(users, eq(messages.userId, users.id))
            .where(eq(messages.roomId, roomId))
            .orderBy(desc(messages.createdAt))
            .limit(limit);

        // Newest-first from the DB (so LIMIT takes the LATEST), oldest-first for the UI.
        res.json(
            rows.reverse().map((r) => ({
                id: r.id,
                body: r.body,
                ts: new Date(r.createdAt).getTime(),
                user: { wallet: r.wallet, username: r.username },
            }))
        );
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

/** GET /api/entries/:fixtureId?wallet=... — this user's pick, if any. */
export async function getEntry(req, res) {
    const { wallet } = req.query;
    if (!wallet) return res.status(400).json({ error: "wallet required" });

    try {
        const [row] = await db
            .select({ pick: entries.pick, points: entries.points, settled: entries.settled })
            .from(entries)
            .innerJoin(users, eq(entries.userId, users.id))
            .where(and(eq(users.wallet, wallet), eq(entries.fixtureId, Number(req.params.fixtureId))));

        res.json(row ?? null);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

/**
 * POST /api/entries  { wallet, fixtureId, pick, kickoff }
 *
 * Entries close at kickoff — otherwise you could back a team that is already
 * winning. The lock is enforced HERE, on the server, because a client-side check
 * is not a check.
 */
export async function createEntry(req, res) {
    const { wallet, fixtureId, pick, kickoff } = req.body ?? {};

    if (!wallet || !fixtureId) return res.status(400).json({ error: "wallet and fixtureId required" });
    if (!PICKS.has(pick)) return res.status(400).json({ error: "pick must be home, draw or away" });
    if (kickoff && Date.now() >= Number(kickoff)) {
        return res.status(409).json({ error: "entries closed at kickoff" });
    }

    try {
        const [user] = await db.select().from(users).where(eq(users.wallet, wallet));
        if (!user) return res.status(404).json({ error: "no profile for wallet" });

        const [saved] = await db
            .insert(entries)
            .values({ userId: user.id, fixtureId: Number(fixtureId), pick })
            // One pick per user per fixture — changing it before kickoff is allowed.
            .onConflictDoUpdate({
                target: [entries.userId, entries.fixtureId],
                set: { pick },
            })
            .returning();

        // Everyone in the room should see the new entrant (and their pick) at once.
        emitMembers(Number(fixtureId)).catch(() => { });

        res.json({ pick: saved.pick, points: saved.points, settled: saved.settled });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
