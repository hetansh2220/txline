import type { Metadata } from "next";
import { Room } from "@/components/room/room";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://instinct-mu.vercel.app";

function matchTitle(home?: string, away?: string) {
  return home && away ? `${home} vs ${away}` : "Match contest";
}

function ogImageUrl(matchId: string, home?: string, away?: string, kickoff?: string) {
  const url = new URL("/api/og/match", SITE_URL);
  url.searchParams.set("id", matchId);
  if (home) url.searchParams.set("h", home);
  if (away) url.searchParams.set("a", away);
  if (kickoff) url.searchParams.set("t", kickoff);
  return url.toString();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ h?: string; a?: string; t?: string }>;
}): Promise<Metadata> {
  const { matchId } = await params;
  const { h, a, t } = await searchParams;
  const title = `${matchTitle(h, a)} | Instinct`;
  const description = "Pick a winner, watch it live, climb the leaderboard.";
  const image = ogImageUrl(matchId, h, a, t);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

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
