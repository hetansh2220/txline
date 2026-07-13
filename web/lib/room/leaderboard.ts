"use client";

import { useQuery } from "@tanstack/react-query";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface Standing {
    wallet: string;
    username: string;
    points: number;
    /** Settled picks only — a match still in play isn't a result yet. */
    predictions: number;
    wins: number;
    /** Picks on matches that haven't finished. Never counted in the win rate. */
    pending: number;
}

/** All-time standings, already ranked by the server. */
export function useLeaderboard() {
    return useQuery({
        queryKey: ["leaderboard"],
        staleTime: 30_000,
        queryFn: async (): Promise<Standing[]> => {
            const res = await fetch(`${API}/api/leaderboard`);
            if (!res.ok) throw new Error(`leaderboard failed (${res.status})`);
            return res.json();
        },
    });
}

export const winRate = (s: Standing) =>
    s.predictions ? Math.round((s.wins / s.predictions) * 100) : 0;
