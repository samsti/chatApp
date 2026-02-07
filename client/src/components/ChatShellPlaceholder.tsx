
export default function ChatShellPlaceholder() {
    return (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Rooms */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-purple-100">Rooms</div>
                <div className="mt-3 space-y-2">
                    {["general", "random", "help"].map((r) => (
                        <button
                            key={r}
                            className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-slate-200/90 transition hover:bg-white/5"
                        >
                            #{r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-purple-100">Chat</div>

                <div className="mt-3 h-[420px] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="space-y-3 text-sm text-slate-200/85">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <span className="text-purple-200">sam:</span> hello
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <span className="text-purple-200">bot:</span> sup
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex gap-2">
                    <input
                        className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-purple-400/40 focus:ring-2 focus:ring-purple-500/20"
                        placeholder="Type a message..."
                    />
                    <button className="rounded-2xl bg-purple-600/80 px-5 py-3 text-sm font-semibold text-white ring-1 ring-purple-300/20 transition hover:bg-purple-600">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
