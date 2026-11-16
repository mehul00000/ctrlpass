"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

// --- DiceBear avatar helpers ---
const SEEDS = [
  "Jordan",
  "Riley",
  "Morgan",
  "Taylor",
  "Blake",
  "Avery",
  "Cameron",
  "Drew",
  "Skyler",
  "Reese",
];

function dicebear(seed: string) {
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}`;
}

// --- Mock Data ---
const TEAM = [
  {
    name: "Jordan Lee",
    role: "Design Lead",
    dept: "Design",
    email: "jordan@uilora.io",
    img: dicebear(SEEDS[0]),
    initials: "JL",
    color: "from-violet-500 to-indigo-600",
    seed: SEEDS[0],
  },
  {
    name: "Riley Webb",
    role: "Engineering",
    dept: "Platform",
    email: "riley@uilora.io",
    img: dicebear(SEEDS[1]),
    initials: "RW",
    color: "from-sky-500 to-cyan-600",
    seed: SEEDS[1],
  },
  {
    name: "Morgan Nair",
    role: "Product",
    dept: "Strategy",
    email: "morgan@uilora.io",
    img: dicebear(SEEDS[2]),
    initials: "MN",
    color: "from-rose-500 to-pink-600",
    seed: SEEDS[2],
  },
  {
    name: "Taylor Baxter",
    role: "Backend",
    dept: "Infrastructure",
    email: "taylor@uilora.io",
    img: dicebear(SEEDS[3]),
    initials: "TB",
    color: "from-amber-500 to-orange-600",
    seed: SEEDS[3],
  },
  {
    name: "Blake Zhao",
    role: "Data",
    dept: "Analytics",
    email: "blake@uilora.io",
    img: dicebear(SEEDS[4]),
    initials: "BZ",
    color: "from-emerald-500 to-teal-600",
    seed: SEEDS[4],
  },
  {
    name: "Avery Osei",
    role: "DevOps",
    dept: "Platform",
    email: "avery@uilora.io",
    img: dicebear(SEEDS[5]),
    initials: "AO",
    color: "from-blue-500 to-indigo-600",
    seed: SEEDS[5],
  },
];

// --- Theme config ---
type ThemeKey = "dark" | "light";

interface ThemeConfig {
  root: string;
  glowOverlay: string;
  sectionBorder: string;
  sectionIndex: string;
  sectionTitle: string;
  sectionSubtitle: string;
  cardBg: string;
  cardBorder: string;
  cardHoverBg: string;
  cardHoverBorder: string;
  cardLabel: string;
  headerPillBg: string;
  headerPillBorder: string;
  headerPillText: string;
  headerPillDot: string;
  headingPrimary: string;
  headingSecondary: string;
  bodyText: string;
  avatarBorder: string;
  avatarBg: string;
  avatarStackBorder: string;
  divider: string;
  rowHoverBg: string;
  rowText: string;
  rowTextHover: string;
  rowMetaText: string;
  ownerCardBg: string;
  ownerCardBorder: string;
  viewerDocBg: string;
  viewerDocBorder: string;
  viewerDocInnerBorder: string;
  viewerSkeletonBg: string;
  commentCardBg: string;
  commentCardBorder: string;
  commentQuoteBg: string;
  commentQuoteBorder: string;
  commentQuoteText: string;
  memberRowBg: string;
  memberRowBorder: string;
  memberRowHoverBg: string;
  memberRowHoverBorder: string;
  memberNameText: string;
  memberEmailText: string;
  memberDeptBg: string;
  memberDeptBorder: string;
  memberDeptText: string;
  teamCardBg: string;
  teamCardBorder: string;
  teamCardHoverBorder: string;
  teamCardNameText: string;
  teamCardRoleText: string;
  teamCardDeptBg: string;
  teamCardDeptBorder: string;
  teamCardDeptText: string;
  actionBtnBorder: string;
  actionBtnText: string;
  actionBtnHoverBorder: string;
  pendingAvatarBg: string;
  pendingAvatarBorder: string;
  pendingEmailText: string;
  addBtnBorder: string;
  addBtnText: string;
  ownerLabelText: string;
  ownerBg: string;
  ownerBorder: string;
  transferText: string;
  multiAssigneeLabelText: string;
  resolveBtn: string;
  resolveBtnHover: string;
  docTitleText: string;
  docDot: string;
  viewerCountText: string;
  facepileCountBg: string;
  facepileCountBorder: string;
  facepileReviewersText: string;
  assigneesLabelText: string;
  editingNameText: string;
  editingActionText: string;
  editingIconStroke: string;
  editingBadgeBg: string;
  editingBadgeBorder: string;
}

const themeConfig: Record<ThemeKey, ThemeConfig> = {
  dark: {
    root: "bg-[#080810] text-white",
    glowOverlay:
      "radial-gradient(ellipse at top, rgba(99,102,241,0.06) 0%, transparent 60%)",
    sectionBorder: "border-white/[0.04]",
    sectionIndex: "text-indigo-500/60",
    sectionTitle: "text-white/90",
    sectionSubtitle: "text-white/30",
    cardBg: "bg-[#0d0d14]",
    cardBorder: "border-indigo-500/[0.07]",
    cardHoverBg: "hover:bg-[#0f0f18]",
    cardHoverBorder: "hover:border-indigo-500/[0.13]",
    cardLabel: "text-white/20",
    headerPillBg: "bg-white/[0.03]",
    headerPillBorder: "border-white/[0.06]",
    headerPillText: "text-white/35",
    headerPillDot: "bg-indigo-400",
    headingPrimary: "text-white",
    headingSecondary: "text-white/20",
    bodyText: "text-white/30",
    avatarBorder: "border-white/[0.07]",
    avatarBg: "bg-[#11111c]",
    avatarStackBorder: "border-[#080810]",
    divider: "divide-white/[0.04]",
    rowHoverBg: "hover:bg-indigo-500/[0.04]",
    rowText: "text-white/50",
    rowTextHover: "group-hover:text-white/65",
    rowMetaText: "text-white/30",
    ownerCardBg: "bg-[#0d0d14]",
    ownerCardBorder: "border-indigo-500/[0.07]",
    viewerDocBg: "bg-[#0d0d14]",
    viewerDocBorder: "border-indigo-500/[0.07]",
    viewerDocInnerBorder: "border-white/[0.04]",
    viewerSkeletonBg: "bg-white/[0.04]",
    commentCardBg: "bg-[#0d0d14]",
    commentCardBorder: "border-indigo-500/[0.07]",
    commentQuoteBg: "bg-indigo-500/[0.04]",
    commentQuoteBorder: "border-indigo-500/40",
    commentQuoteText: "text-white/40",
    memberRowBg: "bg-[#0d0d14]",
    memberRowBorder: "border-indigo-500/[0.05]",
    memberRowHoverBg: "hover:bg-[#0f0f18]",
    memberRowHoverBorder: "hover:border-indigo-500/[0.10]",
    memberNameText: "text-white/80",
    memberEmailText: "text-white/30",
    memberDeptBg: "bg-transparent",
    memberDeptBorder: "border-white/[0.06]",
    memberDeptText: "text-white/25",
    teamCardBg: "from-[#0f0f1a] to-[#0d0d14]",
    teamCardBorder: "border-indigo-500/[0.07]",
    teamCardHoverBorder: "hover:border-indigo-500/[0.15]",
    teamCardNameText: "text-white/75",
    teamCardRoleText: "text-white/30",
    teamCardDeptBg: "bg-indigo-500/[0.07]",
    teamCardDeptBorder: "border-indigo-500/[0.12]",
    teamCardDeptText: "text-indigo-400/50",
    actionBtnBorder: "border-white/[0.06]",
    actionBtnText: "text-white/25",
    actionBtnHoverBorder: "hover:border-indigo-500/20",
    pendingAvatarBg: "bg-[#0e0e1a]",
    pendingAvatarBorder: "border-white/[0.06]",
    pendingEmailText: "text-white/20",
    addBtnBorder: "border-white/20",
    addBtnText: "text-white/30",
    ownerLabelText: "text-indigo-300",
    ownerBg: "bg-indigo-500/[0.07]",
    ownerBorder: "border-indigo-500/[0.10]",
    transferText: "text-white/20",
    multiAssigneeLabelText: "text-white/20",
    resolveBtn: "text-white/25 border-white/[0.06]",
    resolveBtnHover: "hover:border-white/10 hover:text-white/40",
    docTitleText: "text-white/20",
    docDot: "bg-white/10",
    viewerCountText: "text-white/30",
    facepileCountBg: "bg-[#0e0e1c]",
    facepileCountBorder: "border-[#080810]",
    facepileReviewersText: "text-white/30",
    assigneesLabelText: "text-white/20",
    editingNameText: "text-indigo-400/80",
    editingActionText: "text-white/25",
    editingIconStroke: "#818cf8",
    editingBadgeBg: "bg-[#0e0e1c]",
    editingBadgeBorder: "border-indigo-500/40",
  },
  light: {
    root: "bg-white text-zinc-900",
    glowOverlay:
      "radial-gradient(ellipse at top, rgba(99,102,241,0.04) 0%, transparent 60%)",
    sectionBorder: "border-zinc-200",
    sectionIndex: "text-indigo-400/70",
    sectionTitle: "text-zinc-800",
    sectionSubtitle: "text-zinc-400",
    cardBg: "bg-white",
    cardBorder: "border-zinc-200",
    cardHoverBg: "hover:bg-zinc-50",
    cardHoverBorder: "hover:border-zinc-300",
    cardLabel: "text-zinc-400",
    headerPillBg: "bg-zinc-100",
    headerPillBorder: "border-zinc-200",
    headerPillText: "text-zinc-500",
    headerPillDot: "bg-indigo-500",
    headingPrimary: "text-zinc-900",
    headingSecondary: "text-zinc-300",
    bodyText: "text-zinc-500",
    avatarBorder: "border-zinc-200",
    avatarBg: "bg-zinc-100",
    avatarStackBorder: "border-white",
    divider: "divide-zinc-100",
    rowHoverBg: "hover:bg-indigo-50/60",
    rowText: "text-zinc-500",
    rowTextHover: "group-hover:text-zinc-700",
    rowMetaText: "text-zinc-400",
    ownerCardBg: "bg-white",
    ownerCardBorder: "border-zinc-200",
    viewerDocBg: "bg-white",
    viewerDocBorder: "border-zinc-200",
    viewerDocInnerBorder: "border-zinc-100",
    viewerSkeletonBg: "bg-zinc-100",
    commentCardBg: "bg-white",
    commentCardBorder: "border-zinc-200",
    commentQuoteBg: "bg-indigo-50",
    commentQuoteBorder: "border-indigo-300/60",
    commentQuoteText: "text-zinc-500",
    memberRowBg: "bg-white",
    memberRowBorder: "border-zinc-200",
    memberRowHoverBg: "hover:bg-zinc-50",
    memberRowHoverBorder: "hover:border-zinc-300",
    memberNameText: "text-zinc-800",
    memberEmailText: "text-zinc-400",
    memberDeptBg: "bg-transparent",
    memberDeptBorder: "border-zinc-200",
    memberDeptText: "text-zinc-400",
    teamCardBg: "from-zinc-50 to-white",
    teamCardBorder: "border-zinc-200",
    teamCardHoverBorder: "hover:border-zinc-300",
    teamCardNameText: "text-zinc-800",
    teamCardRoleText: "text-zinc-400",
    teamCardDeptBg: "bg-indigo-50",
    teamCardDeptBorder: "border-indigo-200/60",
    teamCardDeptText: "text-indigo-500/70",
    actionBtnBorder: "border-zinc-200",
    actionBtnText: "text-zinc-400",
    actionBtnHoverBorder: "hover:border-indigo-300/60",
    pendingAvatarBg: "bg-zinc-100",
    pendingAvatarBorder: "border-zinc-200",
    pendingEmailText: "text-zinc-400",
    addBtnBorder: "border-zinc-300",
    addBtnText: "text-zinc-400",
    ownerLabelText: "text-indigo-600",
    ownerBg: "bg-indigo-50",
    ownerBorder: "border-indigo-200/60",
    transferText: "text-zinc-400",
    multiAssigneeLabelText: "text-zinc-400",
    resolveBtn: "text-zinc-400 border-zinc-200",
    resolveBtnHover: "hover:border-zinc-300 hover:text-zinc-600",
    docTitleText: "text-zinc-400",
    docDot: "bg-zinc-300",
    viewerCountText: "text-zinc-400",
    facepileCountBg: "bg-zinc-100",
    facepileCountBorder: "border-white",
    facepileReviewersText: "text-zinc-400",
    assigneesLabelText: "text-zinc-400",
    editingNameText: "text-indigo-600/80",
    editingActionText: "text-zinc-400",
    editingIconStroke: "#6366f1",
    editingBadgeBg: "bg-white",
    editingBadgeBorder: "border-indigo-300/60",
  },
};

// --- DiceBear Avatar component ---
const DAvatar = ({
  seed,
  name,
  size = 36,
  className,
}: {
  seed: string;
  name: string;
  size?: number;
  className?: string;
}) => (
  <img
    src={dicebear(seed)}
    alt={name}
    width={size}
    height={size}
    className={cn("object-cover", className)}
    style={{ width: size, height: size }}
  />
);

// --- Layout Helpers ---
const Section = ({
  index,
  title,
  subtitle,
  children,
  t,
}: {
  index: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  t: ThemeConfig;
}) => (
  <section className="mb-24">
    <div
      className={cn(
        "mb-10 flex items-start gap-6 border-b pb-6",
        t.sectionBorder
      )}
    >
      <span
        className={cn(
          "mt-0.5 font-mono text-[10px] tracking-[0.25em]",
          t.sectionIndex
        )}
      >
        {index}
      </span>
      <div>
        <h2 className={cn("text-base font-semibold tracking-tight", t.sectionTitle)}>
          {title}
        </h2>
        <p className={cn("mt-1 text-xs leading-relaxed", t.sectionSubtitle)}>
          {subtitle}
        </p>
      </div>
    </div>
    <div className="flex flex-wrap gap-8">{children}</div>
  </section>
);

const Card = ({
  label,
  children,
  className,
  wide,
  t,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  t: ThemeConfig;
}) => (
  <div className={cn("flex flex-col gap-3", wide ? "w-full" : "", className)}>
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl border p-8 backdrop-blur-sm transition-colors duration-200",
        t.cardBg,
        t.cardBorder,
        t.cardHoverBg,
        t.cardHoverBorder,
        wide ? "min-h-[100px] w-full" : "min-h-[120px] min-w-[220px]"
      )}
    >
      {children}
    </div>
    <span
      className={cn(
        "px-1 text-[10px] font-medium uppercase tracking-[0.18em]",
        t.cardLabel
      )}
    >
      {label}
    </span>
  </div>
);

// ─── Section 01: Team Presence ────────────────────────────────────────────────

/** Horizontal presence strip — pill bar with avatars + online count badge */
const OnlineNowStrip = ({
  t,
  accentColor,
  onlineCount,
}: {
  t: ThemeConfig & { theme: ThemeKey };
  accentColor: string;
  onlineCount: number;
}) => {
  const clampedCount = Math.min(onlineCount, TEAM.length);
  const online = TEAM.slice(0, clampedCount);
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-full border px-5 py-2.5",
        t.theme === "light"
          ? "border-zinc-200 bg-white shadow-sm"
          : "border-indigo-500/[0.10] bg-[#0a0a15] shadow-[0_0_0_1px_rgba(99,102,241,0.04),inset_0_1px_0_rgba(255,255,255,0.03)]"
      )}
    >
      <div className="flex -space-x-2">
        {online.map((u, i) => (
          <motion.div
            key={u.name}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: i * 0.06,
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "relative h-7 w-7 overflow-hidden rounded-full border-[2px]",
              t.avatarStackBorder,
              t.avatarBg
            )}
            style={{ zIndex: online.length - i }}
          >
            <DAvatar seed={u.seed} name={u.name} size={28} />
            <span
              className="absolute bottom-0 right-0 block h-2 w-2 rounded-full border-[1.5px] bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.7)]"
              style={{ borderColor: "inherit" }}
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-50" />
            </span>
          </motion.div>
        ))}
      </div>
      {/* right-aligned count badge */}
      <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/[0.09] border border-emerald-500/[0.18] px-2.5 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
        <span
          className="text-[10px] font-semibold"
          style={{ color: accentColor }}
        >
          {clampedCount} online
        </span>
      </div>
    </div>
  );
};

// Helper to attach theme key for conditional inline logic in components
// We expose it by passing t with a hidden `theme` field at call site via type cast
type ThemeConfigWithKey = ThemeConfig & { theme: ThemeKey };

/** Overlapping facepile with +N overflow count */
const FacepileWithCount = ({
  t,
  accentColor,
}: {
  t: ThemeConfigWithKey;
  accentColor: string;
}) => {
  const visible = TEAM.slice(0, 4);
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-3">
        {visible.map((u, i) => (
          <motion.div
            key={u.name}
            whileHover={{ y: -4, zIndex: 20 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative h-11 w-11 cursor-pointer overflow-hidden rounded-full border-[2.5px] shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
              t.avatarStackBorder,
              t.avatarBg
            )}
            style={{ zIndex: visible.length - i }}
          >
            <DAvatar seed={u.seed} name={u.name} size={44} />
          </motion.div>
        ))}
        <div
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-full border-[2.5px] text-[10px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
            t.facepileCountBg,
            t.facepileCountBorder
          )}
          style={{ zIndex: 0, color: accentColor }}
        >
          +12
        </div>
      </div>
      <span className={cn("text-xs", t.facepileReviewersText)}>
        16 reviewers
      </span>
    </div>
  );
};

/** 2×3 grid of small status avatars */
const PresenceGrid = ({
  t,
  onlineCount,
}: {
  t: ThemeConfig;
  onlineCount: number;
}) => {
  const clampedCount = Math.min(onlineCount, TEAM.length);
  const statuses: ("online" | "away" | "offline")[] = TEAM.map((_, i) => {
    if (i < clampedCount) return "online";
    // Distribute remaining slots between away and offline
    return i % 2 === 0 ? "away" : "offline";
  });
  const dotColor = {
    online: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.75)]",
    away: "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.55)]",
    offline: "bg-zinc-400",
  };
  return (
    <div className="grid grid-cols-3 gap-4">
      {TEAM.map((u, i) => (
        <motion.div
          key={u.name}
          className="group relative cursor-default"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: i * 0.05,
            duration: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div
            className={cn(
              "relative h-11 w-11 overflow-hidden rounded-full border transition-all duration-200",
              t.avatarBorder,
              t.avatarBg
            )}
          >
            <DAvatar seed={u.seed} name={u.name} size={44} />
          </div>
          <span
            className={cn(
              "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2",
              t.avatarStackBorder,
              dotColor[statuses[i]]
            )}
          />
        </motion.div>
      ))}
    </div>
  );
};

// ─── Section 02: Assignment & Ownership ───────────────────────────────────────

const TASKS = [
  { task: "Redesign onboarding flow", user: TEAM[0] },
  { task: "Fix auth token refresh", user: TEAM[1] },
  { task: "Q3 roadmap review", user: TEAM[2] },
];

/** Task rows with assignee — Linear-style with left accent on hover */
const AssignedToRow = ({
  t,
  accentColor,
}: {
  t: ThemeConfigWithKey;
  accentColor: string;
}) => (
  <div
    className={cn(
      "flex w-[320px] flex-col overflow-hidden rounded-xl border",
      t.divider,
      t.cardBg,
      t.cardBorder
    )}
  >
    {TASKS.map((task, i) => (
      <motion.div
        key={task.task}
        className={cn(
          "group relative flex items-center gap-3 px-4 py-3 transition-colors duration-150",
          t.rowHoverBg,
          i > 0 ? `border-t ${t.sectionBorder}` : ""
        )}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay: i * 0.07,
          duration: 0.22,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* left accent line on hover */}
        <span
          className="absolute left-0 top-0 h-full w-[2px] origin-top scale-y-0 rounded-r transition-transform duration-200 group-hover:scale-y-100"
          style={{ backgroundColor: accentColor, opacity: 0.5 }}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded border",
            t.avatarBorder
          )}
        />
        <span
          className={cn(
            "flex-1 truncate text-xs transition-colors duration-150",
            t.rowText,
            t.rowTextHover
          )}
        >
          {task.task}
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "h-5 w-5 overflow-hidden rounded-full border",
              t.avatarBorder,
              t.avatarBg
            )}
          >
            <DAvatar seed={task.user.seed} name={task.user.name} size={20} />
          </div>
          <span className={cn("text-[10px]", t.rowMetaText)}>
            {task.user.name.split(" ")[0]}
          </span>
        </div>
      </motion.div>
    ))}
  </div>
);

/** Multiple assignees + add button */
const MultiAssignee = ({
  t,
  accentColor,
}: {
  t: ThemeConfigWithKey;
  accentColor: string;
}) => {
  const [added, setAdded] = useState(false);
  const shown = added ? TEAM.slice(0, 4) : TEAM.slice(0, 3);
  return (
    <div className="flex flex-col gap-3">
      <span
        className={cn(
          "text-[10px] uppercase tracking-widest",
          t.assigneesLabelText
        )}
      >
        Assignees
      </span>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          <AnimatePresence initial={false}>
            {shown.map((u, i) => (
              <motion.div
                key={u.name}
                initial={{ opacity: 0, scale: 0.7, x: -4 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.7, x: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "h-7 w-7 overflow-hidden rounded-full border-2",
                  t.avatarStackBorder,
                  t.avatarBg
                )}
                style={{ zIndex: shown.length - i }}
              >
                <DAvatar seed={u.seed} name={u.name} size={28} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <motion.button
          onClick={() => setAdded((p) => !p)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border border-dashed bg-transparent transition-colors",
            t.addBtnBorder,
            t.addBtnText
          )}
          style={
            {
              "--hover-color": accentColor,
            } as React.CSSProperties
          }
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            style={{
              transform: added ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <path
              d="M5 1v8M1 5h8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

/** Project owner card */
const OwnershipCard = ({ t }: { t: ThemeConfigWithKey }) => {
  const owner = TEAM[0];
  return (
    <div
      className={cn(
        "w-[260px] rounded-2xl border p-5",
        t.ownerCardBg,
        t.ownerCardBorder
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 overflow-hidden rounded-full border ring-2 ring-indigo-500/20",
            t.avatarBorder,
            t.avatarBg
          )}
        >
          <DAvatar seed={owner.seed} name={owner.name} size={40} />
        </div>
        <div>
          <p className={cn("text-[11px] font-semibold", t.memberNameText)}>
            {owner.name}
          </p>
          <p className={cn("text-[10px]", t.memberEmailText)}>{owner.email}</p>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border px-3 py-2",
          t.ownerBg,
          t.ownerBorder
        )}
      >
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M1 9.5h10M1.5 9.5L3 4l3 3 3-3 1.5 5.5"
              stroke="#818cf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={cn("text-[10px] font-medium", t.ownerLabelText)}>
            Project Owner
          </span>
        </div>
        <button
          className={cn(
            "text-[10px] underline underline-offset-2 transition-colors hover:opacity-70",
            t.transferText
          )}
        >
          Transfer
        </button>
      </div>
    </div>
  );
};

// ─── Section 03: Collaboration Activity ───────────────────────────────────────

/** Avatar with framer-motion pulsing glow ring */
const EditingIndicator = ({
  t,
  accentColor,
}: {
  t: ThemeConfigWithKey;
  accentColor: string;
}) => {
  const user = TEAM[2];

  // Parse accentColor into rgb components for glow animation
  // accentColor may be hex (#rrggbb) or any CSS color — we use it directly in box-shadow
  const glow1 = `0 0 0 2px ${accentColor}40, 0 0 12px ${accentColor}33`;
  const glow2 = `0 0 0 3px ${accentColor}73, 0 0 20px ${accentColor}59`;
  const glow3 = `0 0 0 2px ${accentColor}40, 0 0 12px ${accentColor}33`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <motion.div
          className="absolute -inset-[3px] rounded-full"
          animate={{
            boxShadow: [glow1, glow2, glow3],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ borderRadius: "9999px" }}
        />
        <div
          className={cn(
            "relative h-12 w-12 overflow-hidden rounded-full border-2",
            t.avatarBg
          )}
          style={{ borderColor: accentColor + "99" }}
        >
          <DAvatar seed={user.seed} name={user.name} size={48} />
        </div>
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border shadow-[0_0_8px_rgba(99,102,241,0.3)]",
            t.editingBadgeBg,
            t.editingBadgeBorder
          )}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path
              d="M6 1.5L7.5 3 3 7.5H1.5V6L6 1.5z"
              stroke={t.editingIconStroke}
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className={cn("text-[10px] font-medium", t.editingNameText)}>
          {user.name.split(" ")[0]}
        </span>
        <span className={cn("text-[10px]", t.editingActionText)}>
          is editing…
        </span>
      </div>
    </div>
  );
};

/** Viewers floating at top of a mock doc */
const ViewerRow = ({ t }: { t: ThemeConfigWithKey }) => {
  const viewers = TEAM.slice(1, 4);
  return (
    <div
      className={cn(
        "w-[280px] overflow-hidden rounded-xl border",
        t.viewerDocBg,
        t.viewerDocBorder
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-2.5",
          t.viewerDocInnerBorder
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", t.docDot)} />
          <span className={cn("text-[10px]", t.docTitleText)}>untitled.doc</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {viewers.map((u, i) => (
              <motion.div
                key={u.name}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.07,
                  duration: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "h-6 w-6 overflow-hidden rounded-full border-2",
                  t.avatarStackBorder,
                  t.avatarBg
                )}
                style={{ zIndex: viewers.length - i }}
              >
                <DAvatar seed={u.seed} name={u.name} size={24} />
              </motion.div>
            ))}
          </div>
          <span className={cn("text-[9px]", t.viewerCountText)}>3 viewing</span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        {[70, 100, 55, 85, 40].map((w, i) => (
          <div
            key={i}
            className={cn("h-1.5 rounded-full", t.viewerSkeletonBg)}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
};

/** Comment thread avatar header */
const CommentAvatar = ({ t }: { t: ThemeConfigWithKey }) => {
  const user = TEAM[3];
  return (
    <div
      className={cn(
        "w-[280px] rounded-xl border p-4",
        t.commentCardBg,
        t.commentCardBorder
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className={cn(
            "h-8 w-8 overflow-hidden rounded-full border",
            t.avatarBorder,
            t.avatarBg
          )}
        >
          <DAvatar seed={user.seed} name={user.name} size={32} />
        </div>
        <div className="flex flex-col">
          <span className={cn("text-[11px] font-semibold", t.memberNameText)}>
            {user.name}
          </span>
          <span className={cn("text-[9px]", t.memberEmailText)}>
            2 minutes ago
          </span>
        </div>
        <button
          className={cn(
            "ml-auto flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] transition-colors",
            t.resolveBtn,
            t.resolveBtnHover
          )}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M1.5 4l1.75 1.75L6.5 2.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Resolve
        </button>
      </div>
      <div
        className={cn(
          "rounded-lg border-l-2 px-3 py-2",
          t.commentQuoteBg,
          t.commentQuoteBorder
        )}
      >
        <p className={cn("text-[11px] leading-relaxed", t.commentQuoteText)}>
          "Should we consider a skeleton state here while the avatars load?"
        </p>
      </div>
    </div>
  );
};

// ─── Section 04: Team Directory ────────────────────────────────────────────────

/** Full-width member row — admin user table */
const MemberRow = ({
  user,
  t,
  accentColor,
}: {
  user: (typeof TEAM)[0];
  t: ThemeConfigWithKey;
  accentColor: string;
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      className={cn(
        "group flex w-full items-center gap-4 rounded-xl border px-5 py-3.5 transition-colors duration-150",
        t.memberRowBg,
        t.memberRowBorder,
        t.memberRowHoverBg,
        t.memberRowHoverBorder
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <div
        className={cn(
          "h-9 w-9 shrink-0 overflow-hidden rounded-full border",
          t.avatarBorder,
          t.avatarBg
        )}
      >
        <DAvatar seed={user.seed} name={user.name} size={36} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-[12px] font-semibold", t.memberNameText)}>
          {user.name}
        </span>
        <span className={cn("text-[10px]", t.memberEmailText)}>{user.email}</span>
      </div>
      <span
        className={cn(
          "hidden rounded-full border px-2.5 py-0.5 text-[9px] tracking-wide sm:inline-flex",
          t.memberDeptBg,
          t.memberDeptBorder,
          t.memberDeptText
        )}
      >
        {user.dept}
      </span>
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/[0.15] px-2.5 py-0.5 text-[9px] font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.7)]" />
        Active
      </span>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-1"
          >
            <button
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md border bg-transparent transition-colors",
                t.actionBtnBorder,
                t.actionBtnText,
                t.actionBtnHoverBorder
              )}
              style={{ ["--accent" as string]: accentColor }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M7 1.5L8.5 3 4 7.5H2.5V6L7 1.5z"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md border bg-transparent transition-colors",
                t.actionBtnBorder,
                t.actionBtnText
              )}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="1" fill="currentColor" />
                <circle cx="1.5" cy="5" r="1" fill="currentColor" />
                <circle cx="8.5" cy="5" r="1" fill="currentColor" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/** Small team card — soft gradient bg, centered */
const TeamCard = ({
  user,
  t,
}: {
  user: (typeof TEAM)[0];
  t: ThemeConfigWithKey;
}) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    className={cn(
      "flex w-32 flex-col items-center gap-2.5 rounded-2xl border bg-gradient-to-b px-4 py-5 cursor-default shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-shadow duration-200",
      t.teamCardBg,
      t.teamCardBorder,
      t.teamCardHoverBorder
    )}
  >
    <div
      className={cn(
        "h-12 w-12 overflow-hidden rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
        t.avatarBorder,
        t.avatarBg
      )}
    >
      <DAvatar seed={user.seed} name={user.name} size={48} />
    </div>
    <div className="flex flex-col items-center text-center">
      <span
        className={cn(
          "text-[11px] font-semibold leading-tight",
          t.teamCardNameText
        )}
      >
        {user.name.split(" ")[0]}
      </span>
      <span className={cn("text-[9px] mt-0.5", t.teamCardRoleText)}>
        {user.role}
      </span>
    </div>
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[8px] tracking-wide",
        t.teamCardDeptBg,
        t.teamCardDeptBorder,
        t.teamCardDeptText
      )}
    >
      {user.dept}
    </span>
  </motion.div>
);

/** Pending invite with dashed ring + amber pill */
const InvitePending = ({ t }: { t: ThemeConfigWithKey }) => {
  const pendingUsers = [
    { initials: "AK", email: "alex@…", seed: SEEDS[6] },
    { initials: "JM", email: "jess@…", seed: SEEDS[7] },
  ];
  return (
    <div className="flex gap-5">
      {pendingUsers.map((u) => (
        <div key={u.initials} className="flex flex-col items-center gap-2">
          <div className="relative">
            <svg
              className="absolute -inset-1.5 opacity-60"
              width="58"
              height="58"
              viewBox="0 0 58 58"
              fill="none"
            >
              <circle
                cx="29"
                cy="29"
                r="27"
                stroke="rgba(251,191,36,0.22)"
                strokeWidth="1.2"
                strokeDasharray="4.5 3"
              />
            </svg>
            <div
              className={cn(
                "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border opacity-50",
                t.pendingAvatarBg,
                t.pendingAvatarBorder
              )}
            >
              <DAvatar
                seed={u.seed}
                name={u.initials}
                size={40}
                className="opacity-60"
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className={cn("text-[9px]", t.pendingEmailText)}>
              {u.email}
            </span>
            <span className="rounded-full border border-amber-500/25 bg-amber-500/[0.06] px-2 py-0.5 text-[8px] font-medium text-amber-400/65">
              Pending
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Full Members Table ────────────────────────────────────────────────────────

const MembersTable = ({
  t,
  accentColor,
}: {
  t: ThemeConfigWithKey;
  accentColor: string;
}) => (
  <div className="flex w-full flex-col gap-1.5">
    {TEAM.slice(0, 4).map((u, i) => (
      <motion.div
        key={u.name}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: i * 0.06,
          duration: 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <MemberRow user={u} t={t} accentColor={accentColor} />
      </motion.div>
    ))}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamAvatarsPage({
  theme = "dark",
  accentColor = "#6366f1",
  onlineCount = 4,
}: {
  theme?: "dark" | "light";
  accentColor?: string;
  onlineCount?: number;
}) {
  const t = { ...themeConfig[theme], theme } as ThemeConfigWithKey;
  const clampedOnlineCount = Math.min(Math.max(1, onlineCount), TEAM.length);

  return (
    <div
      className={cn(
        "relative min-h-screen w-full p-10 selection:bg-indigo-500/25 md:p-16",
        t.root
      )}
    >
      {/* subtle accent glow overlay at top */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: t.glowOverlay }}
      />

      <div className="relative">
        {/* ── Header ── */}
        <header className="mb-24">
          <div
            className={cn(
              "mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5",
              t.headerPillBg,
              t.headerPillBorder
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 animate-pulse rounded-full",
                t.headerPillDot
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.22em]",
                t.headerPillText
              )}
            >
              Uilora · Avatar System
            </span>
          </div>
          <h1
            className={cn(
              "text-[clamp(2.4rem,6vw,4rem)] font-light leading-[1.08] tracking-tight",
              t.headingPrimary
            )}
          >
            Team &{" "}
            <span className={t.headingSecondary}>Collaboration</span>
          </h1>
          <p
            className={cn(
              "mt-5 max-w-xl text-[15px] font-light leading-relaxed",
              t.bodyText
            )}
          >
            Avatar patterns built for team-aware products — presence indicators,
            task assignment, real-time editing, and directory UIs as seen in
            Notion, Linear, GitHub, and Figma.
          </p>
        </header>

        {/* ── Section 01: Team Presence ── */}
        <Section
          index="01"
          title="Team Presence"
          subtitle="Showing who's here and active in a shared workspace or document."
          t={t}
        >
          <Card label="Online Now Strip" t={t}>
            <OnlineNowStrip
              t={t}
              accentColor={accentColor}
              onlineCount={clampedOnlineCount}
            />
          </Card>
          <Card label="Facepile With Count" t={t}>
            <FacepileWithCount t={t} accentColor={accentColor} />
          </Card>
          <Card label="Presence Grid" t={t}>
            <PresenceGrid t={t} onlineCount={clampedOnlineCount} />
          </Card>
        </Section>

        {/* ── Section 02: Assignment & Ownership ── */}
        <Section
          index="02"
          title="Assignment & Ownership"
          subtitle="Assigning tasks, tracking who owns work, and managing project accountability."
          t={t}
        >
          <Card label="Assigned To Row" t={t}>
            <AssignedToRow t={t} accentColor={accentColor} />
          </Card>
          <Card label="Multi Assignee" t={t}>
            <MultiAssignee t={t} accentColor={accentColor} />
          </Card>
          <Card label="Ownership Card" t={t}>
            <OwnershipCard t={t} />
          </Card>
        </Section>

        {/* ── Section 03: Collaboration Activity ── */}
        <Section
          index="03"
          title="Collaboration Activity"
          subtitle="Real-time cues for editing, viewing, and commenting in shared documents."
          t={t}
        >
          <Card label="Editing Indicator" t={t}>
            <EditingIndicator t={t} accentColor={accentColor} />
          </Card>
          <Card label="Viewer Row" t={t}>
            <ViewerRow t={t} />
          </Card>
          <Card label="Comment Avatar" t={t}>
            <CommentAvatar t={t} />
          </Card>
        </Section>

        {/* ── Section 04: Team Directory ── */}
        <Section
          index="04"
          title="Team Directory"
          subtitle="Listing and browsing team members across admin tables, org charts, and invite flows."
          t={t}
        >
          <Card label="Member Row" wide t={t}>
            <MembersTable t={t} accentColor={accentColor} />
          </Card>

          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              {TEAM.slice(0, 4).map((u) => (
                <TeamCard key={u.name} user={u} t={t} />
              ))}
            </div>
            <span
              className={cn(
                "px-1 text-[10px] font-medium uppercase tracking-[0.18em]",
                t.cardLabel
              )}
            >
              Team Card
            </span>
          </div>

          <Card label="Invite Pending" t={t}>
            <InvitePending t={t} />
          </Card>
        </Section>
      </div>
    </div>
  );
}

export { TeamAvatarsPage as TeamAvatars };
