/**
 * One-shot migration: update all settled entries that awarded the old 15 points
 * to the new 150 value, and adjust each user's lifetime total by the difference.
 *
 * Run with:  node server/scripts/migrate-points.js
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../src/db/schema.js';

const db = drizzle(process.env.DATABASE_URL, { schema });

const OLD = 15;
const NEW = 150;
const DIFF = NEW - OLD; // 135

async function migrate() {
    // Find all entries that were settled with the old 15-point value.
    const rows = await db
        .select({ id: schema.entries.id, userId: schema.entries.userId, points: schema.entries.points })
        .from(schema.entries)
        .where(and(eq(schema.entries.settled, true), eq(schema.entries.points, OLD)));

    console.log(`Found ${rows.length} entries to migrate (${OLD} → ${NEW})`);

    for (const row of rows) {
        // Update the entry's points
        await db
            .update(schema.entries)
            .set({ points: NEW })
            .where(eq(schema.entries.id, row.id));

        // Add the difference to the user's lifetime points
        await db
            .update(schema.users)
            .set({ points: sql`${schema.users.points} + ${DIFF}` })
            .where(eq(schema.users.id, row.userId));

        console.log(`  ✓ entry ${row.id} → ${NEW} pts, user ${row.userId} +${DIFF}`);
    }

    console.log(`\nDone. ${rows.length} entries migrated.`);
}

migrate().catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
});
