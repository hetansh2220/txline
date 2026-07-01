import Subscribe from "@/components/solana/subscribe";

export default function ConsolePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Data console
        </h1>
        <p className="text-sm text-muted-foreground">
          The raw TxLINE integration: subscribe on-chain, activate your API
          token, and pull live fixtures. This powers the markets on the home
          page.
        </p>
      </div>

      <Subscribe />
    </main>
  );
}
