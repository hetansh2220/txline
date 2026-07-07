"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Check, Wallet, KeyRound } from "lucide-react";
import { useTxlineCreds } from "@/lib/txline/creds";
import { cn } from "@/lib/utils";

export default function Home() {
  const { connected } = useWallet();
  const creds = useTxlineCreds();

  const step = !connected ? 0 : !creds ? 1 : 2;

  const steps = [
    { icon: Wallet, title: "Connect wallet", body: "Use the button in the top bar (devnet)." },
    { icon: KeyRound, title: "Subscribe & activate", body: "Sign the on-chain subscribe + the activation message." },
    { icon: Check, title: "Activated", body: "Your API token is stored — the backend can now fetch TxLINE data." },
  ];

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-5 py-16 text-center sm:px-8">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Tx<span className="text-primary">LINE</span> access
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Connect a wallet and activate to obtain your TxLINE API token. Data endpoints
        live on the Node backend.
      </p>

      <ol className="mt-10 flex w-full flex-col gap-3 text-left">
        {steps.map((s, i) => {
          const done = step > i;
          const active = step === i;
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors",
                done
                  ? "border-emerald-500/25 bg-emerald-500/10"
                  : active
                    ? "border-border bg-card"
                    : "border-border bg-card/40 opacity-60"
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg",
                  done ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-foreground"
                )}
              >
                <Icon className="size-4" strokeWidth={2.5} />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{s.title}</span>
                <span className="text-xs text-muted-foreground">{s.body}</span>
              </div>
            </li>
          );
        })}
      </ol>

      {creds && (
        <p className="mt-6 break-all font-mono text-xs text-muted-foreground">
          token: {creds.apiToken.slice(0, 18)}…
        </p>
      )}
    </main>
  );
}
