
export default function ChatSection() {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-4">
                <div className="text-sm font-semibold text-purple-200">Rooms</div>
                <div className="mt-3 space-y-2">
                    {["general", "random", "help"].map((r) => (
                        <button
                            key={r}
                            className="w-full rounded-xl px-3 py-2 text-left text-sm bg-black/30 border border-white/10 hover:bg-white/5 transition"
                        >
                            #{r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-4 flex flex-col">
                <div className="text-sm font-semibold text-purple-200">Chat</div>

                <div className="flex-1 mt-3 rounded-xl bg-black/30 border border-white/10 p-3 space-y-2 text-sm overflow-auto min-h-[320px]">
                    <div className="text-purple-200">sam: hello</div>
                    <div className="text-purple-200">bot: sup</div>
                </div>

                <div className="mt-3 flex gap-2">
                    <input
                        className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        placeholder="Type a message..."
                    />
                    <button className="rounded-xl bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500 transition">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
