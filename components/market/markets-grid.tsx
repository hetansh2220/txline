"use client";

import { useMemo, useState } from "react";
import { MOCK_MARKETS } from "@/lib/markets/mock";
import { formatUsd, totalPool, type Market, type Outcome } from "@/lib/markets/types";
import { MarketCard } from "./market-card";
import { BetSheet } from "./bet-sheet";
import { cn } from "@/lib/utils";

export function MarketsGrid() {
    const [markets, setMarkets] = useState<Market[]>(MOCK_MARKETS);
    const [filter, setFilter] = useState<string>("All");
    const [selection, setSelection] = useState<{ market: Market; outcome: Outcome } | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const stats = useMemo(() => {
        const volume = markets.reduce((s, m) => s + totalPool(m), 0);
        const live = markets.filter((m) => m.status === "live").length;
        return { volume, live, count: markets.length };
    }, [markets]);

    const filters = useMemo(() => {
        const comps = Array.from(new Set(markets.map((m) => m.competition)));
        return ["All", ...comps, "Live", "Settled"];
    }, [markets]);

    function matchesFilter(m: Market): boolean {
        if (filter === "All") return true;
        if (filter === "Live") return m.status === "live";
        if (filter === "Settled") return m.status === "resolved";
        return m.competition === filter;
    }

    const visible = markets.filter(matchesFilter);

    function pick(market: Market, outcome: Outcome) {
        setSelection({ market, outcome });
        setSheetOpen(true);
    }


    function place(stake: number) {
        if (!selection) return;
        const { market, outcome } = selection;
        setMarkets((prev) =>
            prev.map((m) =>
                m.id === market.id
                    ? {
                        ...m,
                        bettors: m.bettors + 1,
                        outcomes: m.outcomes.map((o) =>
                            o.key === outcome.key ? { ...o, pool: o.pool + stake } : o
                        ),
                    }
                    : m
            )
        );
    }

    return (
        <div className="flex flex-col gap-6">



            {visible.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No markets here yet.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((m) => (
                        <MarketCard key={m.id} market={m} onPick={pick} />
                    ))}
                </div>
            )}

            <BetSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                selection={selection}
                onPlace={place}
            />
        </div>
    );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex flex-col gap-1 px-4 py-3.5">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <span
                className={cn(
                    "font-mono text-lg font-semibold tabular-nums",
                    accent ? "text-emerald-400" : "text-foreground"
                )}
            >
                {value}
            </span>
        </div>
    );
}
