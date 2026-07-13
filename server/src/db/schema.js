
import { pgTable, uuid, varchar, text, timestamp, integer, boolean, index, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    wallet: varchar("wallet", { length: 44 }).notNull().unique(),
    username: varchar("username", { length: 32 }).unique(),
    bio: text("bio"),
    avatar: varchar("avatar", { length: 255 }),
    points: integer("points").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Chat messages. roomId is "match:<fixtureId>" — the fixture IS the room, so
 * there's no rooms table to keep in sync.
 */
export const messages = pgTable(
    "messages",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        roomId: varchar("room_id", { length: 64 }).notNull(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        body: varchar("body", { length: 500 }).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    // The only query we run: newest messages in a room.
    (t) => [index("messages_room_created_idx").on(t.roomId, t.createdAt)]
);

/** A contest entry — one pick per user per fixture, locked at kickoff. */
export const entries = pgTable(
    "entries",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        fixtureId: integer("fixture_id").notNull(),
        pick: varchar("pick", { length: 8 }).notNull(), // home | draw | away
        points: integer("points").default(0).notNull(),
        settled: boolean("settled").default(false).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => [unique("entries_user_fixture_uniq").on(t.userId, t.fixtureId)]
);
