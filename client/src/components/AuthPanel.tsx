import React, { useMemo, useState } from "react";
import { jwtService } from "../services/JWTService";

type Mode = "login" | "register";
type AuthResponse = { token?: string };

export default function AuthPanel({ apiBaseUrl }: { apiBaseUrl: string }) {
    const [mode, setMode] = useState<Mode>("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLoggedIn = useMemo(() => !!jwtService.getToken(), []);
    const loggedInUser = useMemo(() => jwtService.getUser(), []); // ✅

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const endpoint = mode === "login" ? "/Login" : "/Register";

            const res = await fetch(`${apiBaseUrl}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `Request failed (${res.status})`);
            }

            const data = (await res.json().catch(() => ({}))) as AuthResponse;
            if (!data.token) throw new Error("No token returned from server. Expected { token: string }");

            jwtService.setToken(data.token);
            jwtService.setUser(username); // ✅ store who logged in
            window.location.reload();
        } catch (err: any) {
            setError(err?.message ?? "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }

    function logout() {
        jwtService.clearToken();
        window.location.reload();
    }

    return (
        <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 ring-1 ring-purple-300/30" />
                <div>
                    <div className="font-semibold">Authentication</div>
                    <div className="text-xs text-slate-400">
                        {!isLoggedIn ? "Login or register" : `Logged in as `}
                        {isLoggedIn && (
                            <span className="text-purple-200 font-semibold">
                {loggedInUser ?? "unknown"}
              </span>
                        )}
                    </div>
                </div>

                <div className="flex rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
                    <button
                        type="button"
                        onClick={() => setMode("login")}
                        disabled={isLoading || isLoggedIn}
                        className={[
                            "px-4 py-2 text-sm rounded-lg transition",
                            mode === "login" ? "bg-purple-500/30 text-purple-100" : "text-slate-300 hover:bg-white/5",
                            (isLoading || isLoggedIn) && "opacity-50 cursor-not-allowed",
                        ].join(" ")}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("register")}
                        disabled={isLoading || isLoggedIn}
                        className={[
                            "px-4 py-2 text-sm rounded-lg transition",
                            mode === "register" ? "bg-purple-500/30 text-purple-100" : "text-slate-300 hover:bg-white/5",
                            (isLoading || isLoggedIn) && "opacity-50 cursor-not-allowed",
                        ].join(" ")}
                    >
                        Register
                    </button>
                </div>
            </div>

            {!isLoggedIn ? (
                <form onSubmit={submit} className="flex gap-2 flex-wrap items-center">
                    <input
                        className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                    />
                    <input
                        className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        placeholder="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !username || !password}
                        className={[
                            "rounded-xl px-5 py-2 text-sm font-semibold text-white transition",
                            "bg-purple-600 hover:bg-purple-500",
                            (isLoading || !username || !password) && "opacity-50 cursor-not-allowed",
                        ].join(" ")}
                    >
                        {isLoading ? "Working..." : mode === "login" ? "Login" : "Create"}
                    </button>

                    {error && (
                        <div className="w-full mt-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                            {error}
                        </div>
                    )}
                </form>
            ) : (
                <button
                    type="button"
                    onClick={logout}
                    className="rounded-xl bg-white/5 px-5 py-2 text-sm ring-1 ring-white/10 transition hover:bg-white/10"
                >
                    Logout
                </button>
            )}
        </div>
    );
}
