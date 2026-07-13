"use client";

// The real room: Socket.IO for live traffic, REST for history.
//
// History comes over HTTP (cached by TanStack Query, paginable) and live updates
// come over the socket — using the socket for both would mean re-downloading the
// backlog on every reconnect.

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import type { ChatMessage, Member, Room, RoomMessage, RoomUser } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface Wire {
    id: string;
    clientId?: string;
    body: string;
    ts: number;
    user: { wallet: string; username: string };
    replyTo?: { id: string; username: string; body: string } | null;
}

const toMessage = (w: Wire): ChatMessage => ({
    id: w.id,
    kind: "chat",
    user: w.user,
    body: w.body,
    ts: w.ts,
    replyTo: w.replyTo ?? null,
});

async function fetchHistory(fixtureId: number): Promise<ChatMessage[]> {
    const res = await fetch(`${API}/api/rooms/${fixtureId}/messages?limit=50`);
    if (!res.ok) throw new Error(`history failed (${res.status})`);
    return ((await res.json()) as Wire[]).map(toMessage);
}

async function fetchMembers(fixtureId: number): Promise<Member[]> {
    const res = await fetch(`${API}/api/rooms/${fixtureId}/members`);
    if (!res.ok) throw new Error(`members failed (${res.status})`);
    return res.json();
}

export function useRoom(matchId: number, me?: RoomUser): Room {
    const [live, setLive] = useState<RoomMessage[]>([]);
    const [pushed, setPushed] = useState<Member[] | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const socket = useRef<Socket | null>(null);

    const { data: history = [] } = useQuery({
        queryKey: ["room-history", matchId],
        queryFn: () => fetchHistory(matchId),
        staleTime: 30_000,
    });

    // Membership is durable (it comes from contest entries), so it's fetched over
    // REST and shows even without a socket — leaving the page must not remove you
    // from the room. The socket only pushes updates on top.
    const { data: seeded = [] } = useQuery({
        queryKey: ["room-members", matchId],
        queryFn: () => fetchMembers(matchId),
        staleTime: 30_000,
    });

    const members = pushed ?? seeded;

    useEffect(() => {
        // Talking needs an identity, so no wallet means no socket. History still
        // renders — reading the room is open to everyone.
        if (!me) return;

        const s = io(API, { auth: { wallet: me.wallet }, transports: ["websocket"] });
        socket.current = s;

        s.on("connect", () => {
            setConnected(true);
            setError(null);
            s.emit("room:join", { fixtureId: matchId });
        });
        s.on("disconnect", () => setConnected(false));

        // Without this the UI sits on "Connecting…" forever when the handshake is
        // rejected (server down, or no profile row for this wallet).
        s.on("connect_error", (e) => {
            setConnected(false);
            setError(
                e.message === "no profile for wallet"
                    ? "Finish setting up your profile to chat."
                    : "Can't reach the chat server."
            );
        });

        // The server sends the full list — entrants (durable) plus anyone connected
        // — each already flagged online/offline and carrying their pick.
        s.on("room:members", ({ members: list }: { members: Member[] }) => {
            setPushed(list);
        });

        s.on("message:new", (wire: Wire) => {
            setLive((prev) => {
                // Our own message is already on screen optimistically — swap the temp
                // copy for the saved one rather than showing it twice.
                if (wire.clientId && prev.some((m) => m.id === wire.clientId)) {
                    return prev.map((m) => (m.id === wire.clientId ? toMessage(wire) : m));
                }
                if (prev.some((m) => m.id === wire.id)) return prev;
                return [...prev, toMessage(wire)];
            });
        });

        s.on("message:rejected", ({ clientId }: { clientId?: string }) => {
            setLive((prev) =>
                prev.map((m) =>
                    m.id === clientId && m.kind === "chat" ? { ...m, pending: false, failed: true } : m
                )
            );
        });

        return () => {
            s.emit("room:leave");
            s.disconnect();
            socket.current = null;
            setConnected(false);
        };
    }, [matchId, me?.wallet]);

    const send = useCallback(
        (body: string, replyTo?: string) => {
            if (!me || !socket.current) return;
            const clientId = `tmp-${Date.now()}`;

            // The optimistic copy quotes from what's already on screen, so the reply
            // renders complete before the server has echoed anything back.
            const parent = replyTo
                ? [...history, ...live].find((m) => m.kind === "chat" && m.id === replyTo)
                : undefined;

            const optimistic: ChatMessage = {
                id: clientId,
                kind: "chat",
                user: me,
                body,
                ts: Date.now(),
                pending: true,
                replyTo:
                    parent && parent.kind === "chat"
                        ? { id: parent.id, username: parent.user.username, body: parent.body }
                        : null,
            };
            setLive((prev) => [...prev, optimistic]);
            socket.current.emit("message:send", { body, clientId, replyTo });
        },
        [me, history, live]
    );

    // History first, then anything that arrived live — deduped, since a message
    // sent just now can also appear in a refetched history.
    const seen = new Set(history.map((m) => m.id));
    const messages: RoomMessage[] = [...history, ...live.filter((m) => !seen.has(m.id))];

    return {
        messages,
        members,
        onlineCount: members.filter((m) => m.online).length,
        connected,
        error,
        send,
    };
}
