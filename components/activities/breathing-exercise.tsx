"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Wind,
  Music,
} from "lucide-react";
import {
  breathingExercises,
  ambientSounds,
  type BreathingExercise,
  type AmbientSound,
} from "@/lib/static-data";

// ---------- Breathing Circle Animation ----------
function BreathingCircle({
  phase,
  progress,
}: {
  phase: "inhale" | "hold" | "exhale" | "holdOut" | "idle";
  progress: number; // 0 to 1
}) {
  const scale =
    phase === "inhale"
      ? 0.6 + 0.4 * progress
      : phase === "exhale"
      ? 1.0 - 0.4 * progress
      : phase === "hold"
      ? 1.0
      : phase === "holdOut"
      ? 0.6
      : 0.8;

  const phaseColors = {
    inhale: "from-blue-400 to-cyan-300",
    hold: "from-purple-400 to-indigo-300",
    exhale: "from-teal-400 to-green-300",
    holdOut: "from-slate-400 to-gray-300",
    idle: "from-primary/40 to-primary/20",
  };

  const phaseLabels = {
    inhale: "Breathe In...",
    hold: "Hold...",
    exhale: "Breathe Out...",
    holdOut: "Hold...",
    idle: "Press Play to Begin",
  };

  return (
    <div className="relative flex items-center justify-center h-64 w-64 mx-auto">
      <div
        className={`absolute rounded-full bg-gradient-to-br ${phaseColors[phase]} blur-3xl opacity-30 transition-all duration-500`}
        style={{
          width: `${scale * 280}px`,
          height: `${scale * 280}px`,
        }}
      />
      <motion.div
        className={`rounded-full bg-gradient-to-br ${phaseColors[phase]} flex items-center justify-center shadow-lg`}
        animate={{ width: scale * 200, height: scale * 200 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <span className="text-white font-medium text-sm text-center px-4 drop-shadow-md">
          {phaseLabels[phase]}
        </span>
      </motion.div>
    </div>
  );
}

// ---------- Sound Picker ----------
function SoundPicker({
  selected,
  onSelect,
}: {
  selected: AmbientSound;
  onSelect: (sound: AmbientSound) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {ambientSounds.map((sound) => (
        <Button
          key={sound.id}
          variant={selected.id === sound.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(sound)}
          className="gap-1.5"
        >
          <span>{sound.icon}</span>
          <span>{sound.name}</span>
        </Button>
      ))}
    </div>
  );
}

// ---------- Guided Text Display ----------
function GuidedText({ text }: { text: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={text}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className="text-center text-muted-foreground italic text-sm min-h-[2.5rem]"
      >
        "{text}"
      </motion.p>
    </AnimatePresence>
  );
}

// ---------- Main Breathing Exercise Component ----------
import { useGamification } from "@/components/gamification/GamificationEngine";

export function BreathingExerciseSection() {
  const { earn } = useGamification(); 
  const [selectedExercise, setSelectedExercise] = useState<BreathingExercise>(
    breathingExercises[0]
  );
  const [selectedSound, setSelectedSound] = useState<AmbientSound>(
    ambientSounds[0]
  );
  const [isPlaying, setIsPlaying] = useState(false);
const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "holdOut" | "idle">("idle");
  const [progress, setProgress] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [guidedTextIndex, setGuidedTextIndex] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // --- Guided voice speech ---
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 0.9;
      utterance.volume = isMuted ? 0 : volume / 100;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Audio setup ---
  useEffect(() => {
    if (selectedSound.audioFile) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(selectedSound.audioFile);
      audioRef.current.loop = true;
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [selectedSound]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // --- Breathing cycle engine ---
  const runCycle = useCallback(() => {
    const { pattern, rounds, guidedScript } = selectedExercise;
    const phases: { name: typeof phase; duration: number }[] = [
      { name: "inhale", duration: pattern.inhale },
      { name: "hold", duration: pattern.hold },
      { name: "exhale", duration: pattern.exhale },
    ];
    if (pattern.holdOut) {
      phases.push({ name: "holdOut", duration: pattern.holdOut });
    }

    let round = 0;
    let phaseIndex = 0;
    let scriptIndex = 0;

    const runPhase = () => {
      if (round >= rounds) {
        setPhase("idle");
        setIsPlaying(false);
        setCurrentRound(0);
        if (audioRef.current) audioRef.current.pause();
        window.speechSynthesis.cancel();
        earn("ACTIVITY_COMPLETE");
	return;
      }

      const currentPhase = phases[phaseIndex];
      setPhase(currentPhase.name);
      setCurrentRound(round + 1);

      // Cycle through guided script
      setGuidedTextIndex(scriptIndex % guidedScript.length);
      speak(guidedScript[scriptIndex % guidedScript.length]);
      scriptIndex++;

      // Animate progress from 0 to 1 over the phase duration
      const phaseDuration = currentPhase.duration * 1000;
      startTimeRef.current = Date.now();

      const animateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const p = Math.min(elapsed / phaseDuration, 1);
        setProgress(p);

        if (p < 1) {
          timerRef.current = setTimeout(animateProgress, 50);
        } else {
          phaseIndex++;
          if (phaseIndex >= phases.length) {
            phaseIndex = 0;
            round++;
          }
          runPhase();
        }
      };

      animateProgress();
    };

    runPhase();
  }, [selectedExercise]);

  const startExercise = () => {
    setIsPlaying(true);
    setPhase("idle");
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    setTimeout(() => runCycle(), 500);
  };

  const stopExercise = () => {
    setIsPlaying(false);
    setPhase("idle");
    setProgress(0);
    setCurrentRound(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (audioRef.current) audioRef.current.pause();
    window.speechSynthesis.cancel();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Wind className="w-5 h-5 text-primary" />
          Breathing Exercises
        </h2>
        <p className="text-sm text-muted-foreground">
          Guided breathing with ambient sounds for deep relaxation
        </p>
      </div>

      {/* Exercise Selector */}
      <div className="flex gap-2 flex-wrap">
        {breathingExercises.map((ex) => (
          <Button
            key={ex.id}
            variant={selectedExercise.id === ex.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (!isPlaying) setSelectedExercise(ex);
            }}
            disabled={isPlaying}
          >
            {ex.name}
          </Button>
        ))}
      </div>

      {/* Main Breathing Card */}
      <Card className="border border-primary/10 overflow-hidden">
        <CardContent className="pt-6 space-y-6">
          {/* Description */}
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-lg text-foreground">
              {selectedExercise.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedExercise.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Pattern: {selectedExercise.pattern.inhale}s in /{" "}
              {selectedExercise.pattern.hold}s hold /{" "}
              {selectedExercise.pattern.exhale}s out
              {selectedExercise.pattern.holdOut
                ? ` / ${selectedExercise.pattern.holdOut}s hold`
                : ""}
              {" · "}{selectedExercise.rounds} rounds
            </p>
          </div>

          {/* Breathing Animation */}
          <BreathingCircle phase={phase} progress={progress} />

          {/* Guided Text */}
          <GuidedText
            text={
              selectedExercise.guidedScript[guidedTextIndex] ||
              "Prepare yourself..."
            }
          />

          {/* Round Counter */}
          {isPlaying && (
            <p className="text-center text-xs text-muted-foreground">
              Round {currentRound} of {selectedExercise.rounds}
            </p>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-3">
            {!isPlaying ? (
              <Button onClick={startExercise} size="lg" className="gap-2">
                <Play className="w-4 h-4" /> Start
              </Button>
            ) : (
              <>
                <Button
                  onClick={stopExercise}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Stop
                </Button>
              </>
            )}
          </div>

          {/* Sound Selection */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2 justify-center">
              <Music className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Ambient Sound
              </span>
            </div>
            <SoundPicker
              selected={selectedSound}
              onSelect={(s) => {
                if (!isPlaying) setSelectedSound(s);
              }}
            />

            {/* Volume Control */}
            <div className="flex items-center gap-3 max-w-xs mx-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[volume]}
                onValueChange={(v) => setVolume(v[0])}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}