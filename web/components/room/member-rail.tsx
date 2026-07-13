"use client";

import { avatarUrl } from "@/lib/user";
import { teamCode } from "@/lib/txline/flags";
import type { Member } from "@/lib/room/types";
import { cn } from "@/lib/utils";

/**
 * Not a member list — a leaderboard. A plain roster is read once and then ignored;
 * ranking people by points (and showing who backed whom) means the column is worth
 * glancing at every time the score changes.
 */
export function MemberRail({
    members,
    onlineCount,
    home,
    away,
    meWallet,
}: {
    members: Member[];
    onlineCount: number;
    home?: string;
    away?: string;
    meWallet?: string;
}) {
    const ranked = [...members].sort((a, b) => b.points - a.points);

    return (
        // Sized to its contents, capped at the viewport. Stretching it to full height
        // left a tall empty box under a short list, which is what looked broken.
        <aside className="flex max-h-full w-full flex-col self-start overflow-hidden rounded-2xl border border-border bg-card">
            <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5">
                <span className="font-heading text-xs font-bold tracking-widest uppercase">
                    In the room

                </span>
                {onlineCount > 0 && (
                    <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-500">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {onlineCount}
                    </span>
                )}
            </header>

            <div className="flex min-h-0 flex-col gap-0.5 overflow-y-auto p-2">
                {ranked.map((m, i) => (
                    <div
                        key={m.wallet}
                        className={cn(
                            "flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors",
                            m.wallet === meWallet ? "bg-muted" : "hover:bg-muted/50"
                        )}
                    >
                        <span className="w-4 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                            {i + 1}
                        </span>

                        <span className="relative shrink-0">
                            <img
                                src={avatarUrl(m.wallet)}
                                alt=""
                                className={cn("size-7 rounded-full bg-muted ring-1 ring-border", !m.online && "grayscale")}
                            />
                            <span
                                className={cn(
                                    "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card",
                                    m.online ? "bg-emerald-500" : "bg-muted-foreground/40"
                                )}
                            />
                        </span>

                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {m.wallet === meWallet ? "You" : m.username}
                        </span>

                        {m.pick && <Pick pick={m.pick} home={home} away={away} />}

                        <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-emerald-500">
                            {m.points.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </aside>
    );
}

/** Who they backed — the reason this column is fun when a goal lands. */
function Pick({ pick, home, away }: { pick: Member["pick"]; home?: string; away?: string }) {
    if (pick === "draw") {
        return (
            <span className="shrink-0 rounded px-1 font-mono text-[10px] font-bold text-muted-foreground">
                DRAW
            </span>
        );
    }
    const team = pick === "home" ? home : away;
    const code = teamCode(team);

    return code ? (
        <img
            src={`https://flagcdn.com/w40/${code}.png`}
            alt={team ?? ""}
            title={team}
            className="h-3 w-4 shrink-0 rounded-xs object-cover ring-1 ring-border"
        />
    ) : (
        <span className="shrink-0 font-mono text-[10px] font-bold text-muted-foreground">
            {team?.slice(0, 3).toUpperCase()}
        </span>
    );
}
