"use client";

import { useQuery } from "@tanstack/react-query";
import { useTxlineCreds, type TxlineCreds } from "@/lib/txline/creds";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Pick = "home" | "draw" | "away";

export interface ContestEntry {
    wallet: string;
    username: string;
    pick: Pick;
    /** Points from THIS match. */
    points: number;
    settled: boolean;
    /** Lifetime points. */
    total: number;
}

export interface Contest {
    settled: boolean;
    score?: { home: number; away: number; result: Pick };
    entries: ContestEntry[];
    distribution: Record<Pick, number>;
}

/**
 * The contest result for a finished match.
 *
 * Settlement is LAZY: opening the page settles it if nobody has yet. The server
 * is idempotent (guarded on `settled`), so mounting twice can't double-pay — no
 * cron or job queue needed.
 */
export function useContest(fixtureId: number, enabled = true) {
    const creds = useTxlineCreds();

    return useQuery({
        queryKey: ["contest", fixtureId],
        enabled: enabled && !!creds,
        staleTime: 60_000,
        retry: false,
        queryFn: async (): Promise<Contest> => {
            const res = await fetch(`${API}/api/contests/${fixtureId}/settle`, {
                method: "POST",
                headers: headersFor(creds!),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `settle failed (${res.status})`);
            return data;
        },
    });
}

const headersFor = (creds: TxlineCreds) => ({
    "x-jwt": creds.jwt,
    "x-api-token": creds.apiToken,
});
