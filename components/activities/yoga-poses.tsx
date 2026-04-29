"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Timer,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  Flower2,
} from "lucide-react";
import { yogaPoses, type YogaPose } from "@/lib/static-data";
import { useEffect, useRef } from "react";

// ---------- Single Pose Card ----------
import { useGamification } from "@/components/gamification/GamificationEngine";

function PoseCard({ pose }: { pose: YogaPose }) {
  const { earn } = useGamification(); // ← add this
  const [expanded, setExpanded] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(pose.duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      earn("ACTIVITY_COMPLETE"); // ← add this — fires when pose timer completes
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive, timeLeft]);

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(pose.duration);
  };

  const difficultyColor = {
    beginner: "bg-green-500/10 text-green-600 dark:text-green-400",
    intermediate: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    advanced: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  const categoryColor = {
    relaxation: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    strength: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    flexibility: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    balance: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  };

  return (
    <Card className="group border border-primary/10 hover:border-primary/20 transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flower2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">{pose.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground italic">
              {pose.sanskritName}
            </p>
          </div>
          <div className="flex gap-1.5">
            <Badge variant="outline" className={difficultyColor[pose.difficulty]}>
              {pose.difficulty}
            </Badge>
            <Badge variant="outline" className={categoryColor[pose.category]}>
              {pose.category}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Pose Image */}
        <div className="w-full h-40 rounded-lg bg-primary/5 flex items-center justify-center overflow-hidden">
          <img
            src={pose.imageUrl}
            alt={pose.name}
            className="h-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        <p className="text-sm text-muted-foreground">{pose.description}</p>

        {/* Timer */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
          <Timer className="w-4 h-4 text-primary" />
          <span className="text-lg font-mono font-semibold text-foreground">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
          <div className="flex gap-1 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimerActive(!timerActive)}
            >
              {timerActive ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetTimer}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expand/Collapse for instructions */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide" : "Show"} Instructions
          {expanded ? (
            <ChevronUp className="w-4 h-4 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-1" />
          )}
        </Button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <ol className="space-y-2 pl-4 text-sm text-muted-foreground">
                {pose.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {pose.benefits.map((benefit, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ---------- Main Yoga Poses Component ----------
export function YogaPosesSection() {
  const [filter, setFilter] = useState<string>("all");

  const categories = ["all", "relaxation", "strength", "flexibility", "balance"];

  const filteredPoses =
    filter === "all"
      ? yogaPoses
      : yogaPoses.filter((p) => p.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Yoga Poses</h2>
          <p className="text-sm text-muted-foreground">
            Guided poses for mental and physical well-being
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(cat)}
            className="capitalize"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Pose Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPoses.map((pose) => (
          <PoseCard key={pose.id} pose={pose} />
        ))}
      </div>
    </div>
  );
}