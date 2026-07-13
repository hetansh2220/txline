"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { teamCode, teamFlag } from "@/lib/txline/flags";
import type { TimelineEvent } from "@/lib/txline/timeline";
import { cn } from "@/lib/utils";

const ICON: Record<string, string> = { goal: "⚽", yellow: "🟨", red: "🟥", sub: "🔁" };
const LIVE_WINDOW = 2.5 * 60 * 60 * 1000;

export type MatchState = "upcoming" | "live" | "completed";
export type Pick = "home" | "draw" | "away";

export function matchState(kickoff?: number): MatchState {
    if (!kickoff) return "completed";
    const now = Date.now();
    if (now < kickoff) return "upcoming";
    return now < kickoff + LIVE_WINDOW ? "live" : "completed";
}

/**
 * The left rail. Fixed height, never scrolls — the chat is the only scrolling
 * area, and that only holds if the rails fit. Its job changes with the match:
 * before kickoff it's the entry form, after it's the scoreboard.
 */
export function MatchRail({
    matchId,
    home,
    away,
    score,
    events,
    state,
    kickoff,
    pick,
    onPick,
}: {
    matchId: number;
    home?: string;
    away?: string;
    score?: [number, number];
    events: TimelineEvent[];
    state: MatchState;
    kickoff?: number;
    pick?: Pick;
    onPick: (p: Pick) => void;
}) {
    const key = events.filter((e) => e.kind === "goal" || e.kind === "red");

    return (
        // Cards size to their contents and the column stops there — stretching the
        // last card to full height left a big empty bordered box below the content.
        <aside className="flex max-h-full w-full flex-col gap-3 self-start overflow-hidden">
            <section className="shrink-0 rounded-2xl border border-border bg-card p-5">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <Team name={home} />
                    {state === "upcoming" ? (
                        <span className="font-heading text-xl font-bold text-muted-foreground">v</span>
                    ) : (
                        <span className="font-mono text-2xl font-bold tabular-nums">
                            {score ? `${score[0]} - ${score[1]}` : "0 - 0"}
                        </span>
                    )}
                    <Team name={away} />
                </div>

                <div className="mt-4 flex justify-center">
                    <Status state={state} kickoff={kickoff} />
                </div>
            </section>

            {/* Before kickoff the rail's job is to take your entry. */}
            {state === "upcoming" ? (
                <PickCard home={home} away={away} pick={pick} onPick={onPick} />
            ) : (
                <YourPick pick={pick} home={home} away={away} />
            )}

            <section className="flex min-h-0 flex-col rounded-2xl border border-border bg-card p-4">
                <span className="mb-3 shrink-0 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Key events
                </span>

                <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto">
                    {key.length === 0 ? (
                        <p className="py-3 text-xs text-muted-foreground">
                            {state === "upcoming" ? "Match hasn't started." : "No goals yet."}
                        </p>
                    ) : (
                        key.map((e) => (
                            <div key={e.id} className="flex items-center gap-2.5">
                                <span className="w-7 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                                    {e.minute}&apos;
                                </span>
                                <span className="shrink-0 text-xs">{ICON[e.kind] ?? "•"}</span>
                                <span className="truncate text-xs">{e.player?.name ?? "—"}</span>
                            </div>
                        ))
                    )}
                </div>

                <Link
                    href={`/match/${matchId}?h=${encodeURIComponent(home ?? "")}&a=${encodeURIComponent(away ?? "")}`}
                    className="mt-3 flex shrink-0 items-center justify-center gap-1 border-t border-border pt-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    Full recap <ArrowUpRight className="size-3" />
                </Link>
            </section>
        </aside>
    );
}

function Status({ state, kickoff }: { state: MatchState; kickoff?: number }) {
    const [left, setLeft] = useState("");

    useEffect(() => {
        if (state !== "upcoming" || !kickoff) return;
        const update = () => {
            const ms = kickoff - Date.now();
            if (ms <= 0) return setLeft("any moment");
            const d = Math.floor(ms / 86_400_000);
            const h = Math.floor((ms % 86_400_000) / 3_600_000);
            const m = Math.floor((ms % 3_600_000) / 60_000);
            setLeft(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`);
        };
        update();
        const id = setInterval(update, 30_000);
        return () => clearInterval(id);
    }, [state, kickoff]);

    if (state === "live") {
        return (
            <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-red-500 uppercase">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> live
            </span>
        );
    }
    if (state === "completed") {
        return (
            <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                full time
            </span>
        );
    }
    return (
        <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            {/* `left` is client-only (it reads the clock), so it's empty on first paint. */}
            {left ? `kicks off in ${left}` : "upcoming"}
        </span>
    );
}

/** The contest entry. Locks at kickoff — otherwise you could back a team already winning. */
function PickCard({
    home,
    away,
    pick,
    onPick,
}: {
    home?: string;
    away?: string;
    pick?: Pick;
    onPick: (p: Pick) => void;
}) {
    const options: { key: Pick; label: string }[] = [
        { key: "home", label: home ?? "Home" },
        { key: "draw", label: "Draw" },
        { key: "away", label: away ?? "Away" },
    ];

    return (
        <section className="shrink-0 rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    Your pick
                </span>
                <span className="font-mono text-[10px] font-bold text-emerald-500">+15 PTS</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
                {options.map((o) => (
                    <button
                        key={o.key}
                        onClick={() => onPick(o.key)}
                        className={cn(
                            "flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition-colors",
                            pick === o.key
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                : "border-border text-muted-foreground hover:border-white/25 hover:text-foreground"
                        )}
                    >
                        <span className="truncate text-[11px] font-semibold">{o.label}</span>
                    </button>
                ))}
            </div>

            <p className="mt-2.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="size-3" /> Locks at kickoff
            </p>
        </section>
    );
}

function YourPick({ pick, home, away }: { pick?: Pick; home?: string; away?: string }) {
    if (!pick) return null;
    const label = pick === "draw" ? "Draw" : pick === "home" ? (home ?? "Home") : (away ?? "Away");

    return (
        <section className="flex shrink-0 items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Your pick</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <Lock className="size-3" /> {label}
            </span>
        </section>
    );
}

function Team({ name }: { name?: string }) {
    const code = teamCode(name);
    return (
        <div className="flex flex-col items-center gap-1.5">
            {code ? (
                <img
                    src={`https://flagcdn.com/w160/${code}.png`}
                    alt=""
                    className="h-7 w-10 rounded-xs object-cover ring-1 ring-border"
                />
            ) : (
                <span className="text-lg">{teamFlag(name)}</span>
            )}
            <span className="text-center text-[11px] font-bold tracking-wide uppercase">{name ?? "—"}</span>
        </div>
    );
}
