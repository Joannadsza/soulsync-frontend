"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Activity,
  Heart,
  Trophy,
  Flame,
  MessageSquare,
  BrainCircuit,
  ArrowRight,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  format,
  subDays,
  startOfDay,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { getAllChatSessions } from "@/lib/api/chat";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GamificationCard } from "@/components/gamification/GamificationEngine";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MoodEntry {
  score: number;
  timestamp?: string;
  createdAt?: string;
  note?: string;
}

interface BackendActivity {
  _id: string;
  type: string;
  name: string;
  completed: boolean;
  createdAt: string;
}

const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Safely resolve the date from a mood entry — backend uses `timestamp`,
// but some entries may only have `createdAt`. Falls back to now.
function resolveMoodDate(entry: MoodEntry): Date {
  const raw = entry.timestamp || entry.createdAt;
  if (!raw) return new Date();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function fetchMoodHistory(): Promise<MoodEntry[]> {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return [];
    const res = await fetch("/api/mood", {
      headers: { Authorization: `Bearer ${token}` },
      // Bust any browser cache so we always get the latest entries
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch {
    return [];
  }
}

async function fetchActivities(): Promise<BackendActivity[]> {
  try {
    const res = await fetch(`/api/activity`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch {
    return [];
  }
}

// ─── Streak calculation ───────────────────────────────────────────────────────

function calcStreak(sessionDates: Date[]): number {
  if (sessionDates.length === 0) return 0;
  const uniqueDays = Array.from(
    new Set(sessionDates.map((d) => format(startOfDay(d), "yyyy-MM-dd")))
  ).sort((a, b) => b.localeCompare(a));

  let streak = 0;
  let cursor = startOfDay(new Date());

  for (const dayStr of uniqueDays) {
    const day = startOfDay(new Date(dayStr));
    if (isSameDay(day, cursor) || isSameDay(day, subDays(cursor, 1))) {
      streak++;
      cursor = day;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [totalSessions, setTotalSessions] = useState(0);
  const [streak, setStreak] = useState(0);
  const [moodChartData, setMoodChartData] = useState<
    { date: string; score: number }[]
  >([]);
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set());
  const [featureUsage, setFeatureUsage] = useState<
    { label: string; count: number; icon: any; color: string }[]
  >([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessions, moods, activities] = await Promise.all([
        getAllChatSessions().catch(() => []),
        fetchMoodHistory(),
        fetchActivities(),
      ]);

      setTotalSessions(sessions.length);

      const sessionDates = sessions.map((s) => new Date(s.createdAt));
      setStreak(calcStreak(sessionDates));

      const activeDaySet = new Set<string>();
      [...sessionDates, ...activities.map((a) => new Date(a.createdAt))].forEach(
        (d) => {
          activeDaySet.add(format(startOfDay(d), "yyyy-MM-dd"));
        }
      );
      setActiveDays(activeDaySet);

      const last14 = eachDayOfInterval({
        start: subDays(new Date(), 13),
        end: new Date(),
      });

      // FIX: use resolveMoodDate() so both `timestamp` and `createdAt` fields
      // are handled correctly, avoiding silent empty chart data.
      const chartData = last14.map((day) => {
        const dayEntries = moods.filter((m) =>
          isSameDay(resolveMoodDate(m), day)
        );
        const avg =
          dayEntries.length > 0
            ? Math.round(
                dayEntries.reduce((s, e) => s + e.score, 0) / dayEntries.length
              )
            : null;
        return {
          date: format(day, "MMM d"),
          score: avg ?? 0,
          hasData: dayEntries.length > 0,
        };
      });

      // Only plot days that actually have mood data
      setMoodChartData(chartData.filter((d) => d.hasData));

      const yogaCount = activities.filter((a) => a.type === "yoga").length;
      const breathCount = activities.filter((a) => a.type === "breathing").length;
      const gameCount = activities.filter((a) => a.type === "game").length;
      const meditationCount = activities.filter((a) => a.type === "meditation").length;

      setFeatureUsage([
        { label: "Therapy Sessions", count: sessions.length, icon: MessageSquare, color: "text-violet-500" },
        { label: "Mood Logs", count: moods.length, icon: Heart, color: "text-rose-500" },
        { label: "Yoga", count: yogaCount, icon: Activity, color: "text-green-500" },
        { label: "Breathing", count: breathCount, icon: Brain, color: "text-blue-500" },
        { label: "Games", count: gameCount, icon: Trophy, color: "text-yellow-500" },
        { label: "Meditation", count: meditationCount, icon: BrainCircuit, color: "text-teal-500" },
      ]);
    } catch (err) {
      console.error("ProgressPage loadData error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, loadData]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const calendarDays = eachDayOfInterval({
    start: subDays(new Date(), 27),
    end: new Date(),
  });

  const maxCount = Math.max(...featureUsage.map((f) => f.count), 1);

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-24 pb-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Progress</h1>
            <p className="text-muted-foreground mt-1">
              Track how far you've come on your wellness journey
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="gap-2">
            <ArrowRight className="w-4 h-4 rotate-180" /> Dashboard
          </Button>
        </div>

        {/* ── Gamification Card ───────────────────────────────────────────── */}
        <GamificationCard />

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Sessions completed",
              value: totalSessions,
              icon: MessageSquare,
              color: "text-violet-500",
              bg: "bg-violet-500/10",
            },
            {
              label: "Day streak 🔥",
              value: streak,
              icon: Flame,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
            {
              label: "Activities logged",
              value: featureUsage.slice(2).reduce((s, f) => s + f.count, 0),
              icon: Activity,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Mood logs",
              value: featureUsage.find((f) => f.label === "Mood Logs")?.count ?? 0,
              icon: Heart,
              color: "text-rose-500",
              bg: "bg-rose-500/10",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-primary/10">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Mood trend chart */}
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Mood Trend (last 14 days)
              </CardTitle>
              <CardDescription>
                Your mood score over time. End a therapy session to log your mood automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moodChartData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <Heart className="w-8 h-8 opacity-30" />
                  <p>No mood data yet.</p>
                  <p className="text-xs">End a therapy session or use Track Mood on the dashboard.</p>
                </div>
              ) : moodChartData.length < 2 ? (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <TrendingUp className="w-8 h-8 opacity-30" />
                  <p>Only {moodChartData.length} data point so far.</p>
                  <p className="text-xs">Log mood on more days to see a trend line.</p>
                  {/* Show the single point as a simple stat */}
                  <div className="mt-3 px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold">
                    {moodChartData[0].date}: {moodChartData[0].score}%
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={moodChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: any) => [`${v}%`, "Mood"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Streak calendar */}
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Activity Calendar (last 28 days)
              </CardTitle>
              <CardDescription>
                Each filled square = a day you used SoulSync. Keep the streak alive!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="text-center text-xs text-muted-foreground font-medium pb-1">
                    {d}
                  </div>
                ))}
                {calendarDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const active = activeDays.has(key);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={key}
                      title={format(day, "MMM d")}
                      className={cn(
                        "aspect-square rounded-md transition-all",
                        active ? "bg-primary shadow-sm shadow-primary/30" : "bg-muted/40",
                        isToday && "ring-2 ring-primary ring-offset-1"
                      )}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-muted/40 inline-block" /> No activity
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Active
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature usage bar chart */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Most Used Features
            </CardTitle>
            <CardDescription>Which tools you rely on most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featureUsage
                .sort((a, b) => b.count - a.count)
                .map((f) => (
                  <div key={f.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <f.icon className={cn("w-4 h-4", f.color)} />
                        <span>{f.label}</span>
                      </div>
                      <span className="font-semibold">{f.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(f.count / maxCount) * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
