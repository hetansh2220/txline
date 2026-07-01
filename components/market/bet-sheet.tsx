"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
    decimalOdds,
    formatUsd,
    impliedProb,
    projectedReturn,
    type Market,
    type Outcome,
} from "@/lib/markets/types";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const QUICK_STAKES = [10, 50, 100, 250];

export function BetSheet({
    open,
    onOpenChange,
    selection,
    onPlace,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selection: { market: Market; outcome: Outcome } | null;
    onPlace: (stake: number) => void;
}) {
    const [amount, setAmount] = useState("");
    const [placed, setPlaced] = useState(false);

    // reset local state whenever the sheet opens on a new selection
    useEffect(() => {
        if (open) {
            setAmount("");
            setPlaced(false);
        }
    }, [open, selection]);

    if (!selection) return null;
    const { market, outcome } = selection;

    const stake = Number(amount) || 0;
    const odds = decimalOdds(market, outcome);
    const prob = impliedProb(market, outcome);
    const payout = projectedReturn(market, outcome, stake);
    const profit = payout - stake;

    function place() {
        if (stake <= 0) return;
        onPlace(stake);
        setPlaced(true);
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] tracking-wide uppercase">
                            {market.competition}
                        </Badge>
                    </div>
                    <SheetTitle className="mt-1">
                        {market.home} <span className="text-muted-foreground">vs</span> {market.away}
                    </SheetTitle>
                    <SheetDescription>
                        Backing{" "}
                        <span className="font-medium text-foreground">
                            {outcome.key === "DRAW" ? "the draw" : outcome.label}
                        </span>{" "}
                        at {odds.toFixed(2)}× ({Math.round(prob * 100)}% implied)
                    </SheetDescription>
                </SheetHeader>

                {placed ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                        <span className="grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                            <Check className="size-6" strokeWidth={3} />
                        </span>
                        <p className="text-sm font-medium">Bet placed</p>
                        <p className="text-xs text-muted-foreground">
                            {formatUsd(stake)} USDC on {outcome.key === "DRAW" ? "the draw" : outcome.label}.
                            <br />
                            Demo only — no funds moved. On-chain trading comes next.
                        </p>
                        <Button variant="outline" className="mt-2" onClick={() => onOpenChange(false)}>
                            Done
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4 px-4">
                            <div className="flex flex-col gap-2">
                                <label className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                                    Stake (USDC)
                                </label>
                                <Input
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                                    className="h-11 font-mono text-base tabular-nums"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    {QUICK_STAKES.map((v) => (
                                        <Button
                                            key={v}
                                            variant="secondary"
                                            size="sm"
                                            className="flex-1 font-mono tabular-nums"
                                            onClick={() => setAmount(String(v))}
                                        >
                                            {v}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* payout summary */}
                            <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3.5 text-sm">
                                <Row label="Payout multiple" value={`${odds.toFixed(2)}×`} />
                                <Row
                                    label="Est. payout"
                                    value={`${formatUsd(payout)} USDC`}
                                    strong
                                />
                                <Row
                                    label="Est. profit"
                                    value={`${profit >= 0 ? "+" : ""}${formatUsd(profit)} USDC`}
                                    tone={profit > 0 ? "pos" : undefined}
                                />
                            </div>

                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                Parimutuel pool — winners split the losing pools pro-rata, so the
                                final multiple settles when the market closes.
                            </p>
                        </div>

                        <SheetFooter>
                            <Button size="lg" className="h-11" disabled={stake <= 0} onClick={place}>
                                {stake > 0 ? `Place ${formatUsd(stake)} USDC bet` : "Enter a stake"}
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

function Row({
    label,
    value,
    strong,
    tone,
}: {
    label: string;
    value: string;
    strong?: boolean;
    tone?: "pos";
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={[
                    "font-mono tabular-nums",
                    strong ? "font-semibold text-foreground" : "",
                    tone === "pos" ? "text-emerald-400" : "",
                ].join(" ")}
            >
                {value}
            </span>
        </div>
    );
}
