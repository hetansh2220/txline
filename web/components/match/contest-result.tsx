"use client";

import { avatarUrl } from "@/lib/user";
import type { Contest, Pick } from "@/lib/room/contest";
import { cn } from "@/lib/utils";

const label = (pick: Pick, home?: string, away?: string) =>
    pick === "draw" ? "Draw" : pick === "home" ? (home ?? "Home") : (away ?? "Away");

/** Who won the contest — with everyone's pick on show. */
export function ContestLeaderboard({
    contest,
    home,
    away,
    meWallet,
}: {
    contest: Contest;
    home?: string;
    away?: string;
    meWallet?: string;
}) {
    if (!contest.entries.length) {
        return (
            <p className="py-16 text-center text-sm text-muted-foreground">
                Nobody entered this contest.
            </p>
        );
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
            {contest.entries.map((e, i) => {
                const totalPts = e.points ?? 0;
                const entryPts = e.entryPoints ?? 0;
                const windowPts = e.windowPoints ?? 0;
                const won = totalPts > 0;
                const mine = e.wallet === meWallet;

                return (
                    <div
                        key={e.wallet}
                        className={cn(
                            "flex items-center gap-3 border-b border-border px-4 py-3 last:border-0",
                            mine && "bg-muted/60"
                        )}
                    >
                        <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                            {i + 1}
                        </span>

                        <img
                            src={avatarUrl(e.wallet)}
                            alt=""
                            className="size-8 shrink-0 rounded-full bg-muted ring-1 ring-border"
                        />

                        <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                                {mine ? "You" : e.username}
                            </span>
                            {/* Points breakdown: match pick + mini-events */}
                            <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                                <span className="shrink-0 uppercase tracking-wider">
                                    {label(e.pick, home, away)}
                                </span>
                                {entryPts > 0 && (
                                    <>
                                        <span className="text-border">·</span>
                                        <span className="text-emerald-400">
                                            Pick +{entryPts}
                                        </span>
                                    </>
                                )}
                                {windowPts > 0 && (
                                    <>
                                        <span className="text-border">·</span>
                                        <span className="text-amber-400">
                                            Events +{windowPts}
                                        </span>
                                    </>
                                )}
                            </span>
                        </div>

                        <span
                            className={cn(
                                "w-14 shrink-0 text-right font-mono text-sm font-bold tabular-nums",
                                won ? "text-emerald-400" : "text-muted-foreground"
                            )}
                        >
                            +{totalPts}
                        </span>
                    </div>
                );
            })}
        </section>
    );
}
