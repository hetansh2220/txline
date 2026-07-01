// UI-only market model for the prediction market. No on-chain logic yet — these
// are the shapes the frontend renders. Pools are in a stablecoin unit (USDC).

export type OutcomeKey = "HOME" | "DRAW" | "AWAY";
export type MarketStatus = "open" | "live" | "resolved";

export interface Outcome {
    key: OutcomeKey;
    /** Short display label, e.g. team name or "Draw". */
    label: string;
    /** Total staked on this outcome, in USDC. */
    pool: number;
}

export interface Market {
    id: string;
    fixtureId: number;
    competition: string;
    home: string;
    away: string;
    /** Kickoff time in ms since epoch. */
    kickoff: number;
    status: MarketStatus;
    outcomes: Outcome[];
    /** Set when status === "resolved". */
    resolved?: OutcomeKey;
    /** Number of distinct bettors — display only. */
    bettors: number;
}

export function totalPool(m: Market): number {
    return m.outcomes.reduce((sum, o) => sum + o.pool, 0);
}

/** Crowd-implied probability of an outcome (its share of the total pool). */
export function impliedProb(m: Market, o: Outcome): number {
    const t = totalPool(m);
    return t > 0 ? o.pool / t : 0;
}

/**
 * Parimutuel payout multiple: if this outcome wins, each unit staked returns
 * `total / pool`. Shown to users as "2.14×".
 */
export function decimalOdds(m: Market, o: Outcome): number {
    return o.pool > 0 ? totalPool(m) / o.pool : 0;
}

/**
 * Projected return for adding `stake` to an outcome, under parimutuel rules:
 * the stake dilutes its own pool, so the multiple drops slightly as you bet.
 */
export function projectedReturn(m: Market, o: Outcome, stake: number): number {
    if (stake <= 0) return 0;
    const newTotal = totalPool(m) + stake;
    const newPool = o.pool + stake;
    return stake * (newTotal / newPool);
}

export function formatUsd(n: number): string {
    return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

const kickoffFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC", // fixed zone → deterministic across server/client render
});

/** Deterministic kickoff label, e.g. "Jul 16, 15:00 UTC". */
export function formatKickoff(ms: number): string {
    return `${kickoffFmt.format(new Date(ms))} UTC`;
}

const TEAM_FLAG: Record<string, string> = {
    Netherlands: "🇳🇱",
    Morocco: "🇲🇦",
    USA: "🇺🇸",
    "Bosnia & Herzegovina": "🇧🇦",
    Vietnam: "🇻🇳",
    Myanmar: "🇲🇲",
    Brazil: "🇧🇷",
    Argentina: "🇦🇷",
    France: "🇫🇷",
    Germany: "🇩🇪",
    Spain: "🇪🇸",
    Portugal: "🇵🇹",
};

export function teamFlag(name: string): string {
    return TEAM_FLAG[name] ?? "⚽";
}

/** Short label for an outcome, used on the compact card buttons. */
export function outcomeShort(key: OutcomeKey): string {
    return key === "HOME" ? "Home" : key === "DRAW" ? "Draw" : "Away";
}
