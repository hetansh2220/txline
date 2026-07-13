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
                const won = e.points > 0;
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

                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {mine ? "You" : e.username}
                        </span>

                        <span className="shrink-0 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                            {label(e.pick, home, away)}
                        </span>

                        <span
                            className={cn(
                                "w-12 shrink-0 text-right font-mono text-sm font-bold tabular-nums",
                                won ? "text-emerald-400" : "text-muted-foreground"
                            )}
                        >
                            +{e.points}
                        </span>
                    </div>
                );
            })}
        </section>
    );
}
