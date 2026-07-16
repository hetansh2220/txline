"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Lock } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubmitPick } from "@/lib/room/entry";
import type { Pick } from "@/components/room/match-rail";
import { cn } from "@/lib/utils";

/**
 * Joining a contest IS picking a side — so the pick happens here, at the moment
 * you join, rather than after you've already been dropped into the room. On
 * success it takes you straight through to the room.
 */
export function JoinDialog({
    fixtureId,
    home,
    away,
    kickoff,
    open,
    onOpenChange,
}: {
    fixtureId: number;
    home?: string;
    away?: string;
    kickoff?: number;
    open: boolean;
    onOpenChange: (o: boolean) => void;
}) {
    const router = useRouter();
    const { publicKey } = useWallet();
    const wallet = publicKey?.toBase58();

    const [pick, setPick] = useState<Pick | null>(null);
    const submit = useSubmitPick(fixtureId, wallet, kickoff);

    const roomHref = `/room/${fixtureId}?h=${encodeURIComponent(home ?? "")}&a=${encodeURIComponent(
        away ?? ""
    )}&t=${kickoff ?? 0}`;

    const options: { key: Pick; label: string }[] = [
        { key: "home", label: home ?? "Home" },
        { key: "draw", label: "Draw" },
        { key: "away", label: away ?? "Away" },
    ];

    function join() {
        if (!pick) return;
        submit.mutate(pick, {
            onSuccess: () => {
                onOpenChange(false);
                router.push(roomHref);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 p-0 sm:max-w-lg">
                <DialogHeader className="gap-2 px-6 pt-6">
                    <span className="flex items-center gap-2">
                        <DialogTitle className="font-heading text-xl">Join contest</DialogTitle>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-emerald-400">
                            +150 PTS
                        </span>
                    </span>
                    <DialogDescription className="text-sm">
                        Call the winner of{" "}
                        <span className="font-medium text-foreground">
                            {home} v {away}
                        </span>
                        . Get it right and you take 150 points.
                    </DialogDescription>
                </DialogHeader>

                {/* Same compact pills as the room's pick card — one visual language
                    for "choose a side" everywhere it appears. */}
                <div className="grid grid-cols-3 gap-2 px-6 py-5">
                    {options.map((o) => {
                        const selected = pick === o.key;
                        return (
                            <button
                                key={o.key}
                                onClick={() => setPick(o.key)}
                                title={o.label}
                                className={cn(
                                    "h-12 truncate rounded-2xl px-2 text-sm font-bold transition-colors",
                                    selected
                                        ? "bg-emerald-500 text-white hover:bg-emerald-500/90"
                                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {o.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-3 px-6 pb-6">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="size-3.5 shrink-0" />
                        You can change your pick until kickoff — after that it&apos;s locked.
                    </p>

                    {submit.error && (
                        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            {submit.error.message}
                        </p>
                    )}
                </div>

                {/* DialogFooter ships with negative margins, a top border and a
                    bg-muted/50 strip — all stripped here so the card reads as one
                    surface. Two equal columns so the pair spans the full width. */}
                <DialogFooter className="m-0 grid grid-cols-2 gap-2.5 border-t-0 bg-transparent px-6 pt-1 pb-6 sm:grid-cols-2 sm:gap-2.5">
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-12 w-full"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="lg"
                        disabled={!pick || submit.isPending}
                        onClick={join}
                        className="h-12 w-full disabled:opacity-40"
                    >
                        {submit.isPending ? "Joining…" : "Join contest"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
