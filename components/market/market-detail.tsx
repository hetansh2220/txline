"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTxlineCreds } from "@/lib/txline/creds";
import { useFixtures } from "@/lib/txline/queries";
import { fixtureToMarket } from "@/lib/markets/from-fixtures";
import {
    decimalOdds,
    formatKickoff,
    formatUsd,
    impliedProb,
    outcomeShort,
    projectedReturn,
    teamFlag,
    totalPool,
    type Market,
    type Outcome,
    type OutcomeKey,
} from "@/lib/markets/types";
import { cn } from "@/lib/utils";
import { ProbChart } from "./prob-chart";

// softer, calmer shades (less neon) matching the reference tone
const OUTCOME_COLOR: Record<OutcomeKey, string> = {
    HOME: "#3fb877",
    DRAW: "#8a8f99",
    AWAY: "#ec5f6d",
};
const QUICK_ADD = [1, 5, 10, 100];
const MAX_STAKE = 250;
const MOCK_BALANCE = 854.92;

// seeded pseudo-random walk so a market's chart is stable across renders
function seededWalk(seed: number, base: number, len: number): number[] {
    let s = (seed || 1) >>> 0;
    const rand = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
    const out: number[] = [];
    let v = base;
    for (let i = 0; i < len; i++) {
        v += (rand() - 0.5) * 0.05;
        v = Math.min(0.9, Math.max(0.1, v));
        out.push(v);
    }
    return out;
}

interface Position {
    key: OutcomeKey;
    label: string;
    stake: number;
}

export function MarketDetail({ id, initialPick }: { id: string; initialPick?: string }) {
    const creds = useTxlineCreds();
    const fixtures = useFixtures(creds);

    const market = useMemo<Market | null>(() => {
        if (!fixtures.data) return null;
        const f = fixtures.data.find((x) => `fx-${x.FixtureId}` === id);
        return f ? fixtureToMarket(f, Date.now()) : null;
    }, [fixtures.data, id]);

    if (!creds) {
        return (
            <Empty title="Not connected" body="Activate from the top bar to view this market." />
        );
    }
    if (fixtures.isLoading) return <DetailSkeleton />;
    if (!market) {
        return <Empty title="Market not found" body="This fixture is no longer in the snapshot." />;
    }

    return <MarketDetailInner market={market} initialPick={initialPick} />;
}

function MarketDetailInner({ market, initialPick }: { market: Market; initialPick?: string }) {
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();

    const validKeys = market.outcomes.map((o) => o.key);
    const startKey = (initialPick && validKeys.includes(initialPick as OutcomeKey)
        ? (initialPick as OutcomeKey)
        : market.outcomes[0].key) as OutcomeKey;

    const [side, setSide] = useState<OutcomeKey>(startKey);
    const [mode, setMode] = useState<"buy" | "sell">("buy");
    const [amount, setAmount] = useState<number>(0);
    const [positions, setPositions] = useState<Position[]>([]);

    const outcome = market.outcomes.find((o) => o.key === side) as Outcome;
    const series = useMemo(
        () => seededWalk(market.fixtureId + side.length, impliedProb(market, outcome), 60),
        [market, side, outcome]
    );

    const payout = projectedReturn(market, outcome, amount);

    function place() {
        if (!connected) {
            setVisible(true);
            return;
        }
        if (amount <= 0) return;
        setPositions((p) => [{ key: side, label: outcome.label, stake: amount }, ...p]);
        setAmount(0);
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8">
            <Link
                href="/"
                className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4" /> Markets
            </Link>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                {/* left: header + chart */}
                <div className="flex flex-col gap-6">
                    {/* header */}
                    <div className="flex items-start gap-4">
                        <MatchAvatar home={market.home} away={market.away} />
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {market.home} <span className="text-muted-foreground">vs</span>{" "}
                                {market.away}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {market.competition} · Kickoff {formatKickoff(market.kickoff)}
                            </p>
                        </div>
                    </div>

                    {/* stat row */}
                    <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
                        <Stat label="Total pool" value={`${formatUsd(totalPool(market))} USDC`} />
                        <Stat
                            label="Leading"
                            value={`${leadingLabel(market)}`}
                            valueClass="text-emerald-400"
                        />
                        <div className="ml-auto">
                            <Countdown to={market.kickoff} />
                        </div>
                    </div>

                    {/* chart */}
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium">
                                {outcomeShort(side)} probability
                            </span>
                            <span
                                className="font-mono text-sm font-semibold tabular-nums"
                                style={{ color: OUTCOME_COLOR[side] }}
                            >
                                {Math.round(impliedProb(market, outcome) * 100)}%
                            </span>
                        </div>
                        <ProbChart points={series} color={OUTCOME_COLOR[side]} />
                        <p className="mt-2 text-[11px] text-muted-foreground">
                            Illustrative history — live odds history wires in from TxLINE next.
                        </p>
                    </div>

                    {/* positions */}
                    <div className="rounded-2xl border border-border bg-card">
                        <div className="border-b border-border px-4 py-3 text-sm font-medium">
                            Positions
                        </div>
                        {positions.length === 0 ? (
                            <p className="py-10 text-center text-sm text-muted-foreground">
                                No positions
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {positions.map((p, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center justify-between px-4 py-3 text-sm"
                                    >
                                        <span className="font-medium">{p.label}</span>
                                        <span className="font-mono tabular-nums text-muted-foreground">
                                            {formatUsd(p.stake)} USDC
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* right: trade panel */}
                <div className="h-fit rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-20">
                    <div className="mb-4 flex items-center gap-2.5">
                        <MatchAvatar home={market.home} away={market.away} small />
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                                {market.home} vs {market.away}
                            </span>
                            <span
                                className="text-sm font-semibold"
                                style={{ color: OUTCOME_COLOR[side] }}
                            >
                                {outcomeShort(side)}
                            </span>
                        </div>
                    </div>

                    {/* buy / sell + order type */}
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <div className="flex rounded-full bg-muted/60 p-1">
                            {(["buy", "sell"] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={cn(
                                        "rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors",
                                        mode === m
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1.5 text-sm font-medium text-muted-foreground">
                            Market <ChevronDown className="size-4" />
                        </div>
                    </div>

                    {/* outcome selector — big filled pill buttons */}
                    <div
                        className={cn(
                            "mb-5 grid gap-2.5",
                            market.outcomes.length === 3 ? "grid-cols-3" : "grid-cols-2"
                        )}
                    >
                        {market.outcomes.map((o) => {
                            const pct = Math.round(impliedProb(market, o) * 100);
                            const active = o.key === side;
                            return (
                                <button
                                    key={o.key}
                                    onClick={() => setSide(o.key)}
                                    className={cn(
                                        "flex items-center justify-center gap-1.5 rounded-lg border py-4 text-sm font-bold transition-colors",
                                        active
                                            ? "border-white/15 text-white shadow-sm"
                                            : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                                    )}
                                    style={
                                        active
                                            ? {
                                                  background: OUTCOME_COLOR[o.key],
                                                  boxShadow: `0 10px 24px -10px ${OUTCOME_COLOR[o.key]}99`,
                                              }
                                            : undefined
                                    }
                                >
                                    <span>{outcomeShort(o.key)}</span>
                                    <span className="font-mono tabular-nums">{pct}%</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* amount + balance */}
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                            Amount
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Balance{" "}
                            <span className="font-medium text-foreground">
                                ${MOCK_BALANCE.toFixed(2)}
                            </span>
                        </span>
                    </div>
                    <div className="mt-1 flex items-center">
                        <span className="text-4xl font-bold">$</span>
                        <input
                            inputMode="decimal"
                            value={amount || ""}
                            placeholder="0"
                            onChange={(e) => {
                                const v = Number(e.target.value.replace(/[^0-9.]/g, ""));
                                setAmount(Number.isFinite(v) ? v : 0);
                            }}
                            className="w-full bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {QUICK_ADD.map((v) => (
                            <button
                                key={v}
                                onClick={() => setAmount((a) => Math.min(MOCK_BALANCE, a + v))}
                                className="rounded-full bg-muted/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                            >
                                +${v}
                            </button>
                        ))}
                        <button
                            onClick={() => setAmount(Math.floor(MOCK_BALANCE))}
                            className="rounded-full bg-muted/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            Max
                        </button>
                    </div>

                    {/* pays line */}
                    <div className="mt-5 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            Pays {decimalOdds(market, outcome).toFixed(2)}×
                        </span>
                        <span
                            className="text-xl font-bold tabular-nums"
                            style={{ color: OUTCOME_COLOR[side] }}
                        >
                            ${payout.toFixed(2)}
                        </span>
                    </div>

                    <button
                        onClick={place}
                        className="mt-4 h-12 w-full rounded-xl text-base font-semibold text-white transition-opacity hover:opacity-90"
                        style={{
                            background: OUTCOME_COLOR[side],
                            boxShadow: `0 12px 28px -12px ${OUTCOME_COLOR[side]}aa`,
                        }}
                    >
                        {!connected
                            ? "Connect Wallet"
                            : amount > 0
                                ? `${mode === "buy" ? "Buy" : "Sell"} ${outcomeShort(side)}`
                                : "Enter an amount"}
                    </button>

                    <p className="mt-3 text-center text-[11px] text-muted-foreground">
                        By trading, you agree to the Terms of Use.
                    </p>
                </div>
            </div>
        </div>
    );
}

function leadingLabel(m: Market): string {
    const lead = [...m.outcomes].sort((a, b) => b.pool - a.pool)[0];
    return `${outcomeShort(lead.key)} · ${Math.round(impliedProb(m, lead) * 100)}%`;
}

function Countdown({ to }: { to: number }) {
    const [now, setNow] = useState<number>(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const diff = to - now;
    if (diff <= 0) {
        return (
            <span className="font-mono text-sm font-semibold tracking-wider text-emerald-400 uppercase">
                Started
            </span>
        );
    }
    const hrs = Math.floor(diff / 3.6e6);
    const min = Math.floor((diff % 3.6e6) / 6e4);
    const sec = Math.floor((diff % 6e4) / 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
        <div className="flex items-end gap-2 font-mono tabular-nums">
            {[
                [pad(hrs), "hrs"],
                [pad(min), "min"],
                [pad(sec), "sec"],
            ].map(([v, l]) => (
                <div key={l} className="flex flex-col items-center">
                    <span className="text-xl font-bold text-rose-400">{v}</span>
                    <span className="text-[9px] tracking-wider text-muted-foreground uppercase">{l}</span>
                </div>
            ))}
        </div>
    );
}

function MatchAvatar({ home, away, small }: { home: string; away: string; small?: boolean }) {
    const box = small ? "size-9" : "size-14";
    const chip = small ? "size-6 text-xs" : "size-9 text-base";
    return (
        <div className={cn("relative shrink-0", box)}>
            <span className={cn("absolute top-0 left-0 grid place-items-center rounded-full bg-muted ring-2 ring-card", chip)}>
                {teamFlag(home)}
            </span>
            <span className={cn("absolute right-0 bottom-0 grid place-items-center rounded-full bg-muted ring-2 ring-card", chip)}>
                {teamFlag(away)}
            </span>
        </div>
    );
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <span className={cn("text-lg font-semibold tabular-nums", valueClass)}>{value}</span>
        </div>
    );
}

function Empty({ title, body }: { title: string; body: string }) {
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-2 px-5 py-24 text-center sm:px-8">
            <p className="text-sm font-medium">{title}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
            <Link href="/" className="mt-2 text-sm text-muted-foreground underline hover:text-foreground">
                ← Back to markets
            </Link>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_360px]">
            <div className="flex animate-pulse flex-col gap-6">
                <div className="flex gap-4">
                    <div className="size-14 rounded-full bg-muted" />
                    <div className="flex flex-col gap-2 pt-1">
                        <div className="h-5 w-64 rounded bg-muted" />
                        <div className="h-3 w-40 rounded bg-muted" />
                    </div>
                </div>
                <div className="h-72 rounded-2xl bg-muted" />
            </div>
            <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </div>
    );
}
