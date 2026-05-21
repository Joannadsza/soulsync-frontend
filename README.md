# SoulSync Frontend

> Your AI-Powered Mental Health Companion

SoulSync is a full-stack mental health support web application built with Next.js. It provides real-time AI therapy sessions, mood tracking, journaling, gamification, and therapeutic activities in a secure and accessible environment.

## Features

- 🤖 **AI Therapy Chat** — Real-time multi-turn conversations with an AI therapist powered by Groq's LLaMA-3.3-70b model, following WHO and AFSP safe messaging guidelines
- 📊 **Mood Tracking** — Log and visualise your emotional state over time with a 14-day trend chart
- 🚨 **Crisis Detection** — Dual-layer keyword and LLM-based crisis detection with immediate emergency modal and helpline routing
- 🏆 **Gamification** — XP system, levels, and streaks to encourage consistent engagement
- 📓 **Journal** — Private device-stored journal with AI reflection feature
- 🧘 **Therapeutic Activities** — Yoga poses, breathing exercises, Zen Garden, Mindful Forest, and Ocean Waves
- 🎙️ **Voice Input & Output** — Speak your messages and hear AI responses using Web Speech API
- 🏥 **Find a Therapist** — Browse iCall and Practo directory for licensed mental health professionals
- 📈 **Progress Tracking** — Activity calendar, session stats, and feature usage charts

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Authentication:** NextAuth.js + JWT
- **State Management:** React Context + useState

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/Joannadsza/soulsync-frontend.git
cd soulsync-frontend
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
BACKEND_API_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Deployment

The frontend is deployed on **Vercel**.

Live URL: [https://soulsync-frontend-rouge.vercel.app](https://soulsync-frontend-rouge.vercel.app)

## Project Structure
## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🌟 Acknowledgments

- Sonic
- Zerepy AI Framework
- Mental Health Professionals
- Open Source Community

---

<p align="center">
Built with ❤️ on Sonic Blaze Testnet and Zerepy for better mental health
</p>
