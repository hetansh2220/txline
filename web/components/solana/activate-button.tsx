"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAutoActivate, type ActivateStatus } from "@/lib/txline/use-activate";

const RUNNING_LABEL: Partial<Record<ActivateStatus, string>> = {
    subscribing: "Subscribing…",
    authenticating: "Authenticating…",
    signing: "Sign in wallet…",
    activating: "Activating…",
};

/**
 * Activation runs itself on connect — in the happy path there is no button to
 * press, just a progress chip. It only becomes a button when it FAILS, because a
 * failure needs a human decision (fund the wallet, approve the popup), and
 * retrying on its own would spam wallet prompts.
 */
export function ActivateButton() {
    const { connected } = useWallet();
    const { status, isActivating, error, retry, activated } = useAutoActivate();

    if (!connected || activated) return null;

    if (isActivating) {
        return (
            <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {RUNNING_LABEL[status] ?? "Working…"}
            </span>
        );
    }

    if (status === "error") {
        return (
            <Button
                size="sm"
                variant="outline"
                onClick={retry}
                title={error ?? undefined}
                className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
                <AlertCircle className="size-3.5 shrink-0" />
                <span className="max-w-52 truncate">{error ?? "Activation failed"}</span>
                <span className="shrink-0 font-semibold underline">Retry</span>
            </Button>
        );
    }

    return null;
}
