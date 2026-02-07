import React from "react";

type Props = { top: React.ReactNode; bottom: React.ReactNode };

export default function ShellLayout({ top, bottom }: Props) {
    return (
        <div className="min-h-screen w-full bg-[#070611] text-slate-100 flex items-center justify-center">
            <div
                className="pointer-events-none fixed inset-0 opacity-30
        [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]
        [background-size:18px_18px]"
            />
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.25),transparent_55%)]" />

            <div className="relative w-full max-w-5xl rounded-[28px] border border-white/20 bg-black/30 p-8 shadow-2xl">
                <div className="space-y-8">
                    <div className="rounded-[24px] border border-white/20 bg-black/40 p-6">{top}</div>
                    <div className="rounded-[36px] border border-white/20 bg-black/40 p-6">{bottom}</div>
                </div>
            </div>
        </div>
    );
}
