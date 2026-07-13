import { Room } from "@/components/room/room";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ h?: string; a?: string; t?: string }>;
}) {
  const { matchId } = await params;
  const { h, a, t } = await searchParams;
  const kickoff = Number(t);

  return (
    <Room
      matchId={Number(matchId)}
      home={h}
      away={a}
      kickoff={Number.isFinite(kickoff) && kickoff > 0 ? kickoff : undefined}
    />
  );
}
