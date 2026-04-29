"use client";

/**
 * MoodAnalysisPanel
 * ──────────────────
 * A slide-in panel that appears after each AI response,
 * showing real-time mood analysis derived from the chat content.
 *
 * Called from: therapy page, after each assistant message lands.
 * Props:
 *   analysis  — the `analysis` object returned from /chat/sessions/:id/messages
 *   onClose   — callback when user dismisses
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MoodData {
  emotionalState: string;
  riskLevel: number;        // 0-10
  themes: string[];
  recommendedApproach?: string;
  progressIndicators?: string[];
}

interface Props {
  mood: MoodData | null;
  onClose: () => void;
}

// ─── Emotion → Mood score mapper ──────────────────────────────────────────────

const EMOTION_PALETTE: Record<
  string,
  { color: string; bg: string; ring: string; icon: React.ReactNode; score: number }
> = {
  happy: {
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    ring: "ring-emerald-300/50",
    icon: "😊",
    score: 85,
  },
  content: {
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    ring: "ring-teal-300/50",
    icon: "🙂",
    score: 70,
  },
  neutral: {
    color: "text-slate-500",
    bg: "bg-slate-50 dark:bg-slate-800/40",
    ring: "ring-slate-300/50",
    icon: "😐",
    score: 50,
  },
  anxious: {
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-300/50",
    icon: "😰",
    score: 35,
  },
  worried: {
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-300/50",
    icon: "😟",
    score: 35,
  },
  sad: {
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    ring: "ring-blue-300/50",
    icon: "😢",
    score: 25,
  },
  lonely: {
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    ring: "ring-indigo-300/50",
    icon: "💙",
    score: 20,
  },
  depressed: {
    color: "text-violet-700",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    ring: "ring-violet-300/50",
    icon: "😔",
    score: 15,
  },
  angry: {
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/40",
    ring: "ring-red-300/50",
    icon: "😠",
    score: 20,
  },
  overwhelmed: {
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    ring: "ring-orange-300/50",
    icon: "😵",
    score: 22,
  },
  stressed: {
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    ring: "ring-orange-300/50",
    icon: "😤",
    score: 28,
  },
  hopeful: {
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    ring: "ring-sky-300/50",
    icon: "🌱",
    score: 65,
  },
  grateful: {
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    ring: "ring-emerald-300/50",
    icon: "🙏",
    score: 78,
  },
};

function resolveEmotion(emotionalState: string) {
  const key = emotionalState?.toLowerCase().trim() || "neutral";
  return (
    EMOTION_PALETTE[key] ||
    EMOTION_PALETTE[
      Object.keys(EMOTION_PALETTE).find((k) => key.includes(k)) || "neutral"
    ] ||
    EMOTION_PALETTE["neutral"]
  );
}

// Derive secondary emotions from themes for a richer breakdown
function buildBreakdown(
  themes: string[],
  primaryScore: number
): { label: string; pct: number; color: string }[] {
  const themeMap: Record<string, { label: string; color: string }> = {
    anxiety: { label: "Anxiety", color: "bg-amber-400" },
    depression: { label: "Low mood", color: "bg-indigo-400" },
    stress: { label: "Stress", color: "bg-orange-400" },
    loneliness: { label: "Loneliness", color: "bg-blue-400" },
    grief: { label: "Grief", color: "bg-violet-400" },
    anger: { label: "Frustration", color: "bg-red-400" },
    hope: { label: "Hope", color: "bg-emerald-400" },
    gratitude: { label: "Gratitude", color: "bg-teal-400" },
    fear: { label: "Fear", color: "bg-yellow-500" },
    joy: { label: "Joy", color: "bg-green-400" },
    relationships: { label: "Connection", color: "bg-pink-400" },
    work: { label: "Work pressure", color: "bg-slate-400" },
    sleep: { label: "Fatigue", color: "bg-purple-400" },
  };

  const matched = themes
    .map((t) => {
      const tl = t.toLowerCase();
      const entry = Object.entries(themeMap).find(([k]) => tl.includes(k));
      return entry ? entry[1] : null;
    })
    .filter(Boolean)
    .slice(0, 3) as { label: string; color: string }[];

  if (matched.length === 0) return [];

  // Distribute remaining % across detected themes
  const primaryPct = primaryScore;
  const rest = 100 - primaryPct;
  const perTheme = Math.round(rest / matched.length);

  return matched.map((m, i) => ({
    label: m.label,
    color: m.color,
    pct: i === matched.length - 1 ? rest - perTheme * (matched.length - 1) : perTheme,
  }));
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

function MoodBar({
  label,
  pct,
  color,
  delay = 0,
}: {
  label: string;
  pct: number;
  color: string;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-foreground/70">{label}</span>
        <span className="tabular-nums text-foreground/60">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", color)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function MoodAnalysisPanel({ mood, onClose }: Props) {
  if (!mood) return null;

  const emotion = resolveEmotion(mood.emotionalState);
  const moodScore = emotion.score;
  const breakdown = buildBreakdown(mood.themes || [], moodScore);

  const TrendIcon =
    moodScore >= 60 ? TrendingUp : moodScore <= 30 ? TrendingDown : Minus;
  const trendColor =
    moodScore >= 60
      ? "text-emerald-500"
      : moodScore <= 30
      ? "text-rose-500"
      : "text-slate-400";

  const label =
    moodScore >= 70
      ? "Positive"
      : moodScore >= 50
      ? "Neutral"
      : moodScore >= 30
      ? "Low"
      : "Distressed";

  return (
    <AnimatePresence>
      {mood && (
        <motion.div
          key="mood-panel"
          initial={{ x: 340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 340, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 200 }}
          className={cn(
            "w-72 shrink-0 border-l flex flex-col overflow-hidden",
            emotion.bg
          )}
        >
          {/* Header */}
          <div className={cn("p-4 border-b flex items-center justify-between", emotion.bg)}>
            <div className="flex items-center gap-2">
              <Brain className={cn("w-4 h-4", emotion.color)} />
              <span className="text-sm font-semibold">Mood Check</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-black/10 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Emoji + score */}
          <div className="flex flex-col items-center gap-2 pt-6 pb-4 px-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", damping: 14 }}
              className="text-5xl"
            >
              {emotion.icon}
            </motion.div>

            <div className="text-center space-y-0.5">
              <p className={cn("text-lg font-bold capitalize", emotion.color)}>
                {mood.emotionalState || "Neutral"}
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <TrendIcon className={cn("w-3.5 h-3.5", trendColor)} />
                <span className="text-xs text-muted-foreground">
                  Mood score:{" "}
                  <span className={cn("font-semibold", trendColor)}>
                    {moodScore}%
                  </span>{" "}
                  — {label}
                </span>
              </div>
            </div>

            {/* Big radial-ish score ring */}
            <div
              className={cn(
                "mt-1 ring-4 rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl",
                emotion.color,
                emotion.ring,
                "ring-offset-0"
              )}
            >
              {moodScore}
            </div>
          </div>

          {/* Breakdown bars */}
          {breakdown.length > 0 && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Detected themes
              </p>
              {breakdown.map((b, i) => (
                <MoodBar
                  key={b.label}
                  label={b.label}
                  pct={b.pct}
                  color={b.color}
                  delay={i * 80}
                />
              ))}
            </div>
          )}

          {/* Themes chips */}
          {mood.themes && mood.themes.length > 0 && (
            <div className="px-4 pb-4 flex flex-wrap gap-1.5">
              {mood.themes.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 border border-white/40 text-foreground/70"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Recommended approach */}
          {mood.recommendedApproach && (
            <div className="mx-4 mb-4 rounded-xl bg-white/60 dark:bg-black/20 border border-white/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Therapist approach
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {mood.recommendedApproach}
              </p>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-auto px-4 pb-4">
            <p className="text-[10px] text-center text-muted-foreground/60 leading-relaxed">
              Analysis updates after each AI response based on your conversation.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
