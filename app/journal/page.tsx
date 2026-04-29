"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, ArrowLeft, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useSession } from "@/lib/contexts/session-context";

interface JournalEntry {
  id: string;
  text: string;
  createdAt: string;
}

export default function JournalPage() {
  const router = useRouter();
  const { user } = useSession();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [mounted, setMounted] = useState(false);

  // Each user gets their own localStorage key so entries never leak between accounts
  const storageKey = user?._id ? `journal_entries_${user._id}` : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load entries once we have the storageKey (i.e. user is known)
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setEntries(JSON.parse(stored));
      else setEntries([]);
    } catch {
      setEntries([]);
    }
  }, [storageKey]);

  const handleSave = () => {
    if (!currentText.trim() || !storageKey) return;
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      text: currentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setCurrentText("");
  };

  const handleDelete = (id: string) => {
    if (!storageKey) return;
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amber-500" />
            <h1 className="text-3xl font-bold">Journal</h1>
          </div>
        </div>

        {/* New Entry */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>New Entry</CardTitle>
            <CardDescription>
              Write freely — entries are stored only on your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="How are you feeling today? What's on your mind?"
              className={cn(
                "w-full resize-none rounded-lg border bg-background p-3 min-h-[160px] text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
              )}
            />
            <Button
              onClick={handleSave}
              disabled={!currentText.trim()}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Entry
            </Button>
          </CardContent>
        </Card>

        {/* Past Entries */}
        {entries.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Past Entries</h2>
            {entries.map((entry) => (
              <Card key={entry.id} className="border-primary/10">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.createdAt), "EEEE, MMMM d, yyyy · h:mm a")}
                      </p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {entry.text}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No entries yet. Write your first one above.</p>
          </div>
        )}

      </Container>
    </div>
  );
}
