"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
    return twMerge(clsx(...inputs));
}

// --- DiceBear Seeds ---
const dicebear = (seed: string) =>
    `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}`;

const USERS = [
    { name: "Felix Hartmann",  email: "felix@studio.io",   role: "Director",   initials: "FH", img: dicebear("Felix") },
    { name: "Zoe Nakamura",    email: "zoe@acme.dev",      role: "Lead Eng",   initials: "ZN", img: dicebear("Zoe") },
    { name: "Kai Lindström",   email: "kai@layers.co",     role: "Designer",   initials: "KL", img: dicebear("Kai") },
    { name: "Luna Vasquez",    email: "luna@corp.io",      role: "Product",    initials: "LV", img: dicebear("Luna") },
    { name: "Mia Okafor",      email: "mia@rise.ai",       role: "Strategy",   initials: "MO", img: dicebear("Mia") },
    { name: "Noel Ashford",    email: "noel@studio.io",    role: "Team Lead",  initials: "NA", img: dicebear("Noel") },
    { name: "Sage Winters",    email: "sage@acme.dev",     role: "Admin",      initials: "SW", img: dicebear("Sage") },
    { name: "River Calloway",  email: "river@layers.co",   role: "Member",     initials: "RC", img: dicebear("River") },
    { name: "Ash Devereux",    email: "ash@corp.io",       role: "Owner",      initials: "AD", img: dicebear("Ash") },
    { name: "Quinn Beaumont",  email: "quinn@rise.ai",     role: "Pro",        initials: "QB", img: dicebear("Quinn") },
];

// ─────────────────────────────────────────────────────────────
// Theme Config
// ─────────────────────────────────────────────────────────────

type ThemeKey = "dark" | "light";

interface ThemeTokens {
    pageBg: string;
    pageText: string;
    cardBg: string;
    cardBorder: string;
    cardHoverBorder: string;
    cardInsetShadow: string;
    avatarInnerBg: string;
    avatarBorder: string;
    sectionBorder: string;
    sectionLabel: string;
    cardLabel: string;
    bodyText: string;
    subtleText: string;
    mutedText: string;
    editBtnBg: string;
    editBtnBorder: string;
    editBtnIcon: string;
    onlineDotBorder: string;
    accountActiveBg: string;
    accountHoverBg: string;
    accountActiveText: string;
    accountInactiveText: string;
    permBorderInactive: string;
    teamCardBg: string;
    teamActionBg: string;
    teamActionBorder: string;
    teamActionHoverBg: string;
    selection: string;
    roleBadgeBorder: string;
    initialsCardBorder: string;
}

const themeConfig: Record<ThemeKey, ThemeTokens> = {
    dark: {
        pageBg:              "bg-[#050505]",
        pageText:            "text-zinc-200",
        cardBg:              "bg-[#0c0c0f]",
        cardBorder:          "border-white/[0.05]",
        cardHoverBorder:     "hover:border-white/[0.09]",
        cardInsetShadow:     "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        avatarInnerBg:       "#080810",
        avatarBorder:        "border-white/[0.08]",
        sectionBorder:       "border-white/[0.04]",
        sectionLabel:        "text-zinc-600",
        cardLabel:           "text-zinc-600",
        bodyText:            "text-zinc-600",
        subtleText:          "text-zinc-600",
        mutedText:           "text-zinc-600",
        editBtnBg:           "bg-zinc-900",
        editBtnBorder:       "border-white/10",
        editBtnIcon:         "#71717a",
        onlineDotBorder:     "border-[#0c0c0f]",
        accountActiveBg:     "bg-white/[0.04]",
        accountHoverBg:      "hover:bg-white/[0.03]",
        accountActiveText:   "text-white",
        accountInactiveText: "text-zinc-400",
        permBorderInactive:  "border-white/[0.04]",
        teamCardBg:          "bg-[#0c0c0f]",
        teamActionBg:        "bg-white/[0.04]",
        teamActionBorder:    "border-white/[0.06]",
        teamActionHoverBg:   "hover:bg-white/[0.08]",
        selection:           "selection:bg-indigo-500/30",
        roleBadgeBorder:     "bg-[#0c0c0f]",
        initialsCardBorder:  "border-white/[0.06]",
    },
    light: {
        pageBg:              "bg-[#fafafa]",
        pageText:            "text-zinc-800",
        cardBg:              "bg-white",
        cardBorder:          "border-zinc-200",
        cardHoverBorder:     "hover:border-zinc-300",
        cardInsetShadow:     "shadow-[inset_0_1px_0_rgba(0,0,0,0.03)]",
        avatarInnerBg:       "#f4f4f5",
        avatarBorder:        "border-zinc-200",
        sectionBorder:       "border-zinc-200",
        sectionLabel:        "text-zinc-400",
        cardLabel:           "text-zinc-400",
        bodyText:            "text-zinc-500",
        subtleText:          "text-zinc-400",
        mutedText:           "text-zinc-400",
        editBtnBg:           "bg-zinc-100",
        editBtnBorder:       "border-zinc-200",
        editBtnIcon:         "#a1a1aa",
        onlineDotBorder:     "border-white",
        accountActiveBg:     "bg-zinc-100",
        accountHoverBg:      "hover:bg-zinc-50",
        accountActiveText:   "text-zinc-900",
        accountInactiveText: "text-zinc-500",
        permBorderInactive:  "border-zinc-200",
        teamCardBg:          "bg-white",
        teamActionBg:        "bg-zinc-50",
        teamActionBorder:    "border-zinc-200",
        teamActionHoverBg:   "hover:bg-zinc-100",
        selection:           "selection:bg-indigo-200/60",
        roleBadgeBorder:     "bg-white",
        initialsCardBorder:  "border-zinc-200",
    },
};

// ─────────────────────────────────────────────────────────────
// Layout Primitives
// ─────────────────────────────────────────────────────────────

const Section = ({
    title,
    children,
    t,
    accentColor,
}: {
    title: string;
    children: React.ReactNode;
    t: ThemeTokens;
    accentColor: string;
}) => (
    <section className="mb-24 relative">
        <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 rounded-3xl"
            style={{
                background: `radial-gradient(ellipse 60% 40% at 30% 50%, ${accentColor}0a 0%, transparent 70%)`,
            }}
        />
        <h2 className={cn("relative mb-8 border-b pb-3 uppercase tracking-[0.25em] text-[10px]", t.sectionBorder, t.sectionLabel)}>
            {title}
        </h2>
        <div className="relative flex flex-wrap gap-10">{children}</div>
    </section>
);

const Card = ({
    label,
    children,
    className,
    t,
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
    t: ThemeTokens;
}) => (
    <div className={cn("flex flex-col gap-3", className)}>
        <div className={cn(
            "flex min-h-[128px] min-w-[200px] items-center justify-center rounded-2xl border p-8 transition-colors duration-200",
            t.cardBg, t.cardBorder, t.cardHoverBorder, t.cardInsetShadow
        )}>
            {children}
        </div>
        <span className={cn("uppercase tracking-[0.25em] text-[10px]", t.cardLabel)}>{label}</span>
    </div>
);

// ─────────────────────────────────────────────────────────────
// SECTION 01 — Profile Headers
// ─────────────────────────────────────────────────────────────

const EditableAvatar = ({ src, t, accentColor }: { src: string; t: ThemeTokens; accentColor: string }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div className="relative flex flex-col items-center gap-3">
            <div
                className="relative h-24 w-24 rounded-full p-[2.5px]"
                style={{
                    background: hovered
                        ? `linear-gradient(135deg, ${accentColor}e6, ${accentColor}b3, ${accentColor}4d)`
                        : `linear-gradient(135deg, ${accentColor}99, ${accentColor}66, transparent 80%)`,
                    transition: "background 0.25s ease",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300"
                    style={{
                        boxShadow: `0 0 32px 4px ${accentColor}40`,
                        opacity: hovered ? 1 : 0,
                    }}
                />
                <div
                    className="relative h-full w-full overflow-hidden rounded-full cursor-pointer"
                    style={{ background: t.avatarInnerBg }}
                >
                    <img
                        src={src}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                        style={{ transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)", transform: hovered ? "scale(1.06)" : "scale(1)" }}
                    />
                    <AnimatePresence>
                        {hovered && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                                style={{ background: "rgba(5,5,10,0.55)", backdropFilter: "blur(6px)" }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-white/70">Edit</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.93 }}
                transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                    "absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border shadow-lg shadow-black/40",
                    t.editBtnBg, t.editBtnBorder
                )}
                style={{ backdropFilter: "blur(8px)" }}
            >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.editBtnIcon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            </motion.button>
        </div>
    );
};

// Two-tier verified profiles
const VerifiedProfile = ({
    src,
    tier = "standard",
    t,
    accentColor,
}: {
    src: string;
    tier?: "standard" | "premium";
    t: ThemeTokens;
    accentColor: string;
}) => {
    const isPremium = tier === "premium";
    // Standard tier uses accentColor, premium uses gold
    const ringBg = isPremium
        ? "linear-gradient(135deg, #f59e0b, #fbbf24, #f97316, #d97706)"
        : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc, ${accentColor}80)`;
    const ringGlow = isPremium
        ? "0 0 20px 2px rgba(245,158,11,0.2)"
        : `0 0 16px 1px ${accentColor}26`;
    const badgeBg = isPremium ? "bg-amber-500 shadow-amber-500/30" : "";
    return (
        <div className="relative flex flex-col items-center gap-2.5">
            {isPremium && (
                <style>{`
                    @keyframes shimmer-ring {
                        0%   { opacity: 0.6; }
                        50%  { opacity: 1; }
                        100% { opacity: 0.6; }
                    }
                `}</style>
            )}
            <div
                className="h-20 w-20 rounded-full p-[2.5px]"
                style={{
                    background: ringBg,
                    animation: isPremium ? "shimmer-ring 2.4s ease-in-out infinite" : undefined,
                    boxShadow: ringGlow,
                }}
            >
                <div className={cn("h-full w-full overflow-hidden rounded-full border-2", t.avatarBorder)}
                    style={{ borderColor: t.avatarInnerBg }}
                >
                    <img src={src} alt="Avatar" className="h-full w-full object-cover" />
                </div>
            </div>
            {/* Badge */}
            <div
                className={cn(
                    "absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-lg",
                    isPremium ? badgeBg : "shadow-[var(--accent-shadow)]"
                )}
                style={{
                    borderColor: t.avatarInnerBg,
                    background: isPremium ? undefined : accentColor,
                    boxShadow: isPremium ? undefined : `0 2px 8px ${accentColor}4d`,
                }}
            >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <span className={cn("text-[9px] uppercase tracking-[0.2em]", t.subtleText)}>
                {isPremium ? "Premium" : "Verified"}
            </span>
        </div>
    );
};

// Badge pill with gradient bg per role
const BADGE_STYLES: Record<string, string> = {
    Admin:       "bg-indigo-500/[0.08] text-indigo-400 border-indigo-500/[0.18]",
    Pro:         "bg-violet-500/[0.08] text-violet-400 border-violet-500/[0.18]",
    "Team Lead": "bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/[0.18]",
};

const BADGE_STYLES_LIGHT: Record<string, string> = {
    Admin:       "bg-indigo-50 text-indigo-600 border-indigo-200",
    Pro:         "bg-violet-50 text-violet-600 border-violet-200",
    "Team Lead": "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const AvatarWithBadge = ({
    src,
    badge,
    t,
    theme,
}: {
    src: string;
    badge: string;
    t: ThemeTokens;
    theme: ThemeKey;
}) => (
    <div className="flex flex-col items-center gap-2.5">
        <div className={cn("h-20 w-20 overflow-hidden rounded-full border ring-1 shadow-[0_0_20px_rgba(0,0,0,0.4)]", t.avatarBorder,
            theme === "dark" ? "ring-white/[0.04]" : "ring-zinc-100"
        )}>
            <img src={src} alt="Avatar" className="h-full w-full object-cover" />
        </div>
        <span className={cn(
            "rounded-full border px-2.5 py-[3px] text-[9px] font-medium uppercase tracking-[0.18em]",
            theme === "dark"
                ? (BADGE_STYLES[badge] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20")
                : (BADGE_STYLES_LIGHT[badge] ?? "bg-zinc-100 text-zinc-500 border-zinc-200")
        )}>
            {badge}
        </span>
    </div>
);

// ─────────────────────────────────────────────────────────────
// SECTION 02 — Social Presence
// ─────────────────────────────────────────────────────────────

const StoryRingAvatar = ({
    src,
    seen = false,
    accentColor,
}: {
    src: string;
    seen?: boolean;
    accentColor: string;
}) => (
    <div className="flex flex-col items-center gap-2">
        <style>{`
            @keyframes conic-spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
            }
        `}</style>
        <div className="relative h-16 w-16">
            {!seen && (
                <div
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `conic-gradient(from 0deg, #f97316, #ec4899, ${accentColor}, #06b6d4, #f97316)`,
                        animation: "conic-spin 3s linear infinite",
                        borderRadius: "50%",
                    }}
                />
            )}
            <div
                className="absolute inset-[2.5px] overflow-hidden rounded-full border-[3px] border-[#050505]"
                style={{ background: seen ? "#27272a" : undefined }}
            >
                <div
                    className="h-full w-full rounded-full overflow-hidden"
                    style={{ border: seen ? "2.5px solid #3f3f46" : undefined }}
                >
                    <img src={src} alt="Avatar" className="h-full w-full object-cover" />
                </div>
            </div>
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">
            {seen ? "Seen" : "New"}
        </span>
    </div>
);

const FollowButton = ({
    user,
    t,
    accentColor,
    theme,
}: {
    user: typeof USERS[0];
    t: ThemeTokens;
    accentColor: string;
    theme: ThemeKey;
}) => {
    const [following, setFollowing] = useState(false);
    return (
        <div className={cn(
            "flex w-60 items-center gap-3 rounded-xl border px-3 py-2.5",
            t.cardBg, t.cardBorder, t.cardInsetShadow
        )}>
            <div className={cn("h-9 w-9 shrink-0 overflow-hidden rounded-full border", t.avatarBorder)}>
                <img src={user.img} alt={user.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={cn("truncate text-[13px] font-semibold leading-tight", theme === "dark" ? "text-white" : "text-zinc-900")}>
                    {user.name}
                </span>
                <span className={cn("truncate text-[10px] uppercase tracking-[0.15em]", t.subtleText)}>{user.role}</span>
            </div>
            <motion.button
                onClick={() => setFollowing(f => !f)}
                whileTap={{ scale: 0.93 }}
                transition={{ duration: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 border",
                    following
                        ? theme === "dark"
                            ? "border-white/[0.08] bg-transparent text-zinc-500 hover:border-red-500/30 hover:text-red-400"
                            : "border-zinc-200 bg-transparent text-zinc-400 hover:border-red-300 hover:text-red-500"
                        : "bg-transparent"
                )}
                style={
                    following
                        ? undefined
                        : {
                            borderColor: `${accentColor}99`,
                            color: accentColor,
                        }
                }
                onMouseEnter={e => {
                    if (!following) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${accentColor}1a`;
                    }
                }}
                onMouseLeave={e => {
                    if (!following) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    }
                }}
            >
                {following ? "Following" : "Follow"}
            </motion.button>
        </div>
    );
};

const MutualFollowers = ({
    main,
    mutuals,
    t,
    theme,
}: {
    main: typeof USERS[0];
    mutuals: typeof USERS;
    t: ThemeTokens;
    theme: ThemeKey;
}) => (
    <div className="flex flex-col items-center gap-3">
        <div className={cn("h-14 w-14 overflow-hidden rounded-full border ring-1", t.avatarBorder,
            theme === "dark" ? "ring-white/[0.04]" : "ring-zinc-100"
        )}>
            <img src={main.img} alt={main.name} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
            <div className="flex -space-x-1.5">
                {mutuals.slice(0, 3).map((u, i) => (
                    <div key={i} className={cn("h-5 w-5 overflow-hidden rounded-full border ring-1",
                        theme === "dark" ? "border-[#050505] ring-white/[0.06]" : "border-white ring-zinc-100"
                    )}>
                        <img src={u.img} alt={u.name} className="h-full w-full object-cover" />
                    </div>
                ))}
            </div>
            <span className={cn("text-[9px] uppercase tracking-[0.18em]", t.subtleText)}>3 mutual connections</span>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────
// SECTION 03 — Role & Permissions
// ─────────────────────────────────────────────────────────────

const RoleBadgeAvatar = ({
    user,
    roleColor,
    t,
    theme,
}: {
    user: typeof USERS[0];
    roleColor: string;
    t: ThemeTokens;
    theme: ThemeKey;
}) => (
    <div
        className={cn(
            "flex h-14 w-52 items-center gap-3 overflow-hidden rounded-xl border pr-3",
            t.permBorderInactive, t.roleBadgeBorder
        )}
        style={{ borderLeftColor: roleColor, borderLeftWidth: "2px" }}
    >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-none">
            <img src={user.img} alt={user.name} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0 gap-0.5">
            <span className={cn("truncate text-[13px] font-semibold leading-tight", theme === "dark" ? "text-white" : "text-zinc-900")}>
                {user.name}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em]" style={{ color: roleColor }}>{user.role}</span>
        </div>
    </div>
);

const PermissionTiers = ({
    t,
    accentColor,
    theme,
}: {
    t: ThemeTokens;
    accentColor: string;
    theme: ThemeKey;
}) => {
    const tiers = [
        {
            label: "Owner",
            initials: "OW",
            ringStyle: { background: "linear-gradient(135deg, #f59e0b, #fbbf24, #f97316)" },
            glow: "0 0 18px 2px rgba(245,158,11,0.22)",
            cardBgDark: "bg-amber-500/[0.04]",
            cardBgLight: "bg-amber-50",
            badgeDark: "text-amber-400 bg-amber-500/[0.08] border-amber-500/[0.18]",
            badgeLight: "text-amber-600 bg-amber-50 border-amber-200",
        },
        {
            label: "Admin",
            initials: "AD",
            ringStyle: { background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}, ${accentColor}80)` },
            glow: `0 0 18px 2px ${accentColor}38`,
            cardBgDark: "bg-indigo-500/[0.04]",
            cardBgLight: "bg-indigo-50",
            badgeDark: "text-indigo-400 bg-indigo-500/[0.08] border-indigo-500/[0.18]",
            badgeLight: "text-indigo-600 bg-indigo-50 border-indigo-200",
        },
        {
            label: "Member",
            initials: "MB",
            ringStyle: { background: "linear-gradient(135deg, #52525b, #71717a)" },
            glow: "0 0 14px 1px rgba(113,113,122,0.15)",
            cardBgDark: "",
            cardBgLight: "",
            badgeDark: "text-zinc-500 bg-zinc-500/[0.08] border-zinc-500/[0.18]",
            badgeLight: "text-zinc-500 bg-zinc-100 border-zinc-200",
        },
    ];
    return (
        <div className="flex gap-4">
            {tiers.map((tier) => (
                <div
                    key={tier.label}
                    className={cn(
                        "flex flex-col items-center gap-2.5 rounded-xl border p-4",
                        t.permBorderInactive,
                        theme === "dark" ? tier.cardBgDark : tier.cardBgLight
                    )}
                >
                    <div className="h-12 w-12 rounded-full p-[2px]" style={{ ...tier.ringStyle, boxShadow: tier.glow }}>
                        <div
                            className="flex h-full w-full items-center justify-center rounded-full text-[11px] font-bold tracking-wider text-white"
                            style={{ background: theme === "dark" ? "#0a0a0d" : "#1e1e2e" }}
                        >
                            {tier.initials}
                        </div>
                    </div>
                    <span className={cn(
                        "rounded-full border px-2 py-[3px] text-[8px] font-medium uppercase tracking-[0.2em]",
                        theme === "dark" ? tier.badgeDark : tier.badgeLight
                    )}>
                        {tier.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

const TeamMemberCard = ({
    user,
    t,
    accentColor,
    theme,
}: {
    user: typeof USERS[0];
    t: ThemeTokens;
    accentColor: string;
    theme: ThemeKey;
}) => {
    const [showActions, setShowActions] = useState(false);
    return (
        <motion.div
            className={cn(
                "flex w-64 items-center gap-3 rounded-xl border p-3 transition-colors duration-200",
                t.teamCardBg, t.cardBorder, t.cardHoverBorder, t.cardInsetShadow
            )}
            onHoverStart={() => setShowActions(true)}
            onHoverEnd={() => setShowActions(false)}
        >
            <div className="relative shrink-0">
                <div className={cn("h-10 w-10 overflow-hidden rounded-full border", t.avatarBorder)}>
                    <img src={user.img} alt={user.name} className="h-full w-full object-cover" />
                </div>
                <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 bg-emerald-500 shadow shadow-emerald-500/30", t.onlineDotBorder)} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={cn("truncate text-[13px] font-semibold leading-tight", theme === "dark" ? "text-white" : "text-zinc-900")}>
                    {user.name}
                </span>
                <span className={cn("truncate text-[9px]", t.subtleText)}>{user.email}</span>
                <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: accentColor, opacity: 0.8 }}>
                    {user.role}
                </span>
            </div>
            <AnimatePresence>
                {showActions && (
                    <motion.div
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 4 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="flex shrink-0 items-center gap-1"
                    >
                        <button className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg border transition-colors",
                            t.teamActionBg, t.teamActionBorder, t.teamActionHoverBg
                        )}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={t.editBtnIcon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </button>
                        <button className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg border transition-colors",
                            t.teamActionBg, t.teamActionBorder, t.teamActionHoverBg
                        )}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={t.editBtnIcon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="5"  r="1" fill={t.editBtnIcon} />
                                <circle cx="12" cy="12" r="1" fill={t.editBtnIcon} />
                                <circle cx="12" cy="19" r="1" fill={t.editBtnIcon} />
                            </svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─────────────────────────────────────────────────────────────
// SECTION 04 — Auth & Account
// ─────────────────────────────────────────────────────────────

const ACCOUNTS = [
    { email: "felix@studio.io",  name: "Felix Hartmann", img: dicebear("Felix") },
    { email: "zoe@acme.dev",     name: "Zoe Nakamura",   img: dicebear("Zoe") },
    { email: "kai@layers.co",    name: "Kai Lindström",  img: dicebear("Kai") },
];

const MultiAccountSwitcher = ({
    t,
    accentColor,
    theme,
}: {
    t: ThemeTokens;
    accentColor: string;
    theme: ThemeKey;
}) => {
    const [active, setActive] = useState(0);
    return (
        <div className={cn(
            "flex w-64 flex-col gap-0.5 rounded-xl border p-1.5",
            t.cardBg, t.cardBorder, t.cardInsetShadow
        )}>
            {ACCOUNTS.map((acc, i) => (
                <motion.button
                    key={i}
                    onClick={() => setActive(i)}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.1 }}
                    className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 overflow-hidden",
                        active === i ? t.accountActiveBg : t.accountHoverBg
                    )}
                >
                    {active === i && (
                        <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r-full"
                            style={{ background: accentColor, opacity: 0.8 }}
                        />
                    )}
                    <div className="relative shrink-0">
                        <div className={cn("h-8 w-8 overflow-hidden rounded-full border", t.avatarBorder)}>
                            <img src={acc.img} alt={acc.name} className="h-full w-full object-cover" />
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-col items-start gap-0.5">
                        <span className={cn("truncate text-[12px] font-semibold leading-tight", active === i ? t.accountActiveText : t.accountInactiveText)}>
                            {acc.name}
                        </span>
                        <span className={cn("truncate text-[9px]", t.subtleText)}>{acc.email}</span>
                    </div>
                    {active === i && (
                        <svg className="ml-auto shrink-0" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </motion.button>
            ))}
        </div>
    );
};

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const INITIALS_COLORS_DARK = [
    { bg: "bg-violet-950/70", text: "text-violet-300", ring: "ring-violet-500/[0.15]" },
    { bg: "bg-emerald-950/70", text: "text-emerald-300", ring: "ring-emerald-500/[0.15]" },
    { bg: "bg-rose-950/70", text: "text-rose-300", ring: "ring-rose-500/[0.15]" },
    { bg: "bg-sky-950/70", text: "text-sky-300", ring: "ring-sky-500/[0.15]" },
];

const INITIALS_COLORS_LIGHT = [
    { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-200" },
    { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
    { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-200" },
    { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-200" },
];

const AccountInitials = ({ t, theme }: { t: ThemeTokens; theme: ThemeKey }) => {
    const names = ["Jordan Bell", "Taylor Kim", "Avery Sun", "Quinn Park"];
    const palette = theme === "dark" ? INITIALS_COLORS_DARK : INITIALS_COLORS_LIGHT;
    return (
        <div className="flex gap-2.5">
            {names.map((name, i) => {
                const c = palette[i % palette.length];
                return (
                    <div
                        key={i}
                        className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full ring-1 text-[11px] font-bold tracking-[0.12em] border",
                            t.initialsCardBorder,
                            c.bg, c.text, c.ring
                        )}
                    >
                        {getInitials(name)}
                    </div>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Platform Badge Icons
// ─────────────────────────────────────────────────────────────

type Platform = "twitter" | "github" | "linkedin";

const TwitterIcon = () => (
    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 shadow-md">
        {/* Twitter / X bird */}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#a1a1aa">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    </div>
);

const GithubIcon = () => (
    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 shadow-md">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#a1a1aa">
            <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
    </div>
);

const LinkedInIcon = () => (
    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400/60 bg-[#0a66c2] shadow-md">
        <span className="text-[7px] font-bold text-white leading-none tracking-tight">in</span>
    </div>
);

const PlatformBadge = ({ platform }: { platform: Platform }) => {
    if (platform === "twitter") return <TwitterIcon />;
    if (platform === "github") return <GithubIcon />;
    return <LinkedInIcon />;
};

const ConnectedProfile = ({
    src,
    name,
    platform,
    t,
    theme,
}: {
    src: string;
    name: string;
    platform: Platform;
    t: ThemeTokens;
    theme: ThemeKey;
}) => (
    <div className="flex flex-col items-center gap-2.5">
        <div className="relative">
            <div className={cn("h-16 w-16 overflow-hidden rounded-full border ring-1", t.avatarBorder,
                theme === "dark" ? "ring-white/[0.04]" : "ring-zinc-100"
            )}>
                <img src={src} alt={name} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-2 flex -space-x-1">
                <PlatformBadge platform={platform} />
            </div>
        </div>
        <span className={cn("text-[10px] uppercase tracking-[0.18em]", t.subtleText)}>{name}</span>
    </div>
);

// ─────────────────────────────────────────────────────────────
// Page Export
// ─────────────────────────────────────────────────────────────

interface ProfileAvatarsPageProps {
    theme?: "dark" | "light";
    accentColor?: string;
    platform?: "twitter" | "github" | "linkedin";
}

export default function ProfileAvatarsPage({
    theme = "dark",
    accentColor = "#6366f1",
    platform = "twitter",
}: ProfileAvatarsPageProps) {
    const t = themeConfig[theme];

    return (
        <div className={cn("min-h-screen w-full p-12", t.pageBg, t.pageText, t.selection)}>

            {/* Header */}
            <header className="mb-24">
                <div className={cn(
                    "mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1",
                    theme === "dark" ? "border-white/[0.05] bg-white/[0.03]" : "border-zinc-200 bg-zinc-100/60"
                )}>
                    <span
                        className="h-1.5 w-1.5 animate-pulse rounded-full"
                        style={{ background: accentColor, opacity: 0.8 }}
                    />
                    <span className={cn("uppercase tracking-[0.25em] text-[9px]", t.subtleText)}>
                        Uilora · Avatar System
                    </span>
                </div>
                <h1 className={cn("text-5xl font-light tracking-tight", theme === "dark" ? "text-white" : "text-zinc-900")}>
                    Profile <span className={t.mutedText}>Identity</span>
                </h1>
                <p className={cn("mt-5 max-w-lg text-base font-light leading-relaxed", t.bodyText)}>
                    Avatar components for real-world profile contexts — editable states,
                    verified accounts, social presence, role tiers, and auth flows.
                </p>
            </header>

            {/* 01 / Profile Headers */}
            <Section title="01 / Profile Headers" t={t} accentColor={accentColor}>
                <Card label="Editable Avatar" t={t}>
                    <EditableAvatar src={dicebear("Felix")} t={t} accentColor={accentColor} />
                </Card>
                <Card label="Standard Verified" t={t}>
                    <VerifiedProfile src={dicebear("Zoe")} tier="standard" t={t} accentColor={accentColor} />
                </Card>
                <Card label="Premium Verified" t={t}>
                    <VerifiedProfile src={dicebear("Luna")} tier="premium" t={t} accentColor={accentColor} />
                </Card>
                <Card label="Role Badge" t={t}>
                    <div className="flex gap-5">
                        <AvatarWithBadge src={dicebear("Kai")}   badge="Admin"     t={t} theme={theme} />
                        <AvatarWithBadge src={dicebear("Quinn")} badge="Pro"       t={t} theme={theme} />
                        <AvatarWithBadge src={dicebear("Noel")}  badge="Team Lead" t={t} theme={theme} />
                    </div>
                </Card>
            </Section>

            {/* 02 / Social Presence */}
            <Section title="02 / Social Presence" t={t} accentColor={accentColor}>
                <Card label="Story Ring" t={t}>
                    <div className="flex gap-6">
                        <StoryRingAvatar src={dicebear("Mia")}  seen={false} accentColor={accentColor} />
                        <StoryRingAvatar src={dicebear("Sage")} seen={true}  accentColor={accentColor} />
                    </div>
                </Card>
                <Card label="Follow Suggestion" t={t} className="min-w-[280px]">
                    <FollowButton user={USERS[2]} t={t} accentColor={accentColor} theme={theme} />
                </Card>
                <Card label="Mutual Followers" t={t}>
                    <MutualFollowers main={USERS[3]} mutuals={USERS} t={t} theme={theme} />
                </Card>
            </Section>

            {/* 03 / Role & Permissions */}
            <Section title="03 / Role & Permissions" t={t} accentColor={accentColor}>
                <Card label="Role Color Border" t={t}>
                    <div className="flex flex-col gap-2">
                        <RoleBadgeAvatar user={USERS[0]} roleColor="#f59e0b" t={t} theme={theme} />
                        <RoleBadgeAvatar user={USERS[1]} roleColor={accentColor} t={t} theme={theme} />
                        <RoleBadgeAvatar user={USERS[2]} roleColor="#52525b" t={t} theme={theme} />
                    </div>
                </Card>
                <Card label="Permission Tiers" t={t}>
                    <PermissionTiers t={t} accentColor={accentColor} theme={theme} />
                </Card>
                <Card label="Team Member Card" t={t} className="min-w-[300px]">
                    <TeamMemberCard user={USERS[4]} t={t} accentColor={accentColor} theme={theme} />
                </Card>
            </Section>

            {/* 04 / Auth & Account */}
            <Section title="04 / Auth & Account" t={t} accentColor={accentColor}>
                <Card label="Multi-Account Switcher" t={t} className="min-w-[290px]">
                    <MultiAccountSwitcher t={t} accentColor={accentColor} theme={theme} />
                </Card>
                <Card label="Initials Fallback" t={t}>
                    <AccountInitials t={t} theme={theme} />
                </Card>
                <Card label="Connected Profile" t={t}>
                    <ConnectedProfile src={dicebear("River")} name="River Calloway" platform={platform} t={t} theme={theme} />
                </Card>
            </Section>

        </div>
    );
}

export { ProfileAvatarsPage as ProfileAvatars };
