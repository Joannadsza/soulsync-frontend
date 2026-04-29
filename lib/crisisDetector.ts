// ─────────────────────────────────────────────────────────────────────────────
// lib/crisisDetector.ts
// Two-layer crisis detection:
//   Layer 1 — fast local keyword scan
//   Layer 2 — backend Gemini severity scoring (only if Layer 1 fires)
// ─────────────────────────────────────────────────────────────────────────────

export interface CrisisDetectionResult {
  triggered: boolean;
  severity: number;       // 0–10 (0 = safe, 10 = extreme crisis)
  reason: string;
  resources?: EmergencyResource[];
}

export interface EmergencyResource {
  name: string;
  phone?: string;
  website?: string;
  description: string;
  type: "hotline" | "online" | "facility";
  available: string;     // e.g. "24/7" or "Mon–Sat 9am–9pm"
}

// ─── Layer 1: Keyword tiers ───────────────────────────────────────────────────

// Tier A — immediate red flags (score bump +8)
const TIER_A_KEYWORDS = [
  "want to die",
  "kill myself",
  "end my life",
  "suicide",
  "suicidal",
  "take my life",
  "not want to live",
  "don't want to live",
  "dont want to live",
  "no reason to live",
  "better off dead",
  "better off without me",
  "end it all",
  "ending it",
  "end everything",
  "overdose",
  "hang myself",
  "cut myself",
  "hurt myself",
];

// Tier B — serious distress signals (score bump +4)
const TIER_B_KEYWORDS = [
  "no hope",
  "hopeless",
  "give up",
  "can't go on",
  "cannot go on",
  "can't take it anymore",
  "cannot take it",
  "worthless",
  "hate myself",
  "no point",
  "nobody cares",
  "no one cares",
  "disappear",
  "want to disappear",
  "burden to everyone",
  "burden to others",
  "everyone would be better",
  "tired of living",
  "nothing to live for",
  "severe depression",
  "completely alone",
  "self harm",
  "self-harm",
  "cutting",
];

// Tier C — moderate distress (score bump +2)
const TIER_C_KEYWORDS = [
  "depressed",
  "can't cope",
  "cannot cope",
  "breaking down",
  "falling apart",
  "lost everything",
  "all alone",
  "no one understands",
  "no one to talk to",
  "empty inside",
  "numb",
  "pointless",
  "miserable",
  "desperate",
  "overwhelmed",
  "helpless",
];

function keywordScore(text: string): { score: number; matchedTier: "A" | "B" | "C" | null } {
  const lower = text.toLowerCase();

  for (const kw of TIER_A_KEYWORDS) {
    if (lower.includes(kw)) return { score: 8, matchedTier: "A" };
  }
  for (const kw of TIER_B_KEYWORDS) {
    if (lower.includes(kw)) return { score: 4, matchedTier: "B" };
  }
  for (const kw of TIER_C_KEYWORDS) {
    if (lower.includes(kw)) return { score: 2, matchedTier: "C" };
  }

  return { score: 0, matchedTier: null };
}

// ─── Layer 2: Backend Gemini severity call ────────────────────────────────────

async function getGeminiSeverity(
  messages: { role: string; content: string }[],
  token: string
): Promise<{ severity: number; reason: string }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chat/crisis-analysis`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: messages.slice(-10) }), // last 10 msgs
      }
    );

    if (!res.ok) throw new Error("Crisis analysis request failed");

    const data = await res.json();
    return {
      severity: data.severity ?? 0,
      reason: data.reason ?? "No reason provided",
    };
  } catch {
    // If backend fails, fall back to keyword score only — don't block the UI
    return { severity: 0, reason: "Backend analysis unavailable" };
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Analyse the latest user message and (if keywords fire) ask the backend
 * to score the full conversation severity.
 *
 * @param latestMessage  The message the user just typed
 * @param history        Full conversation history [{role, content}]
 * @param token          User JWT (for the backend call)
 * @returns              CrisisDetectionResult
 */
export async function detectCrisis(
  latestMessage: string,
  history: { role: string; content: string }[],
  token: string
): Promise<CrisisDetectionResult> {
  const { score: kwScore, matchedTier } = keywordScore(latestMessage);

  // Fast path: no keywords → definitely safe
  if (kwScore === 0) {
    return { triggered: false, severity: 0, reason: "No crisis signals detected" };
  }

  // Tier A keywords fire immediately without waiting for Gemini
  if (matchedTier === "A") {
    const gemini = await getGeminiSeverity(history, token);
    const finalScore = Math.max(kwScore, gemini.severity);
    return {
      triggered: finalScore >= 7,
      severity: finalScore,
      reason: gemini.reason || "Immediate crisis keywords detected",
    };
  }

  // Tier B/C — get Gemini to confirm
  const gemini = await getGeminiSeverity(history, token);
  const finalScore = Math.round((kwScore + gemini.severity) / 2);

  return {
    triggered: finalScore >= 7,
    severity: finalScore,
    reason: gemini.reason || "Distress signals detected",
  };
}
