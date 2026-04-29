// ─────────────────────────────────────────────────────────────────────────────
// lib/emergencyResources.ts
// Curated, verified emergency mental health resources
// Update phone numbers periodically — these are current as of 2025
// ─────────────────────────────────────────────────────────────────────────────

export interface EmergencyResource {
  id: string;
  name: string;
  phone?: string;
  website?: string;
  description: string;
  type: "hotline" | "online" | "facility";
  available: string;
  country: string;
  language?: string[];
  isFree: boolean;
}

export const EMERGENCY_RESOURCES: EmergencyResource[] = [
  // ── India — Hotlines ──────────────────────────────────────────────────────
  {
    id: "vandrevala",
    name: "Vandrevala Foundation",
    phone: "1860-2662-345",
    website: "https://www.vandrevalafoundation.com",
    description:
      "Free 24/7 mental health support by trained counsellors. Calls are confidential.",
    type: "hotline",
    available: "24/7",
    country: "India",
    language: ["English", "Hindi", "Marathi", "Gujarati"],
    isFree: true,
  },
  {
    id: "icall",
    name: "iCall — TISS",
    phone: "9152987821",
    website: "https://icallhelpline.org",
    description:
      "Psychosocial support helpline by Tata Institute of Social Sciences. Counselling and referrals.",
    type: "hotline",
    available: "Mon–Sat, 8am–10pm",
    country: "India",
    language: ["English", "Hindi"],
    isFree: true,
  },
  {
    id: "snehi",
    name: "SNEHI",
    phone: "044-24640050",
    website: "https://snehi.org",
    description:
      "Suicide prevention helpline offering emotional support and crisis intervention.",
    type: "hotline",
    available: "24/7",
    country: "India",
    language: ["English", "Hindi", "Tamil"],
    isFree: true,
  },
  {
    id: "aasra",
    name: "AASRA",
    phone: "9820466627",
    website: "http://www.aasra.info",
    description:
      "Crisis intervention centre for the emotionally distressed and suicidal. Operates 24/7.",
    type: "hotline",
    available: "24/7",
    country: "India",
    language: ["English", "Hindi"],
    isFree: true,
  },
  {
    id: "kiran",
    name: "KIRAN — Government of India",
    phone: "1800-599-0019",
    website: "https://nimhans.ac.in",
    description:
      "Free, 24/7 mental health rehabilitation helpline launched by the Government of India.",
    type: "hotline",
    available: "24/7",
    country: "India",
    language: ["English", "Hindi", "and 13 other languages"],
    isFree: true,
  },

  // ── India — Online platforms ───────────────────────────────────────────────
  {
    id: "betterlyf",
    name: "BetterLYF",
    website: "https://www.betterlyf.com",
    description:
      "India-based online counselling platform. Chat or video sessions with licensed therapists.",
    type: "online",
    available: "Chat: 24/7 · Video: schedule-based",
    country: "India",
    language: ["English", "Hindi"],
    isFree: false,
  },
  {
    id: "wysa",
    name: "Wysa",
    website: "https://www.wysa.io",
    description:
      "AI-powered mental health app with access to real therapists. Free tier available.",
    type: "online",
    available: "App: 24/7 · Therapist: scheduled",
    country: "India",
    language: ["English"],
    isFree: false,
  },
  {
    id: "yourcalla",
    name: "YourDOST",
    website: "https://yourdost.com",
    description:
      "Online counselling and emotional wellness platform with verified experts.",
    type: "online",
    available: "9am–9pm daily",
    country: "India",
    language: ["English", "Hindi"],
    isFree: false,
  },

  // ── India — Facilities ────────────────────────────────────────────────────
  {
    id: "nimhans",
    name: "NIMHANS — Bengaluru",
    phone: "080-46110007",
    website: "https://nimhans.ac.in",
    description:
      "National Institute of Mental Health and Neuro Sciences. Premier government psychiatric hospital.",
    type: "facility",
    available: "OPD: Mon–Sat 8am–12pm",
    country: "India",
    language: ["English", "Kannada", "Hindi"],
    isFree: true,
  },
  {
    id: "lhmc",
    name: "LHMC — New Delhi",
    phone: "011-23404428",
    website: "https://lhmc-hosp.gov.in",
    description:
      "Lady Hardinge Medical College — psychiatric OPD and emergency mental health services.",
    type: "facility",
    available: "OPD: Mon–Sat 9am–1pm",
    country: "India",
    language: ["English", "Hindi"],
    isFree: true,
  },
];

// Helper: Get only hotlines (fastest in a crisis)
export const HOTLINES = EMERGENCY_RESOURCES.filter((r) => r.type === "hotline");

// Helper: Get online platforms
export const ONLINE_PLATFORMS = EMERGENCY_RESOURCES.filter(
  (r) => r.type === "online"
);

// Helper: Get facilities
export const FACILITIES = EMERGENCY_RESOURCES.filter(
  (r) => r.type === "facility"
);
