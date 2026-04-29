"use client";

/**
 * SoulSync Gamification Engine
 * ─────────────────────────────
 * Tracks XP, levels, streaks, and achievements entirely in localStorage.
 * No backend changes needed.
 *
 * Export:
 *   useGamification()   — React hook for components
 *   GamificationToast   — floating "+XP" toast that pops on earn
 *   XPBar               — compact XP progress bar for the header/sidebar
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Star, Zap, Brain, Heart, BookOpen, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

export const XP_EVENTS = {
  SEND_MESSAGE:       { xp: 5,   label: "+5 XP",  desc: "Message sent" },
  SESSION_COMPLETE:   { xp: 50,  label: "+50 XP", desc: "Session completed" },
  ACTIVITY_COMPLETE:  { xp: 30,  label: "+30 XP", desc: "Mindfulness exercise" },
  JOURNAL_SAVE:       { xp: 20,  label: "+20 XP", desc: "Journal entry saved" },
  JOURNAL_REFLECTION: { xp: 15,  label: "+15 XP", desc: "AI reflection requested" },
  DAILY_CHECKIN:      { xp: 10,  label: "+10 XP", desc: "Daily check-in" },
  STREAK_BONUS:       { xp: 25,  label: "+25 XP", desc: "🔥 Streak bonus!" },
  THERAPIST_FIND:     { xp: 10,  label: "+10 XP", desc: "Therapist finder opened" },
} as const;

export type XPEventKey = keyof typeof XP_EVENTS;

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700, 7500,
];

function calcLevel(xp: number): { level: number; current: number; needed: number; pct: number } {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  const lvlIdx = Math.min(level - 1, LEVEL_THRESHOLDS.length - 1);
  const nextIdx = Math.min(level, LEVEL_THRESHOLDS.length - 1);
  const current = xp - LEVEL_THRESHOLDS[lvlIdx];
  const needed = LEVEL_THRESHOLDS[nextIdx] - LEVEL_THRESHOLDS[lvlIdx];
  const pct = needed > 0 ? Math.round((current / needed) * 100) : 100;
  return { level, current, needed, pct };
}

const LEVEL_TITLES = [
  "Seedling", "Explorer", "Wanderer", "Seeker", "Grounded",
  "Mindful", "Balanced", "Enlightened", "Sage", "Zen Master", "Soul Guide",
];

export function getLevelTitle(level: number) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

// ─── Achievements ─────────────────────────────────────────────────────────────

interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  condition: (stats: GamificationState) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_message",    icon: "💬", title: "First Words",        desc: "Send your first message",                     condition: (s) => s.totalMessages >= 1 },
  { id: "ten_messages",     icon: "🗣️",  title: "Opening Up",         desc: "Send 10 messages",                            condition: (s) => s.totalMessages >= 10 },
  { id: "first_activity",  icon: "🌬️", title: "Breathe",            desc: "Complete your first mindfulness exercise",    condition: (s) => s.totalActivities >= 1 },
  { id: "three_activities",icon: "🧘", title: "Mind & Body",        desc: "Complete 3 mindfulness exercises",            condition: (s) => s.totalActivities >= 3 },
  { id: "first_journal",   icon: "📔", title: "Dear Diary",         desc: "Write your first journal entry",              condition: (s) => s.totalJournals >= 1 },
  { id: "five_journals",   icon: "✍️",  title: "Journaling Habit",   desc: "Write 5 journal entries",                     condition: (s) => s.totalJournals >= 5 },
  { id: "streak_3",        icon: "🔥", title: "On Fire",            desc: "Maintain a 3-day streak",                     condition: (s) => s.streak >= 3 },
  { id: "streak_7",        icon: "⚡", title: "One Week Strong",    desc: "Maintain a 7-day streak",                     condition: (s) => s.streak >= 7 },
  { id: "level_5",         icon: "⭐", title: "Halfway There",      desc: "Reach Level 5",                               condition: (s) => calcLevel(s.totalXp).level >= 5 },
  { id: "level_10",        icon: "🏆", title: "Soul Guide",         desc: "Reach Level 10",                              condition: (s) => calcLevel(s.totalXp).level >= 10 },
  { id: "sessions_5",      icon: "🛋️", title: "Regular",            desc: "Complete 5 therapy sessions",                 condition: (s) => s.totalSessions >= 5 },
];

// ─── State ────────────────────────────────────────────────────────────────────

interface GamificationState {
  totalXp: number;
  totalMessages: number;
  totalActivities: number;
  totalJournals: number;
  totalSessions: number;
  streak: number;
  lastActiveDate: string;
  unlockedAchievements: string[];
}

const STORAGE_KEY = "soulsync_gamification_v1";

const DEFAULT_STATE: GamificationState = {
  totalXp: 0,
  totalMessages: 0,
  totalActivities: 0,
  totalJournals: 0,
  totalSessions: 0,
  streak: 1,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  unlockedAchievements: [],
};

function loadState(): GamificationState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(s: GamificationState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function updateStreak(s: GamificationState): GamificationState {
  const today = new Date().toISOString().slice(0, 10);
  if (s.lastActiveDate === today) return s;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const newStreak = s.lastActiveDate === yesterday ? s.streak + 1 : 1;
  return { ...s, streak: newStreak, lastActiveDate: today };
}

// ─── Toast queue ──────────────────────────────────────────────────────────────

interface ToastItem {
  id: number;
  label: string;
  desc: string;
  isAchievement?: boolean;
  achievementTitle?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GamificationContext {
  state: GamificationState;
  levelInfo: ReturnType<typeof calcLevel>;
  earn: (event: XPEventKey) => void;
  newAchievements: Achievement[];
}

const Ctx = createContext<GamificationContext | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GamificationState>(DEFAULT_STATE);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Hydrate from localStorage
  useEffect(() => {
    const loaded = loadState();
    const updated = updateStreak(loaded);
    setState(updated);
    saveState(updated);
  }, []);

  // ── FIXED: use Date.now() + random so rapid toasts never share an id ──
  const addToast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { ...item, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const earn = useCallback(
    (event: XPEventKey) => {
      setState((prev) => {
        const evt = XP_EVENTS[event];
        let next: GamificationState = {
          ...prev,
          totalXp: prev.totalXp + evt.xp,
        };

        // Update counters
        if (event === "SEND_MESSAGE")       next.totalMessages   = prev.totalMessages + 1;
        if (event === "ACTIVITY_COMPLETE")  next.totalActivities = prev.totalActivities + 1;
        if (event === "JOURNAL_SAVE")       next.totalJournals   = prev.totalJournals + 1;
        if (event === "SESSION_COMPLETE")   next.totalSessions   = prev.totalSessions + 1;

        // Streak bonus on daily first message
        const today = new Date().toISOString().slice(0, 10);
        if (event === "SEND_MESSAGE" && prev.lastActiveDate !== today) {
          const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
          const newStreak = prev.lastActiveDate === yesterday ? prev.streak + 1 : 1;
          next = {
            ...next,
            streak: newStreak,
            lastActiveDate: today,
            totalXp: next.totalXp + (newStreak > 1 ? XP_EVENTS.STREAK_BONUS.xp : 0),
          };
          if (newStreak > 1) {
            addToast({ label: XP_EVENTS.STREAK_BONUS.label, desc: `${newStreak}-day streak!` });
          }
        }

        // Check achievements
        const newly = ACHIEVEMENTS.filter(
          (a) => !next.unlockedAchievements.includes(a.id) && a.condition(next)
        );
        if (newly.length) {
          next.unlockedAchievements = [
            ...next.unlockedAchievements,
            ...newly.map((a) => a.id),
          ];
          newly.forEach((a) => {
            addToast({
              label: `🏅 ${a.icon} ${a.title}`,
              desc: "Achievement unlocked!",
              isAchievement: true,
              achievementTitle: a.title,
            });
          });
          setNewAchievements(newly);
        }

        saveState(next);
        return next;
      });

      addToast({ label: XP_EVENTS[event].label, desc: XP_EVENTS[event].desc });
    },
    [addToast]
  );

  const levelInfo = calcLevel(state.totalXp);

  return (
    <Ctx.Provider value={{ state, levelInfo, earn, newAchievements }}>
      {children}
      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 260 }}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl border",
                t.isAchievement
                  ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-900/40 dark:to-yellow-900/40 dark:border-amber-700/50"
                  : "bg-white/95 dark:bg-zinc-900/95 border-primary/20 backdrop-blur-sm"
              )}
            >
              <div className="flex items-center gap-2">
                {t.isAchievement ? (
                  <Trophy className="w-4 h-4 text-amber-500" />
                ) : (
                  <Zap className="w-4 h-4 text-primary" />
                )}
                <div>
                  <p className={cn("text-sm font-bold", t.isAchievement ? "text-amber-700 dark:text-amber-300" : "text-primary")}>
                    {t.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGamification must be inside GamificationProvider");
  return ctx;
}

// ─── XP Bar (compact, for sidebar/header) ─────────────────────────────────────

export function XPBar({ className }: { className?: string }) {
  const { state, levelInfo } = useGamification();
  const title = getLevelTitle(levelInfo.level);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span className="font-semibold">
            Lv.{levelInfo.level} <span className="text-muted-foreground font-normal">· {title}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground tabular-nums">
            {levelInfo.current}/{levelInfo.needed} XP
          </span>
          {state.streak > 1 && (
            <div className="flex items-center gap-0.5 text-orange-500 font-semibold">
              <Flame className="w-3 h-3 fill-orange-400" />
              {state.streak}
            </div>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${levelInfo.pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Full Progress Card (for /progress page) ──────────────────────────────────

export function GamificationCard({ className }: { className?: string }) {
  const { state, levelInfo } = useGamification();
  const title = getLevelTitle(levelInfo.level);
  const unlockedCount = state.unlockedAchievements.length;

  const stats = [
    { icon: <Brain className="w-4 h-4 text-primary" />,  label: "Sessions",   value: state.totalSessions },
    { icon: <Wind className="w-4 h-4 text-sky-500" />,   label: "Exercises",  value: state.totalActivities },
    { icon: <BookOpen className="w-4 h-4 text-teal-500" />, label: "Journals", value: state.totalJournals },
    { icon: <Heart className="w-4 h-4 text-rose-500" />, label: "Messages",   value: state.totalMessages },
  ];

  const earnedAchievements = ACHIEVEMENTS.filter((a) =>
    state.unlockedAchievements.includes(a.id)
  );
  const lockedAchievements = ACHIEVEMENTS.filter(
    (a) => !state.unlockedAchievements.includes(a.id)
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Level card */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Your level</p>
            <h2 className="text-3xl font-bold mt-0.5">
              Level {levelInfo.level}{" "}
              <span className="text-lg font-medium text-muted-foreground">· {title}</span>
            </h2>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span className="text-xl font-bold text-primary leading-none mt-1">{levelInfo.level}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{levelInfo.current} XP</span>
            <span>{levelInfo.needed} XP needed</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-semibold">{state.totalXp.toLocaleString()} total XP</span>
          </div>
          {state.streak > 1 && (
            <div className="flex items-center gap-1.5 text-orange-600">
              <Flame className="w-4 h-4 fill-orange-400" />
              <span className="font-semibold">{state.streak}-day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border bg-card p-4 flex flex-col items-center gap-1 text-center"
          >
            {s.icon}
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Achievements
          </h3>
          <span className="text-xs text-muted-foreground">
            {unlockedCount} / {ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {earnedAchievements.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/40 p-3"
            >
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </motion.div>
          ))}
          {lockedAchievements.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/30 p-3 opacity-50"
            >
              <span className="text-2xl grayscale">{a.icon}</span>
              <div>
                <p className="text-sm font-semibold">???</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* XP event guide */}
      <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How to earn XP</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4">
          {Object.values(XP_EVENTS).map((e) => (
            <div key={e.desc} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{e.desc}</span>
              <span className="font-semibold text-primary tabular-nums">{e.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}