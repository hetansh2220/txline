import type { Metadata } from "next";
import { MatchRecap } from "@/components/match/match-recap";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://instinct-mu.vercel.app";

function matchTitle(home?: string, away?: string) {
  return home && away ? `${home} vs ${away}` : "Match recap";
}

function ogImageUrl(matchId: string, home?: string, away?: string) {
  const url = new URL("/api/og/match", SITE_URL);
  url.searchParams.set("id", matchId);
  if (home) url.searchParams.set("h", home);
  if (away) url.searchParams.set("a", away);
  return url.toString();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ h?: string; a?: string }>;
}): Promise<Metadata> {
  const { matchId } = await params;
  const { h, a } = await searchParams;
  const title = `${matchTitle(h, a)} | Instinct`;
  const description = "View the result and contest recap on Instinct.";
  const image = ogImageUrl(matchId, h, a);

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

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ h?: string; a?: string }>;
}) {
  const { matchId } = await params;
  const { h, a } = await searchParams;
  return <MatchRecap matchId={Number(matchId)} home={h} away={a} />;
}
