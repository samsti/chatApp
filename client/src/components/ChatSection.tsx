import { useEffect, useMemo, useRef, useState } from "react";
import { useChatSse } from "../services/useChatSse";
import { createRoom, joinRoom, sendMessage, pokeRoom, getRooms, getMessages, getRoomMembers, getAuthToken } from "../services/chatApi";
import { getCurrentUser } from "../services/AuthService";

type Room = { id: string; name: string };

type RoomMessageEvent = {
    eventType: "RoomMessageEvent";
    message: {
        id: string;
        roomId: string;
        userId: string;
        content: string;
        createdAtUtc: string;
    };
};

type JoinGroupBroadcast = {
    eventType: "JoinGroupBroadcast";
    connectedUsers: { connectionId: string; userName: string }[];
};

type AnyRoomEvent = RoomMessageEvent | JoinGroupBroadcast | { eventType?: string };

type Member = { connectionId: string; userName: string };

export default function ChatSection({ apiBaseUrl }: { apiBaseUrl: string }) {
    const { connectionId, onGroupMessage, onDirectMessage } = useChatSse(apiBaseUrl);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<RoomMessageEvent["message"][]>([]);
    const [input, setInput] = useState("");
    const [status, setStatus] = useState<string>("");
    const [currentUser, setCurrentUser] = useState<{ userId: string; username?: string } | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [pokeToast, setPokeToast] = useState<string | null>(null);

    const prevConnectionIdRef = useRef<string | null>(null);

    const activeRoom = useMemo(
        () => rooms.find((r) => r.id === activeRoomId) ?? null,
        [rooms, activeRoomId]
    );

    // Check for token and set current user on mount
    useEffect(() => {
        try {
            const user = getCurrentUser();
            if (user) {
                setCurrentUser(user);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }

        // Also check for token changes (e.g., after login from another component)
        const interval = setInterval(() => {
            try {
                const user = getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.error('Error checking user:', error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Load existing rooms from server on mount
    useEffect(() => {
        getRooms(apiBaseUrl).then(setRooms).catch(console.error);
    }, [apiBaseUrl]);

    // Listen for SSE events for the active room
    useEffect(() => {
        if (!activeRoomId) return;

        const unsub = onGroupMessage(activeRoomId, (evt: AnyRoomEvent) => {
            if (evt?.eventType === "RoomMessageEvent") {
                const e = evt as RoomMessageEvent;
                setMessages((m) => [...m, e.message]);
            }

            if (evt?.eventType === "JoinGroupBroadcast") {
                const e = evt as JoinGroupBroadcast;
                setMembers(e.connectedUsers);
            }
        });

        return unsub;
    }, [activeRoomId, onGroupMessage]);

    // Listen for direct SSE events (pokes)
    useEffect(() => {
        const unsub = onDirectMessage((evt: any) => {
            if (evt?.eventType === "PokeResponseDto") {
                setPokeToast(`You got poked by ${evt.pokedBy}!`);
                window.setTimeout(() => setPokeToast(null), 3000);
            }
        });

        return unsub;
    }, [onDirectMessage]);

    // Auto-rejoin room when SSE reconnects (new connectionId)
    useEffect(() => {
        const prev = prevConnectionIdRef.current;
        prevConnectionIdRef.current = connectionId;

        // Skip initial connection or if no room is active
        if (!prev || !connectionId || !activeRoomId) return;
        if (prev === connectionId) return;

        // connectionId changed → SSE reconnected, rejoin the active room
        joinRoom(apiBaseUrl, activeRoomId, connectionId).catch(console.error);
    }, [connectionId, activeRoomId, apiBaseUrl]);

    async function handleCreateRoom() {
        if (!getAuthToken()) {
            setStatus("Please login first.");
            window.setTimeout(() => setStatus(""), 1400);
            return;
        }

        if (!connectionId) {
            setStatus("Connecting… try again in a second.");
            return;
        }

        const name = prompt("Room name?");
        if (!name?.trim()) return;

        try {
            const room: Room = await createRoom(apiBaseUrl, name.trim());
            setRooms((rs) => [...rs, room]);

            await joinRoom(apiBaseUrl, room.id, connectionId);
            setActiveRoomId(room.id);
            setMessages([]);
            try {
                const memberList = await getRoomMembers(apiBaseUrl, room.id);
                setMembers(memberList);
            } catch {
                // member load failed
            }
            setStatus(`Joined #${room.name}`);
            window.setTimeout(() => setStatus(""), 1200);
        } catch (e) {
            console.error('Create room error:', e);
            setStatus("Failed to create room. Check console for details.");
            window.setTimeout(() => setStatus(""), 1800);
        }
    }

    async function handleJoinRoom(room: Room) {
        if (!getAuthToken()) {
            setStatus("Please login first.");
            window.setTimeout(() => setStatus(""), 1400);
            return;
        }

        if (!connectionId) {
            setStatus("Connecting… try again in a second.");
            return;
        }

        try {
            await joinRoom(apiBaseUrl, room.id, connectionId);
            setActiveRoomId(room.id);
            setMessages([]);
            try {
                const history = await getMessages(apiBaseUrl, room.id);
                setMessages(history);
            } catch {
                // history load failed, messages stay empty
            }
            try {
                const memberList = await getRoomMembers(apiBaseUrl, room.id);
                setMembers(memberList);
            } catch {
                // member load failed
            }
            setStatus(`Joined #${room.name}`);
            window.setTimeout(() => setStatus(""), 1200);
        } catch {
            setStatus("Failed to join room.");
            window.setTimeout(() => setStatus(""), 1800);
        }
    }

    async function handleSend() {
        if (!getAuthToken()) {
            setStatus("Please login to send messages.");
            window.setTimeout(() => setStatus(""), 1400);
            return;
        }

        if (!activeRoomId) {
            setStatus("Pick a room first.");
            window.setTimeout(() => setStatus(""), 1400);
            return;
        }

        const content = input.trim();
        if (!content) return;

        setInput("");

        try {
            await sendMessage(apiBaseUrl, activeRoomId, content);
        } catch {
            setStatus("Failed to send message.");
            window.setTimeout(() => setStatus(""), 1800);
        }
    }

    async function handlePoke(targetConnectionId: string) {
        if (!getAuthToken()) {
            setStatus("Please login to poke.");
            window.setTimeout(() => setStatus(""), 1400);
            return;
        }

        try {
            await pokeRoom(apiBaseUrl, targetConnectionId);
        } catch {
            setStatus("Failed to poke.");
            window.setTimeout(() => setStatus(""), 1800);
        }
    }

    return (
        <>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_200px]">
            {/* Rooms */}
            <div className="rounded-3xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-purple-200">Rooms</div>
                    <button
                        onClick={handleCreateRoom}
                        className="text-xs text-purple-200/90 hover:text-purple-100 underline-offset-4 hover:underline"
                    >
                        + New
                    </button>
                </div>

                <div className="mt-3 space-y-2">
                    {rooms.length === 0 && (
                        <div className="text-xs text-slate-300/70">
                            No rooms yet. Create one.
                        </div>
                    )}

                    {rooms.map((r) => {
                        const active = r.id === activeRoomId;
                        return (
                            <button
                                key={r.id}
                                onClick={() => handleJoinRoom(r)}
                                className={[
                                    "w-full rounded-xl px-3 py-2 text-left text-sm bg-black/30 border border-white/10 hover:bg-white/5 transition",
                                    active ? "ring-2 ring-purple-500/30 border-purple-400/30" : "",
                                ].join(" ")}
                            >
                                #{r.name}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 space-y-1">
                    <div className="text-[11px] text-slate-300/70">
                        SSE:{" "}
                        <span className={connectionId ? "text-emerald-300" : "text-yellow-200"}>
                            {connectionId ? "connected" : "connecting…"}
                        </span>
                    </div>
                    {currentUser ? (
                        <div className="text-[11px] text-emerald-300">
                            User: {currentUser.username || currentUser.userId?.slice(0, 8) || 'Unknown'}
                        </div>
                    ) : (
                        <div className="text-[11px] text-yellow-200">
                            Not logged in
                        </div>
                    )}
                </div>
            </div>

            {/* Chat */}
            <div className="rounded-3xl bg-white/5 border border-white/10 p-4 flex flex-col">
                <div className="text-sm font-semibold text-purple-200">
                    {activeRoom ? `#${activeRoom.name}` : "Chat"}
                </div>

                {status && (
                    <div className="mt-2 text-xs text-slate-200/80">{status}</div>
                )}

                <div className="flex-1 mt-3 rounded-xl bg-black/30 border border-white/10 p-3 space-y-2 text-sm overflow-auto min-h-[320px]">
                    {messages.length === 0 ? (
                        <div className="text-slate-300/60 text-xs">
                            {activeRoomId ? "No messages yet." : "Join a room to start chatting."}
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className="text-purple-200">
                                <span className="text-purple-200/80">{m.userId}:</span>{" "}
                                <span className="text-slate-100/90">{m.content}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-3 flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend();
                        }}
                        className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        placeholder={activeRoomId ? "Type a message..." : "Join a room first..."}
                        disabled={!activeRoomId}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!activeRoomId || !input.trim()}
                        className="rounded-xl bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500 transition disabled:opacity-40"
                    >
                        Send
                    </button>
                </div>
            </div>

            {/* Members */}
            <div className="rounded-3xl bg-white/5 border border-white/10 p-4">
                <div className="text-sm font-semibold text-purple-200">Members</div>
                <div className="mt-3 space-y-2">
                    {!activeRoomId && (
                        <div className="text-xs text-slate-300/70">Join a room to see members.</div>
                    )}
                    {activeRoomId && members.length === 0 && (
                        <div className="text-xs text-slate-300/70">No members.</div>
                    )}
                    {members.map((m) => (
                        <div
                            key={m.connectionId}
                            className="flex items-center justify-between rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                        >
                            <span className="text-slate-100/90 truncate">
                                {m.userName}
                                {m.connectionId === connectionId && (
                                    <span className="text-purple-300/60 text-xs ml-1">(you)</span>
                                )}
                            </span>
                            {m.connectionId !== connectionId && (
                                <button
                                    onClick={() => handlePoke(m.connectionId)}
                                    className="ml-2 shrink-0 rounded-lg bg-purple-600/30 border border-purple-400/20 px-2 py-0.5 text-xs text-purple-200 hover:bg-purple-500/40 transition"
                                >
                                    Poke
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Poke toast */}
        {pokeToast && (
            <div className="fixed top-6 right-6 z-50 rounded-2xl bg-purple-600 border border-purple-400/40 px-5 py-3 text-sm font-semibold text-white shadow-lg animate-bounce">
                {pokeToast}
            </div>
        )}
        </>
    );
}