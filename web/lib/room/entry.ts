"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Pick } from "@/components/room/match-rail";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface Entry {
    pick: Pick;
    points: number;
    settled: boolean;
}

/**
 * Every fixture this user has entered, keyed by fixtureId. One request for the
 * whole match grid — a per-card fetch would be an N+1.
 */
export function useMyEntries(wallet?: string) {
    return useQuery({
        queryKey: ["my-entries", wallet],
        enabled: !!wallet,
        // Coming back from a room, the grid MUST reflect the pick just made — so
        // always refetch on mount rather than trusting a cached copy.
        staleTime: 0,
        refetchOnMount: "always",
        queryFn: async (): Promise<Record<number, Entry>> => {
            const res = await fetch(`${API}/api/entries?wallet=${wallet}`);
            if (!res.ok) throw new Error(`entries failed (${res.status})`);
            return res.json();
        },
    });
}

/** This user's pick for a fixture, or null if they haven't entered. */
export function useEntry(fixtureId: number, wallet?: string) {
    return useQuery({
        queryKey: ["entry", fixtureId, wallet],
        enabled: !!wallet,
        staleTime: 60_000,
        queryFn: async (): Promise<Entry | null> => {
            const res = await fetch(`${API}/api/entries/${fixtureId}?wallet=${wallet}`);
            if (!res.ok) throw new Error(`entry failed (${res.status})`);
            return res.json();
        },
    });
}

export function useSubmitPick(fixtureId: number, wallet?: string, kickoff?: number) {
    const qc = useQueryClient();
    const key = ["entry", fixtureId, wallet];

    return useMutation({
        mutationFn: async (pick: Pick): Promise<Entry> => {
            const res = await fetch(`${API}/api/entries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet, fixtureId, pick, kickoff }),
            });
            const data = await res.json();
            // The server enforces the kickoff lock; a 409 means we were too late.
            if (!res.ok) throw new Error(data?.error ?? `pick failed (${res.status})`);
            return data;
        },

        // Fill the button in immediately. Waiting for the round-trip made the
        // selection lag behind the click, which felt broken.
        onMutate: async (pick) => {
            await qc.cancelQueries({ queryKey: key });
            const previous = qc.getQueryData<Entry | null>(key);
            qc.setQueryData<Entry>(key, { pick, points: previous?.points ?? 0, settled: false });
            return { previous };
        },

        // The server said no (e.g. entries closed) — put the old pick back.
        onError: (_err, _pick, context) => {
            qc.setQueryData(key, context?.previous ?? null);
        },

        onSuccess: (entry) => {
            qc.setQueryData(key, entry);
            // The match grid shows "Enter room", and the room's people list shows
            // the pick — both are now stale.
            qc.invalidateQueries({ queryKey: ["my-entries", wallet] });
            qc.invalidateQueries({ queryKey: ["room-members", fixtureId] });
        },
    });
}
