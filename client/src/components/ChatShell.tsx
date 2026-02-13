import { useEffect, useState } from "react";
import { useChatSse } from "../services/useChatSse.ts";
import {
    createRoom,
    joinRoom,
    sendMessage,
    pokeRoom,
} from "../services/chatApi.ts";

type Room = { id: string; name: string };
type ChatMessage = {
    message: {
        id: string;
        roomId: string;
        userId: string;
        content: string;
        createdAtUtc: string;
    };
    eventType: string;
};

export default function ChatShell({ apiBaseUrl }: { apiBaseUrl: string }) {
    const { connectionId, onGroupMessage } = useChatSse(apiBaseUrl);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [activeRoom, setActiveRoom] = useState<Room | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");

    // Listen for messages in active room
    useEffect(() => {
        if (!activeRoom) return;

        return onGroupMessage(activeRoom.id, (data) => {
            if (data.eventType === "RoomMessageEvent") {
                setMessages((m) => [...m, data]);
            }

            if (data.eventType === "RoomPokeEvent") {
                console.log("👀 poke", data);
            }
        });
    }, [activeRoom, onGroupMessage]);

    async function handleCreateRoom() {
        const name = prompt("Room name?");
        if (!name || !connectionId) return;

        const room = await createRoom(apiBaseUrl, name);
        setRooms((r) => [...r, room]);

        await joinRoom(apiBaseUrl, room.id, connectionId);
        setActiveRoom(room);
        setMessages([]);
    }

    async function handleJoin(room: Room) {
        if (!connectionId) return;

        await joinRoom(apiBaseUrl, room.id, connectionId);
        setActiveRoom(room);
        setMessages([]);
    }

    async function handleSend() {
        if (!activeRoom || !input.trim()) return;

        await sendMessage(apiBaseUrl, activeRoom.id, input);
        setInput("");
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Rooms */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-purple-100">
                        Rooms
                    </div>
                    <button
                        onClick={handleCreateRoom}
                        className="text-xs text-purple-300 hover:underline"
                    >
                        + New
                    </button>
                </div>

                <div className="mt-3 space-y-2">
                    {rooms.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => handleJoin(r)}
                            className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-slate-200/90 hover:bg-white/5"
                        >
                            #{r.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-purple-100">
                    {activeRoom ? `#${activeRoom.name}` : "Chat"}
                </div>

                <div className="mt-3 h-[420px] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="space-y-3 text-sm text-slate-200/85">
                        {messages.map((m) => (
                            <div
                                key={m.message.id}
                                className="rounded-2xl border border-white/10 bg-white/5 p-3"
                            >
                                <span className="text-purple-200">
                                    {m.message.userId.slice(0, 6)}:
                                </span>{" "}
                                {m.message.content}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-3 flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                        placeholder="Type a message..."
                    />
                    <button
                        onClick={handleSend}
                        className="rounded-2xl bg-purple-600/80 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-600"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
