"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Activity,
  Heart,
  Trophy,
  Bell,
  Sparkles,
  MessageSquare,
  BrainCircuit,
  ArrowRight,
  Loader2,
  TrendingUp,
  Stethoscope,
  BookOpen,
  AlertTriangle,
  PenLine,
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

import { MoodForm } from "@/components/mood/mood-form";
import { AnxietyGames } from "@/components/games/anxiety-games";
import { YogaPosesSection } from "@/components/activities/yoga-poses";
import { BreathingExerciseSection } from "@/components/activities/breathing-exercise";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { format, addDays, startOfDay, isWithinInterval, subDays } from "date-fns";

import { ActivityLogger } from "@/components/activities/activity-logger";
import { useSession } from "@/lib/contexts/session-context";
import { getAllChatSessions } from "@/lib/api/chat";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BackendActivity {
  _id: string;
  userId: string;
  type: string;
  name: string;
  description?: string;
  duration?: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DailyStats {
  moodScore: number | null;
  completionRate: number;
  therapySessions: number;
  totalActivities: number;
  lastUpdated: Date;
}

interface JournalPreview {
  id: string;
  text: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const fetchLatestMood = async (): Promise<number | null> => {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return null;
    const response = await fetch("/api/mood", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    // Handle both array and { data: [] } shapes
    const entries: { score: number; timestamp: string }[] = Array.isArray(data)
      ? data
      : data.data || [];
    if (entries.length === 0) return null;

    // FIX: look back 24 hours instead of "today from midnight" to avoid
    // timezone edge-cases where a mood logged late at night vanishes.
    const cutoff = subDays(new Date(), 1);
    const recentEntries = entries.filter(
      (e) => new Date(e.timestamp) >= cutoff
    );

    if (recentEntries.length === 0) return null;
    // Return the most recent score
    return recentEntries[0].score;
  } catch {
    return null;
  }
};

const fetchActivities = async (): Promise<BackendActivity[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/activity`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch {
    return [];
  }
};

const logActivityToBackend = async (data: {
  type: string;
  name: string;
  description?: string;
  duration?: number;
}) => {
  try {
    const response = await fetch(`${API_BASE}/api/activity`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, completed: true }),
    });
    if (!response.ok) throw new Error("Failed to log activity");
    return await response.json();
  } catch (err) {
    console.error("logActivityToBackend error:", err);
    throw err;
  }
};

// Load recent journal entries from localStorage scoped to the current user
const loadJournalPreviews = (userId: string): JournalPreview[] => {
  if (typeof window === "undefined" || !userId) return [];
  try {
    // Pull from the standalone journal page storage (user-scoped key)
    const stored = localStorage.getItem(`journal_entries_${userId}`);
    const standalone: JournalPreview[] = stored ? JSON.parse(stored) : [];

    // Also pull any session journals scoped to this user
    const sessionJournals: JournalPreview[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Session journal keys are: journal_<sessionId>_<userId>
      if (key?.startsWith(`journal_`) && key.endsWith(`_${userId}`) && !key.startsWith("journal_entries")) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || "{}");
          if (entry.text) {
            sessionJournals.push({
              id: key,
              text: entry.text,
              createdAt: entry.updatedAt || new Date().toISOString(),
            });
          }
        } catch {}
      }
    }

    return [...standalone, ...sessionJournals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  } catch {
    return [];
  }
};

const generateInsights = (
  therapySessions: number,
  activities: BackendActivity[],
  moodScore: number | null
) => {
  const insights: {
    title: string;
    description: string;
    icon: any;
    priority: "low" | "medium" | "high";
  }[] = [];

  if (therapySessions > 0) {
    insights.push({
      title: "Active Therapy User",
      description: `You've completed ${therapySessions} therapy session${therapySessions > 1 ? "s" : ""}. Keep up the great work!`,
      icon: Trophy,
      priority: "high",
    });
  }

  if (moodScore !== null) {
    if (moodScore >= 70) {
      insights.push({
        title: "Great Mood Today!",
        description: `Your mood score is ${moodScore}% — you're doing really well.`,
        icon: Heart,
        priority: "high",
      });
    } else if (moodScore < 40) {
      insights.push({
        title: "Mood Check",
        description:
          "Your mood seems low today. Try a breathing exercise or a mindfulness game to lift your spirits.",
        icon: Brain,
        priority: "high",
      });
    }
  }

  const mindfulnessCount = activities.filter((a) =>
    ["yoga", "breathing", "game", "meditation"].includes(a.type)
  ).length;

  if (mindfulnessCount >= 3) {
    insights.push({
      title: "Consistent Practice",
      description:
        "You've been regularly engaging in mindfulness activities. This reduces stress and improves focus.",
      icon: Sparkles,
      priority: "medium",
    });
  } else if (mindfulnessCount === 0) {
    insights.push({
      title: "Mindfulness Opportunity",
      description: "Try a yoga pose, breathing exercise, or mindfulness game today.",
      icon: Sparkles,
      priority: "low",
    });
  }

  return insights
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 3);
};

// ─── Nav Cards ────────────────────────────────────────────────────────────────

const navCards = [
  {
    href: "/progress",
    label: "Progress",
    description: "XP, levels & achievements",
    icon: TrendingUp,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "hover:border-violet-500/40",
  },
  {
    href: "/find-therapist",
    label: "Find Therapist",
    description: "Connect with professionals",
    icon: Stethoscope,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "hover:border-teal-500/40",
  },
  {
    href: "/journal",
    label: "Journal",
    description: "Write & reflect",
    icon: BookOpen,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "hover:border-amber-500/40",
  },
  {
    href: "/emergency",
    label: "Emergency Help",
    description: "Crisis resources",
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "hover:border-red-500/40",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useSession();

  const [insights, setInsights] = useState<
    { title: string; description: string; icon: any; priority: "low" | "medium" | "high" }[]
  >([]);
  const [activities, setActivities] = useState<BackendActivity[]>([]);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showActivityLogger, setShowActivityLogger] = useState(false);
  const [journalPreviews, setJournalPreviews] = useState<JournalPreview[]>([]);

  const [dailyStats, setDailyStats] = useState<DailyStats>({
    moodScore: null,
    completionRate: 100,
    therapySessions: 0,
    totalActivities: 0,
    lastUpdated: new Date(),
  });

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDailyStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [sessions, backendActivities, moodScore] = await Promise.all([
        getAllChatSessions().catch(() => []),
        fetchActivities(),
        fetchLatestMood(),
      ]);

      const today = startOfDay(new Date());
      const todayActivities = backendActivities.filter((a) =>
        isWithinInterval(new Date(a.createdAt), {
          start: today,
          end: addDays(today, 1),
        })
      );

      setActivities(backendActivities);
      setDailyStats({
        moodScore,
        completionRate: 100,
        therapySessions: sessions.length,
        totalActivities: todayActivities.length,
        lastUpdated: new Date(),
      });
      setInsights(generateInsights(sessions.length, backendActivities, moodScore));

      // Load journal previews from localStorage scoped to this user
      setJournalPreviews(loadJournalPreviews(user?._id || ""));
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyStats();
    const interval = setInterval(fetchDailyStats, 5 * 60 * 1000);

    // Refetch immediately whenever the user returns to this tab/page —
    // this ensures the mood score updates after coming back from therapy.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchDailyStats();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchDailyStats]);

  const wellnessStats = [
    {
      title: "Mood Score",
      value:
        dailyStats.moodScore !== null ? `${dailyStats.moodScore}%` : "No data",
      icon: Brain,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description: "Recent mood rating",
    },
    {
      title: "Therapy Sessions",
      value: `${dailyStats.therapySessions}`,
      icon: Heart,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      description: "Total chat sessions",
    },
    {
      title: "Activities Today",
      value: `${dailyStats.totalActivities}`,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Yoga, breathing & games",
    },
    {
      title: "Journal Entries",
      value: `${journalPreviews.length}`,
      icon: BookOpen,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      description: "Recent entries",
    },
  ];

  const handleGamePlayed = useCallback(
    async (gameName: string, description: string) => {
      try {
        await logActivityToBackend({ type: "game", name: gameName, description, duration: 0 });
        fetchDailyStats();
      } catch (error) {
        console.error("Error logging game activity:", error);
      }
    },
    [fetchDailyStats]
  );

  const handleMoodSuccess = useCallback(() => {
    setShowMoodModal(false);
    setTimeout(fetchDailyStats, 1500);
  }, [fetchDailyStats]);

  const handleActivityLogged = useCallback(() => {
    fetchDailyStats();
  }, [fetchDailyStats]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-20 pb-8 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.name || "there"}
            </h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === "yoga" ? "default" : "outline"}
            onClick={() => setActiveTab("yoga")}
            className="gap-1.5"
          >
            🧘 Yoga Poses
          </Button>
          <Button
            variant={activeTab === "breathing" ? "default" : "outline"}
            onClick={() => setActiveTab("breathing")}
            className="gap-1.5"
          >
            🌬️ Breathing
          </Button>
          <Button
            variant={activeTab === "games" ? "default" : "outline"}
            onClick={() => setActiveTab("games")}
            className="gap-1.5"
          >
            🎮 Games
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* ── Top 3 cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Quick Actions */}
              <Card className="border-primary/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent" />
                <CardContent className="p-6 relative">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Quick Actions</h3>
                        <p className="text-sm text-muted-foreground">
                          Start your wellness journey
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <Button
                        variant="default"
                        className={cn(
                          "w-full justify-between items-center p-6 h-auto group/button",
                          "bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90",
                          "transition-all duration-200 group-hover:translate-y-[-2px]"
                        )}
                        onClick={() => router.push("/therapy/new")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-white">Start Therapy</div>
                            <div className="text-xs text-white/80">Begin a new session</div>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover/button:opacity-100 transition-opacity">
                          <ArrowRight className="w-5 h-5 text-white" />
                        </div>
                      </Button>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className={cn(
                            "flex flex-col h-[120px] px-4 py-3 group/mood hover:border-primary/50",
                            "justify-center items-center text-center",
                            "transition-all duration-200 group-hover:translate-y-[-2px]"
                          )}
                          onClick={() => setShowMoodModal(true)}
                        >
                          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                            <Heart className="w-5 h-5 text-rose-500" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Track Mood</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {dailyStats.moodScore !== null
                                ? `Last: ${dailyStats.moodScore}%`
                                : "How are you feeling?"}
                            </div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className={cn(
                            "flex flex-col h-[120px] px-4 py-3 group/ai hover:border-primary/50",
                            "justify-center items-center text-center",
                            "transition-all duration-200 group-hover:translate-y-[-2px]"
                          )}
                          onClick={() => setShowActivityLogger(true)}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                            <BrainCircuit className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Log Activity</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Yoga, breathing & more
                            </div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Overview */}
              <Card className="border-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Today's Overview</CardTitle>
                      <CardDescription>
                        Your wellness metrics for {format(new Date(), "MMMM d, yyyy")}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={fetchDailyStats}
                      className="h-8 w-8"
                      disabled={isRefreshing}
                    >
                      <Loader2 className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {wellnessStats.map((stat) => (
                      <div
                        key={stat.title}
                        className={cn(
                          "p-4 rounded-lg transition-all duration-200 hover:scale-[1.02]",
                          stat.bgColor
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <stat.icon className={cn("w-5 h-5", stat.color)} />
                          <p className="text-sm font-medium">{stat.title}</p>
                        </div>
                        <p className="text-2xl font-bold mt-2">{stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                      </div>
                    ))}
                  </div>

                  {dailyStats.moodScore !== null && (
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Mood Scale</span>
                        <span>{dailyStats.moodScore}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            dailyStats.moodScore >= 70
                              ? "bg-green-500"
                              : dailyStats.moodScore >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          )}
                          style={{ width: `${dailyStats.moodScore}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-xs text-muted-foreground text-right">
                    Last updated: {format(dailyStats.lastUpdated, "h:mm a")}
                  </div>
                </CardContent>
              </Card>

              {/* Insights */}
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                    Insights
                  </CardTitle>
                  <CardDescription>
                    Personalized recommendations based on your activity patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.length > 0 ? (
                      insights.map((insight, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-4 rounded-lg space-y-2 transition-all hover:scale-[1.02]",
                            insight.priority === "high"
                              ? "bg-primary/10"
                              : insight.priority === "medium"
                              ? "bg-primary/5"
                              : "bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <insight.icon className="w-5 h-5 text-primary" />
                            <p className="font-medium">{insight.title}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p>Complete more activities to receive personalized insights</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Quick Nav Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {navCards.map((card) => (
                <button
                  key={card.href}
                  onClick={() => router.push(card.href)}
                  className={cn(
                    "group p-4 rounded-xl border bg-card text-left transition-all duration-200",
                    "hover:shadow-md hover:scale-[1.02]",
                    card.borderColor
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-3", card.bgColor)}>
                    <card.icon className={cn("w-5 h-5", card.color)} />
                  </div>
                  <p className="font-semibold text-sm">{card.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
                </button>
              ))}
            </div>

            {/* ── Journal Preview Card ── */}
            <Card className="border-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenLine className="w-5 h-5 text-amber-500" />
                    <CardTitle>Recent Journal Entries</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-amber-600 hover:text-amber-700"
                    onClick={() => router.push("/journal")}
                  >
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <CardDescription>
                  Your latest reflections — stored privately on your device
                </CardDescription>
              </CardHeader>
              <CardContent>
                {journalPreviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No journal entries yet.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-2"
                      onClick={() => router.push("/journal")}
                    >
                      <PenLine className="w-4 h-4" />
                      Write your first entry
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {journalPreviews.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-950/30 transition-colors"
                        onClick={() => router.push("/journal")}
                      >
                        <p className="text-xs text-muted-foreground mb-1">
                          {format(new Date(entry.createdAt), "EEEE, MMM d · h:mm a")}
                        </p>
                        <p className="text-sm line-clamp-2 text-foreground/80">
                          {entry.text}
                        </p>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 mt-1"
                      onClick={() => router.push("/journal")}
                    >
                      <PenLine className="w-4 h-4" />
                      Write new entry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

        {activeTab === "yoga" && <YogaPosesSection />}
        {activeTab === "breathing" && <BreathingExerciseSection />}
        {activeTab === "games" && <AnxietyGames onGamePlayed={handleGamePlayed} />}

      </Container>

      {/* Mood Modal */}
      <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
            <DialogDescription>
              Move the slider to track your current mood
            </DialogDescription>
          </DialogHeader>
          <MoodForm onSuccess={handleMoodSuccess} />
        </DialogContent>
      </Dialog>

      <ActivityLogger
        open={showActivityLogger}
        onOpenChange={setShowActivityLogger}
        onActivityLogged={handleActivityLogged}
      />
    </div>
  );
}
