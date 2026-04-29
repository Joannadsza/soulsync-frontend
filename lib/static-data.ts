export const staticSessions = [
  {
    id: "343",
    type: "text",
    status: "in_progress",
    scheduledTime: new Date(),
    summary:
      "Initial therapy session focusing on emotional well-being and personal growth.",
    title: "Welcome Session",
    isActive: true,
  },
  {
    id: "344",
    type: "text",
    status: "completed",
    scheduledTime: new Date(Date.now() - 86400000), // yesterday
    summary:
      "Discussion about stress management techniques and daily mindfulness practices.",
    title: "Stress Management Session",
  },
  {
    id: "345",
    type: "text",
    status: "completed",
    scheduledTime: new Date(Date.now() - 172800000), // 2 days ago
    summary: "Explored personal goals and aspirations for the coming months.",
    title: "Goal Setting Session",
  },
];

export const staticUser = {
  id: "user-1",
  name: "Demo User",
  email: "demo@example.com",
  walletId: "demo-wallet",
  walletAddress: "0x123...",
  preferences: {
    notifications: true,
    aiInterventions: true,
  },
};

export const staticChatHistory = [
  {
    id: "1",
    userId: "user-1",
    message: "Hello, I've been feeling a bit overwhelmed lately.",
    role: "user",
    timestamp: new Date(Date.now() - 3600000),
    sentiment: "concerned",
  },
  {
    id: "2",
    userId: "user-1",
    message:
      "I understand that feeling. Would you like to talk about what's been causing this overwhelm?",
    role: "assistant",
    timestamp: new Date(Date.now() - 3590000),
    sentiment: "empathetic",
  },
];

// ========== YOGA POSES DATA ==========

export interface YogaPose {
  id: string;
  name: string;
  sanskritName: string;
  description: string;
  benefits: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  imageUrl: string;
  instructions: string[];
  category: "relaxation" | "strength" | "flexibility" | "balance";
}

export const yogaPoses: YogaPose[] = [
  {
    id: "childs-pose",
    name: "Child's Pose",
    sanskritName: "Balasana",
    description: "A gentle resting pose that calms the mind and relieves tension.",
    benefits: ["Relieves stress", "Calms the brain", "Gently stretches hips and thighs"],
    difficulty: "beginner",
    duration: 60,
    imageUrl: "/images/yoga/childs-pose.svg",
    instructions: [
      "Kneel on the floor with toes together and knees hip-width apart.",
      "Lower your torso between your knees.",
      "Extend your arms forward, palms down.",
      "Rest your forehead on the mat.",
      "Breathe deeply and hold for 1 minute."
    ],
    category: "relaxation",
  },
  {
    id: "tree-pose",
    name: "Tree Pose",
    sanskritName: "Vrksasana",
    description: "A balancing pose that builds focus and calm concentration.",
    benefits: ["Improves balance", "Strengthens legs", "Builds concentration"],
    difficulty: "beginner",
    duration: 30,
    imageUrl: "/images/yoga/tree-pose.svg",
    instructions: [
      "Stand tall with feet together.",
      "Shift weight to your left foot.",
      "Place right sole on inner left thigh (not the knee).",
      "Bring hands to prayer position at chest.",
      "Hold for 30 seconds, then switch sides."
    ],
    category: "balance",
  },
  {
    id: "cat-cow",
    name: "Cat-Cow Stretch",
    sanskritName: "Marjaryasana-Bitilasana",
    description: "A flowing movement that warms the spine and releases tension.",
    benefits: ["Relieves back tension", "Improves posture", "Calms the mind"],
    difficulty: "beginner",
    duration: 45,
    imageUrl: "/images/yoga/cat-cow.svg",
    instructions: [
      "Start on hands and knees (tabletop position).",
      "Inhale: Drop belly, lift head and tailbone (Cow).",
      "Exhale: Round spine, tuck chin to chest (Cat).",
      "Flow between the two for 45 seconds.",
      "Match movement to your breath."
    ],
    category: "flexibility",
  },
  {
    id: "warrior-2",
    name: "Warrior II",
    sanskritName: "Virabhadrasana II",
    description: "A powerful standing pose that builds strength and stamina.",
    benefits: ["Strengthens legs", "Opens hips", "Builds endurance"],
    difficulty: "intermediate",
    duration: 30,
    imageUrl: "/images/yoga/warrior-2.svg",
    instructions: [
      "Stand with feet wide apart (about 4 feet).",
      "Turn right foot out 90 degrees, left foot slightly in.",
      "Bend right knee over right ankle.",
      "Extend arms parallel to the floor.",
      "Gaze over your right fingertips. Hold 30 seconds."
    ],
    category: "strength",
  },
  {
    id: "legs-up-wall",
    name: "Legs Up the Wall",
    sanskritName: "Viparita Karani",
    description: "A deeply restorative pose perfect for winding down.",
    benefits: ["Reduces anxiety", "Relieves tired legs", "Promotes deep relaxation"],
    difficulty: "beginner",
    duration: 120,
    imageUrl: "/images/yoga/legs-up-wall.svg",
    instructions: [
      "Sit sideways next to a wall.",
      "Swing your legs up the wall as you lie back.",
      "Scoot hips as close to the wall as comfortable.",
      "Rest arms by your sides, palms up.",
      "Close eyes and breathe deeply for 2 minutes."
    ],
    category: "relaxation",
  },
  {
    id: "bridge-pose",
    name: "Bridge Pose",
    sanskritName: "Setu Bandhasana",
    description: "Opens the chest and calms the brain while stretching the spine.",
    benefits: ["Reduces stress", "Opens chest", "Strengthens back"],
    difficulty: "beginner",
    duration: 45,
    imageUrl: "/images/yoga/bridge-pose.svg",
    instructions: [
      "Lie on your back with knees bent, feet hip-width apart.",
      "Press feet into the floor and lift hips up.",
      "Clasp hands under your back if comfortable.",
      "Keep thighs parallel, chest lifted.",
      "Hold for 45 seconds, then slowly lower."
    ],
    category: "strength",
  },
];

// ========== BREATHING EXERCISE DATA ==========

export interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  pattern: {
    inhale: number;
    hold: number;
    exhale: number;
    holdOut?: number;
  };
  rounds: number;
  benefits: string[];
  guidedScript: string[];
}

export const breathingExercises: BreathingExercise[] = [
  {
    id: "box-breathing",
    name: "Box Breathing",
    description: "A technique used by Navy SEALs to calm the nervous system.",
    pattern: { inhale: 4, hold: 4, exhale: 4, holdOut: 4 },
    rounds: 4,
    benefits: ["Reduces stress", "Improves focus", "Lowers heart rate"],
    guidedScript: [
      "Find a comfortable position and close your eyes.",
      "Breathe in slowly... 1... 2... 3... 4...",
      "Hold your breath gently... 1... 2... 3... 4...",
      "Now exhale slowly... 1... 2... 3... 4...",
      "Hold empty... 1... 2... 3... 4...",
      "You're doing great. Let's continue..."
    ],
  },
  {
    id: "4-7-8",
    name: "4-7-8 Relaxing Breath",
    description: "Dr. Andrew Weil's technique for deep relaxation and sleep.",
    pattern: { inhale: 4, hold: 7, exhale: 8 },
    rounds: 4,
    benefits: ["Promotes sleep", "Reduces anxiety", "Calms the mind"],
    guidedScript: [
      "Let your shoulders drop and relax your jaw.",
      "Breathe in through your nose... 1... 2... 3... 4...",
      "Hold gently... feel the stillness... 1... 2... 3... 4... 5... 6... 7...",
      "Exhale completely through your mouth... 1... 2... 3... 4... 5... 6... 7... 8...",
      "Feel the wave of calm washing over you..."
    ],
  },
  {
    id: "deep-belly",
    name: "Deep Belly Breathing",
    description: "Simple diaphragmatic breathing to activate your relaxation response.",
    pattern: { inhale: 5, hold: 2, exhale: 5 },
    rounds: 6,
    benefits: ["Activates parasympathetic system", "Reduces tension", "Improves oxygen flow"],
    guidedScript: [
      "Place one hand on your chest and one on your belly.",
      "Breathe in deeply through your nose, feel your belly rise...",
      "Pause for a moment...",
      "Exhale slowly, feel your belly fall...",
      "Your chest should stay mostly still.",
      "Feel the rhythm of your natural breath..."
    ],
  },
];

// ========== AMBIENT SOUND OPTIONS ==========

export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  audioFile: string;
  description: string;
}

export const ambientSounds: AmbientSound[] = [
  {
    id: "birds",
    name: "Birds & Nature",
    icon: "🐦",
    audioFile: "/sounds/birds.mp3",
    description: "Gentle birdsong",
  },
  {
    id: "leaves",
    name: "Rustling Leaves",
    icon: "🍃",
    audioFile: "/sounds/leaves.mp3",
    description: "Soft leaves in the wind",
  },
  {
    id: "waves",
    name: "Ocean Waves",
    icon: "🌊",
    audioFile: "/sounds/waves.mp3",
    description: "Calm ocean waves",
  },
  {
    id: "wind",
    name: "Gentle Wind",
    icon: "🌬️",
    audioFile: "/sounds/wind.mp3",
    description: "Soft wind blowing",
  },
  {
    id: "silence",
    name: "Silence",
    icon: "🤫",
    audioFile: "",
    description: "No background sound",
  },
];