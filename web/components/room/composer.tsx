"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";

const MAX = 500;

export function Composer({
    onSend,
    connected,
    canChat,
}: {
    onSend: (body: string) => void;
    connected: boolean;
    canChat: boolean;
}) {
    const { setVisible } = useWalletModal();
    const [value, setValue] = useState("");

    // Reading the room is open to everyone; talking needs a wallet.
    if (!canChat) {
        return (
            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
                <p className="text-sm text-muted-foreground">Connect your wallet to join the conversation.</p>
                <Button size="sm" onClick={() => setVisible(true)}>
                    Connect Wallet
                </Button>
            </div>
        );
    }

    function submit() {
        const body = value.trim();
        if (!body) return;
        onSend(body.slice(0, MAX));
        setValue("");
    }

    return (
        <div className="border-t border-border px-4 py-3">
            <div className="flex items-end gap-2">
                <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value.slice(0, MAX))}
                    onKeyDown={(e) => {
                        // Enter sends; Shift+Enter is a newline.
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                    rows={1}
                    placeholder={connected ? "Say something…" : "Connecting…"}
                    disabled={!connected}
                    className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring disabled:opacity-50"
                />
                <Button size="icon" className="size-10 shrink-0" disabled={!connected || !value.trim()} onClick={submit}>
                    <SendHorizontal className="size-4" />
                </Button>
            </div>
        </div>
    );
}
