"use client";

import { MoodAnalysisPanel, MoodData } from "@/components/chat/MoodAnalysisPanel";
import { useGamification, XPBar } from "@/components/gamification/GamificationEngine";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  X,
  PlusCircle,
  MessageSquare,
  Trash2,
  BarChart2,
  BookOpen,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { BreathingGame } from "@/components/games/breathing-game";
import { ZenGarden } from "@/components/games/zen-garden";
import { ForestGame } from "@/components/games/forest-game";
import { OceanWaves } from "@/components/games/ocean-waves";
import { Badge } from "@/components/ui/badge";
import {
  createChatSession,
  sendChatMessage,
  getChatHistory,
  analyseSession,
  ChatMessage,
  getAllChatSessions,
  ChatSession,
} from "@/lib/api/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isYesterday } from "date-fns";
import EmergencyModal from "@/components/EmergencyModal";
import { detectCrisis } from "@/lib/crisisDetector";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StressPrompt {
  trigger: string;
  activity: {
    type: "breathing" | "garden" | "forest" | "waves";
    title: string;
    description: string;
  };
}

interface JournalEntry {
  sessionId: string;
  text: string;
  reflection?: string;
  updatedAt: string;
}

// ─── Web Speech API types (not in all TS defs) ────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SUGGESTED_QUESTIONS = [
  { text: "How can I manage my anxiety better?" },
  { text: "I've been feeling overwhelmed lately" },
  { text: "Can we talk about improving sleep?" },
  { text: "I need help with work-life balance" },
];

const glowAnimation = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatSessionTime(raw: Date | string | undefined | null): string {
  try {
    if (!raw) return "Just now";
    const date = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(date.getTime())) return "Just now";
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60_000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    if (isToday(date)) return `Today ${format(date, "h:mm a")}`;
    if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  } catch {
    return "Just now";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TherapyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: sessionData } = useSession();
  const { earn } = useGamification();

  // ── Chat state ────────────────────────────────────────────────────────────
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stressPrompt, setStressPrompt] = useState<StressPrompt | null>(null);
  const [showActivity, setShowActivity] = useState(false);
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(params.sessionId as string);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // ── Mood panel state ──────────────────────────────────────────────────────
  const [currentMood, setCurrentMood] = useState<MoodData | null>(null);
  const [showMoodPanel, setShowMoodPanel] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);

  // ── Journal state ─────────────────────────────────────────────────────────
  const [showJournal, setShowJournal] = useState(false);
  const [journalText, setJournalText] = useState("");
  const [journalReflection, setJournalReflection] = useState("");
  const [isGettingReflection, setIsGettingReflection] = useState(false);

  // ── Voice state ───────────────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // ── Emergency modal ───────────────────────────────────────────────────────
  const [emergencyModal, setEmergencyModal] = useState<{ isOpen: boolean; severity: number }>({
    isOpen: false,
    severity: 0,
  });

  // ── Voice setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((r: any) => r[0].transcript)
            .join("");
          setMessage(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setMessage("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = useCallback((text: string) => {
    if (!synthRef.current || !voiceOutputEnabled) return;
    synthRef.current.cancel();
    // Strip markdown for cleaner TTS
    const plain = text
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/`(.+?)`/g, "$1")
      .trim();
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    // Prefer a natural-sounding voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.includes("Samantha") ||
        v.name.includes("Google UK English Female") ||
        v.name.includes("Microsoft Zira") ||
        v.lang.startsWith("en")
    );
    if (preferred) utterance.voice = preferred;
    synthRef.current.speak(utterance);
  }, [voiceOutputEnabled]);

  // ── Journal persistence ───────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    try {
      const stored = localStorage.getItem(`journal_${sessionId}`);
      if (stored) {
        const entry: JournalEntry = JSON.parse(stored);
        setJournalText(entry.text || "");
        setJournalReflection(entry.reflection || "");
      } else {
        setJournalText("");
        setJournalReflection("");
      }
    } catch {
      setJournalText("");
      setJournalReflection("");
    }
  }, [sessionId]);

  const saveJournal = () => {
    if (!sessionId) return;
    const entry: JournalEntry = {
      sessionId,
      text: journalText,
      reflection: journalReflection,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`journal_${sessionId}`, JSON.stringify(entry));
    earn("JOURNAL_SAVE");
  };

  const handleGetReflection = async () => {
    if (!journalText.trim()) return;
    setIsGettingReflection(true);
    try {
      const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: `Please give me a short, compassionate reflection on this journal entry:\n\n"${journalText}"\n\nKeep it to 2-3 sentences.`,
        }),
      });
      const data = await res.json();
      const reflection = data.response || data.message || "";
      setJournalReflection(reflection);
      localStorage.setItem(
        `journal_${sessionId}`,
        JSON.stringify({ sessionId, text: journalText, reflection, updatedAt: new Date().toISOString() })
      );
      earn("JOURNAL_REFLECTION");
    } catch (err) {
      console.error("Journal reflection error:", err);
    } finally {
      setIsGettingReflection(false);
    }
  };

  // ── End Session — triggers mood analysis ──────────────────────────────────
  const handleEndSession = async () => {
    if (!sessionId || messages.length === 0 || isAnalysing) return;
    setIsAnalysing(true);
    try {
      const analysis = await analyseSession(sessionId);
      if (analysis) {
        setCurrentMood({
          emotionalState: analysis.emotionalState || "neutral",
          riskLevel: analysis.riskLevel || 0,
          themes: analysis.themes || [],
          recommendedApproach: analysis.recommendedApproach,
          progressIndicators: analysis.progressIndicators,
        });

        // Also save this as a mood entry so dashboard picks it up
        const moodScore = analysis.moodScore ?? 50;
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
          await fetch("/api/mood", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ score: moodScore, note: `Auto-logged from therapy session` }),
          }).catch(() => {});
        }

        setShowMoodPanel(true);
        earn("SESSION_COMPLETE");
      }
    } catch (err) {
      console.error("Session analysis error:", err);
    } finally {
      setIsAnalysing(false);
    }
  };

  // ── Session management ────────────────────────────────────────────────────
  const handleNewSession = async () => {
    try {
      setIsLoading(true);
      const newSessionId = await createChatSession();
      setSessions((prev) => [
        { sessionId: newSessionId, messages: [], createdAt: new Date(), updatedAt: new Date() },
        ...prev,
      ]);
      setSessionId(newSessionId);
      setMessages([]);
      setCurrentMood(null);
      setShowMoodPanel(false);
      window.history.pushState({}, "", `/therapy/${newSessionId}`);
    } catch (error) {
      console.error("Failed to create new session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, targetSessionId: string) => {
    e.stopPropagation();
    if (deletingSessionId) return;
    try {
      setDeletingSessionId(targetSessionId);
      const response = await fetch(`${API_BASE}/chat/sessions/${targetSessionId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete session");
      setSessions((prev) => prev.filter((s) => s.sessionId !== targetSessionId));
      if (targetSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.sessionId !== targetSessionId);
        if (remaining.length > 0) handleSessionSelect(remaining[0].sessionId);
        else handleNewSession();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleSessionSelect = async (selectedSessionId: string) => {
    if (selectedSessionId === sessionId) return;
    try {
      setIsLoading(true);
      setCurrentMood(null);
      setShowMoodPanel(false);
      const history = await getChatHistory(selectedSessionId);
      if (Array.isArray(history)) {
        setMessages(history.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) })));
        setSessionId(selectedSessionId);
        window.history.pushState({}, "", `/therapy/${selectedSessionId}`);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Init chat ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        if (!sessionId || sessionId === "new") {
          const newSessionId = await createChatSession();
          setSessionId(newSessionId);
          window.history.pushState({}, "", `/therapy/${newSessionId}`);
        } else {
          try {
            const history = await getChatHistory(sessionId);
            if (Array.isArray(history)) {
              setMessages(history.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) })));
            } else {
              setMessages([]);
            }
          } catch {
            setMessages([]);
          }
        }
      } catch {
        setMessages([
          {
            role: "assistant",
            content: "I apologize, but I'm having trouble loading the chat session. Please try refreshing the page.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await getAllChatSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error("Failed to load sessions:", error);
      }
    };
    loadSessions();
  }, [messages.length]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  useEffect(() => {
    if (!isTyping) scrollToBottom();
  }, [messages, isTyping]);

  // ── Stress detection ──────────────────────────────────────────────────────
  const detectStressSignals = (msg: string): StressPrompt | null => {
    const keywords = ["stress", "anxiety", "worried", "panic", "overwhelmed", "nervous", "tense", "pressure", "can't cope", "exhausted"];
    const found = keywords.find((k) => msg.toLowerCase().includes(k));
    if (!found) return null;
    const activities = [
      { type: "breathing" as const, title: "Breathing Exercise", description: "Follow calming breathing exercises with visual guidance" },
      { type: "garden" as const, title: "Zen Garden", description: "Create and maintain your digital peaceful space" },
      { type: "forest" as const, title: "Mindful Forest", description: "Take a peaceful walk through a virtual forest" },
      { type: "waves" as const, title: "Ocean Waves", description: "Match your breath with gentle ocean waves" },
    ];
    return { trigger: found, activity: activities[Math.floor(Math.random() * activities.length)] };
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMessage = message.trim();
    if (!currentMessage || isTyping || isChatPaused || !sessionId) return;

    // Stop any ongoing speech recognition
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setMessage("");
    setIsTyping(true);

    try {
      setMessages((prev) => [...prev, { role: "user", content: currentMessage, timestamp: new Date() }]);
      earn("SEND_MESSAGE");

      // Crisis detection
      const token = (sessionData?.user as any)?.token ?? "";
      detectCrisis(currentMessage, messages.map((m) => ({ role: m.role, content: m.content })), token).then((result) => {
        if (result.triggered) setEmergencyModal({ isOpen: true, severity: result.severity });
      });

      const stressCheck = detectStressSignals(currentMessage);
      if (stressCheck) setStressPrompt(stressCheck);

      const response = await sendChatMessage(sessionId, currentMessage);
      const aiResponse = typeof response === "string" ? JSON.parse(response) : response;

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse.response || aiResponse.message || "I'm here to support you. Could you tell me more?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Voice output — speak the AI's reply if enabled
      speakText(assistantMessage.content);

      setIsTyping(false);
      scrollToBottom();
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I'm having trouble connecting right now. Please try again.",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }
  };

  const handleActivityComplete = () => {
    setShowActivity(false);
    setIsChatPaused(false);
    setStressPrompt(null);
    earn("ACTIVITY_COMPLETE");
  };

  const handleSuggestedQuestion = async (text: string) => {
    if (!sessionId) {
      const newSessionId = await createChatSession();
      setSessionId(newSessionId);
      router.push(`/therapy/${newSessionId}`);
    }
    setMessage(text);
    setTimeout(() => handleSubmit(new Event("submit") as unknown as React.FormEvent), 0);
  };

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative max-w-7xl mx-auto px-4">
      <EmergencyModal
        isOpen={emergencyModal.isOpen}
        severity={emergencyModal.severity}
        onDismiss={() => setEmergencyModal({ isOpen: false, severity: 0 })}
      />

      <div className="flex h-[calc(100vh-4rem)] mt-20 gap-6">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="w-80 flex flex-col border-r bg-muted/30">
          <div className="p-4 border-b space-y-3">
            <XPBar />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chat Sessions</h2>
              <Button variant="ghost" size="icon" onClick={handleNewSession} disabled={isLoading} className="hover:bg-primary/10">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
              </Button>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleNewSession} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              New Session
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {sessions.map((s) => {
                const lastMsgTime = s.messages.length > 0 ? s.messages[s.messages.length - 1].timestamp : undefined;
                const displayTime = formatSessionTime(lastMsgTime ?? s.updatedAt ?? s.createdAt);
                return (
                  <div
                    key={s.sessionId}
                    className={cn(
                      "group p-3 rounded-lg text-sm cursor-pointer hover:bg-primary/5 transition-colors relative",
                      s.sessionId === sessionId ? "bg-primary/10 text-primary" : "bg-secondary/10"
                    )}
                    onClick={() => handleSessionSelect(s.sessionId)}
                  >
                    {/* Completed badge */}
                    {s.status === "completed" && (
                      <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-emerald-500" title="Session completed" />
                    )}
                    <button
                      onClick={(e) => handleDeleteSession(e, s.sessionId)}
                      className={cn(
                        "absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity",
                        "hover:bg-destructive/10 hover:text-destructive text-muted-foreground",
                        deletingSessionId === s.sessionId && "opacity-100 cursor-not-allowed"
                      )}
                    >
                      {deletingSessionId === s.sessionId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex items-center gap-2 mb-1 pr-6 pl-4">
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span className="font-medium truncate">{s.messages[0]?.content.slice(0, 28) || "New Chat"}</span>
                    </div>
                    <p className="line-clamp-2 text-muted-foreground pr-6 pl-4">
                      {s.messages[s.messages.length - 1]?.content || "No messages yet"}
                    </p>
                    <div className="flex items-center justify-between mt-2 pl-4">
                      <span className="text-xs text-muted-foreground">{s.messages.length} messages</span>
                      <span className="text-xs text-muted-foreground">{displayTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* ── Main chat area ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-background rounded-lg border">

          {/* Chat header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">AI Therapist</h2>
                <p className="text-sm text-muted-foreground">{messages.length} messages</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Voice output toggle */}
              <Button
                variant="outline"
                size="sm"
                className={cn("gap-1.5", voiceOutputEnabled && "bg-primary/10 border-primary/30")}
                onClick={() => {
                  if (voiceOutputEnabled) synthRef.current?.cancel();
                  setVoiceOutputEnabled((v) => !v);
                }}
                title={voiceOutputEnabled ? "Mute AI voice" : "Enable AI voice"}
              >
                {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">Voice</span>
              </Button>

              {/* End Session → triggers mood analysis */}
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50"
                  onClick={handleEndSession}
                  disabled={isAnalysing}
                  title="End session and see your mood analysis"
                >
                  {isAnalysing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{isAnalysing ? "Analysing..." : "End Session"}</span>
                </Button>
              )}

              {/* Mood panel toggle (only visible after analysis) */}
              {currentMood && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("gap-1.5", showMoodPanel && "bg-primary/10 border-primary/30")}
                  onClick={() => setShowMoodPanel((v) => !v)}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Mood</span>
                </Button>
              )}

              {/* Journal toggle */}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowJournal((v) => !v)}>
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Journal</span>
              </Button>
            </div>
          </div>

          {/* Chat + panels row */}
          <div className="flex flex-1 overflow-hidden">

            {/* Messages */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="max-w-2xl w-full space-y-8">
                    <div className="text-center space-y-4">
                      <div className="relative inline-flex flex-col items-center">
                        <motion.div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" initial="initial" animate="animate" variants={glowAnimation} />
                        <div className="relative flex items-center gap-2 text-2xl font-semibold">
                          <Sparkles className="w-6 h-6 text-primary" />
                          <span className="bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">AI Therapist</span>
                        </div>
                        <p className="text-muted-foreground mt-2">How can I assist you today?</p>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <motion.div key={q.text} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.5 }}>
                          <Button variant="outline" className="w-full h-auto py-4 px-6 text-left justify-start hover:bg-muted/50 hover:border-primary/50" onClick={() => handleSuggestedQuestion(q.text)}>
                            {q.text}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto scroll-smooth">
                  <div className="max-w-3xl mx-auto">
                    <AnimatePresence initial={false}>
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={`${msg.timestamp?.toISOString?.() ?? idx}-${idx}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={cn("px-6 py-8", msg.role === "assistant" ? "bg-muted/30" : "bg-background")}
                        >
                          <div className="flex gap-4">
                            <div className="w-8 h-8 shrink-0 mt-1">
                              {msg.role === "assistant" ? (
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                                  <Bot className="w-5 h-5" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                                  <User className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-2 overflow-hidden min-h-[2rem]">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{msg.role === "assistant" ? "AI Therapist" : "You"}</p>
                                {/* Speak button for each AI message */}
                                {msg.role === "assistant" && (
                                  <button
                                    className="text-muted-foreground hover:text-primary transition-colors p-1 rounded"
                                    title="Read aloud"
                                    onClick={() => speakText(msg.content)}
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <div className="prose prose-sm dark:prose-invert leading-relaxed">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isTyping && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-8 flex gap-4 bg-muted/30">
                        <div className="w-8 h-8 shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="font-medium text-sm">AI Therapist</p>
                          <p className="text-sm text-muted-foreground">Typing...</p>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}

              {/* End Session hint */}
              {messages.length >= 4 && !currentMood && (
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 border-t border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-400 text-center">
                  When you're done chatting, click <strong>End Session</strong> to get your mood analysis.
                </div>
              )}

              {/* Input */}
              <div className="border-t bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 p-4">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2 items-end relative">
                  <div className="flex-1 relative group">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        isListening
                          ? "Listening… speak now"
                          : isChatPaused
                          ? "Complete the activity to continue..."
                          : "Ask me anything..."
                      }
                      className={cn(
                        "w-full resize-none rounded-2xl border bg-background p-3 pr-12 min-h-[48px] max-h-[200px]",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 placeholder:text-muted-foreground/70",
                        (isTyping || isChatPaused) && "opacity-50 cursor-not-allowed",
                        isListening && "border-red-400 ring-2 ring-red-300"
                      )}
                      rows={1}
                      disabled={isTyping || isChatPaused}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className={cn(
                        "absolute right-1.5 bottom-3.5 h-[36px] w-[36px] rounded-xl bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all duration-200",
                        (isTyping || isChatPaused || !message.trim()) && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={isTyping || isChatPaused || !message.trim()}
                      onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Mic button */}
                  {speechSupported && (
                    <Button
                      type="button"
                      size="icon"
                      variant={isListening ? "destructive" : "outline"}
                      className={cn(
                        "h-[48px] w-[48px] rounded-2xl shrink-0 transition-all",
                        isListening && "animate-pulse"
                      )}
                      onClick={toggleListening}
                      disabled={isTyping || isChatPaused}
                      title={isListening ? "Stop listening" : "Speak your message"}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                  )}
                </form>
                <div className="mt-2 text-xs text-center text-muted-foreground">
                  Press <kbd className="px-2 py-0.5 rounded bg-muted">Enter ↵</kbd> to send,{" "}
                  <kbd className="px-2 py-0.5 rounded bg-muted ml-1">Shift + Enter</kbd> for new line
                  {speechSupported && (
                    <span className="ml-2">· 🎤 mic for voice input</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Mood Analysis Panel ──────────────────────────────────────── */}
            {showMoodPanel && currentMood && (
              <MoodAnalysisPanel
                mood={currentMood}
                onClose={() => setShowMoodPanel(false)}
              />
            )}

            {/* ── Journal Panel ─────────────────────────────────────────────── */}
            <AnimatePresence>
              {showJournal && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-l bg-muted/20 flex flex-col overflow-hidden"
                  style={{ minWidth: 0 }}
                >
                  <div className="p-4 border-b flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">Session Journal</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowJournal(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <p className="text-xs text-muted-foreground">Write freely — your journal is private and stored only on your device.</p>
                    <textarea
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      placeholder="How are you feeling? What's on your mind today?"
                      className={cn(
                        "w-full resize-none rounded-lg border bg-background p-3 min-h-[180px] text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
                      )}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={saveJournal}>
                        Save (+20 XP)
                      </Button>
                      <Button size="sm" className="flex-1" onClick={handleGetReflection} disabled={isGettingReflection || !journalText.trim()}>
                        {isGettingReflection ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                        AI Reflection
                      </Button>
                    </div>
                    {journalReflection && (
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1">
                        <p className="text-xs font-medium text-primary">AI Reflection</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{journalReflection}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
