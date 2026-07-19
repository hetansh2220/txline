import { ImageResponse } from "next/og";
import { teamCode } from "@/lib/txline/flags";

export const runtime = "edge";

const size = {
    width: 1200,
    height: 630,
};

function text(value: string | null, fallback: string) {
    return value?.trim() || fallback;
}

function statusLabel(kickoff: number) {
    if (!Number.isFinite(kickoff) || kickoff <= 0) return "TBD";
    const diff = kickoff - Date.now();
    if (diff <= 0) return "Live";
    const hours = Math.floor(diff / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${Math.max(1, minutes)}m left`;
}

function isFinal(home: string, away: string) {
    const teams = [home, away].map((team) => team.toLowerCase());
    return teams.some((team) => team.includes("spain")) && teams.some((team) => team.includes("argentina"));
}

function Flag({ name }: { name: string }) {
    const code = teamCode(name);

    return (
        <div
            style={{
                width: 118,
                height: 76,
                borderRadius: 12,
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {code ? (
                <img
                    src={`https://flagcdn.com/w320/${code}.png`}
                    alt=""
                    width={118}
                    height={76}
                    style={{ width: 118, height: 76, objectFit: "cover" }}
                />
            ) : (
                <div style={{ fontSize: 42 }}>⚽</div>
            )}
        </div>
    );
}

function Team({ name }: { name: string }) {
    return (
        <div
            style={{
                width: 250,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
            }}
        >
            <Flag name={name} />
            <div
                style={{
                    width: 250,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f5f5f4",
                    fontSize: 28,
                    fontWeight: 900,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                }}
            >
                {name}
            </div>
        </div>
    );
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const home = text(searchParams.get("h"), "Home");
    const away = text(searchParams.get("a"), "Away");
    const kickoff = Number(searchParams.get("t") ?? 0);
    const final = isFinal(home, away);

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: "#09090a",
                    color: "#f5f5f4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Cabinet Grotesk, Arial, sans-serif",
                }}
            >
                <div
                    style={{
                        width: 720,
                        height: 410,
                        borderRadius: 28,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "#171717",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        boxShadow: "0 28px 72px rgba(0,0,0,0.5)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "30px 34px 0",
                            color: "#a1a1aa",
                            fontSize: 18,
                            fontWeight: 700,
                            letterSpacing: 2,
                            textTransform: "uppercase",
                        }}
                    >
                        {final ? (
                            <span style={{ color: "#fbbf24" }}>World Cup Final</span>
                        ) : (
                            <span>World Cup</span>
                        )}
                        <span>{statusLabel(kickoff)}</span>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 20,
                            padding: "34px 36px 38px",
                        }}
                    >
                        <Team name={home} />
                        <div
                            style={{
                                width: 86,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#a1a1aa",
                                fontSize: 24,
                                fontWeight: 800,
                                letterSpacing: 1.5,
                            }}
                        >
                            vs
                        </div>
                        <Team name={away} />
                    </div>

                    <div
                        style={{
                            height: 72,
                            margin: "0 34px 34px",
                            borderRadius: 18,
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#f5f5f4",
                            fontSize: 26,
                            fontWeight: 800,
                        }}
                    >
                        Join contest
                    </div>
                </div>
            </div>
        ),
        size
    );
}
