import { MarketDetail } from "@/components/market/market-detail";

export const dynamic = "force-dynamic";

export default async function MarketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pick?: string }>;
}) {
  const { id } = await params;
  const { pick } = await searchParams;
  return <MarketDetail id={id} initialPick={pick} />;
}
