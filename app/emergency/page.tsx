"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/emergency/page.tsx
//
// Standalone emergency resources page — accessible from nav + modal redirect.
// Calm, warm, non-clinical design. Clearly organised into: Hotlines,
// Online platforms, Government facilities.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import {
  EMERGENCY_RESOURCES,
  EmergencyResource,
} from "@/lib/emergencyResources";

type Tab = "hotline" | "online" | "facility";

const TAB_CONFIG: { id: Tab; label: string; emoji: string; desc: string }[] = [
  {
    id: "hotline",
    label: "Helplines",
    emoji: "📞",
    desc: "Talk to a trained counsellor right now — free and confidential",
  },
  {
    id: "online",
    label: "Online therapy",
    emoji: "💬",
    desc: "Chat or video sessions with licensed therapists from home",
  },
  {
    id: "facility",
    label: "Hospitals & clinics",
    emoji: "🏥",
    desc: "In-person psychiatric care and emergency services",
  },
];

function ResourceCard({ resource }: { resource: EmergencyResource }) {
  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        transition: "border-color 0.2s, background 0.2s",
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(124,140,248,0.35)";
        (e.currentTarget as HTMLDivElement).style.background =
          "rgba(124,140,248,0.05)";
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLDivElement).style.background =
          "rgba(255,255,255,0.03)";
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div>
          <h3 style={{ color: "#e8eaf6", fontWeight: 600, fontSize: "1rem", marginBottom: "0.25rem" }}>
            {resource.name}
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: "20px",
                fontSize: "0.72rem",
                fontWeight: 600,
                background: resource.isFree
                  ? "rgba(100,200,150,0.15)"
                  : "rgba(255,200,100,0.12)",
                color: resource.isFree ? "#80cbc4" : "#ffd54f",
                border: `1px solid ${resource.isFree ? "rgba(100,200,150,0.25)" : "rgba(255,200,100,0.2)"}`,
              }}
            >
              {resource.isFree ? "FREE" : "Paid"}
            </span>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: "20px",
                fontSize: "0.72rem",
                color: "#7986cb",
                border: "1px solid rgba(121,134,203,0.25)",
              }}
            >
              {resource.available}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{ color: "#9fa8da", fontSize: "0.875rem", lineHeight: 1.65, margin: 0 }}>
        {resource.description}
      </p>

      {/* Language */}
      {resource.language && (
        <p style={{ color: "#5c6bc0", fontSize: "0.78rem", margin: 0 }}>
          Languages: {resource.language.join(" · ")}
        </p>
      )}

      {/* CTA row */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
        {resource.phone && (
          <a
            href={`tel:${resource.phone.replace(/-/g, "")}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            📞 {resource.phone}
          </a>
        )}
        {resource.website && (
          <a
            href={resource.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#9fa8da",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            Visit website ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function EmergencyPage() {
  const [activeTab, setActiveTab] = useState<Tab>("hotline");

  const filtered = EMERGENCY_RESOURCES.filter((r) => r.type === activeTab);
  const activeTabConfig = TAB_CONFIG.find((t) => t.id === activeTab)!;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0d0d1a 0%, #0f1729 50%, #0a1628 100%)",
        color: "#e8eaf6",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Back link */}
        <Link
          href="/therapy"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#5c6bc0",
            textDecoration: "none",
            fontSize: "0.875rem",
            marginBottom: "2rem",
          }}
        >
          ← Back to chat
        </Link>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(124, 140, 248, 0.1)",
              border: "2px solid rgba(124, 140, 248, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              margin: "0 auto 1.25rem",
            }}
          >
            🌿
          </div>
          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #e8eaf6, #9fa8da)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "0.75rem",
              lineHeight: 1.2,
            }}
          >
            You deserve support
          </h1>
          <p style={{ color: "#7986cb", fontSize: "1rem", lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
            Reaching out is one of the bravest things you can do. These services
            are here for you — many are free, all are confidential.
          </p>
        </div>

        {/* Immediate number strip */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderRadius: "18px",
            background: "rgba(102, 126, 234, 0.1)",
            border: "1px solid rgba(102, 126, 234, 0.25)",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ color: "#c5cae9", fontWeight: 600, marginBottom: "0.25rem" }}>
              In immediate danger? Call now
            </div>
            <div style={{ color: "#7986cb", fontSize: "0.85rem" }}>
              Vandrevala Foundation — free, 24/7, confidential
            </div>
          </div>
          <a
            href="tel:18602662345"
            style={{
              padding: "0.875rem 1.75rem",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "1.05rem",
              whiteSpace: "nowrap",
            }}
          >
            📞 1860-2662-345
          </a>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            background: "rgba(255,255,255,0.03)",
            padding: "0.4rem",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "0.75rem 0.5rem",
                borderRadius: "12px",
                border: "none",
                background:
                  activeTab === tab.id
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "transparent",
                color: activeTab === tab.id ? "white" : "#7986cb",
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab description */}
        <p
          style={{
            color: "#5c6bc0",
            fontSize: "0.85rem",
            marginBottom: "1.25rem",
            textAlign: "center",
          }}
        >
          {activeTabConfig.desc}
        </p>

        {/* Resource cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: "3rem",
            padding: "1.25rem",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#5c6bc0", fontSize: "0.82rem", lineHeight: 1.65, margin: 0 }}>
            If you are in immediate physical danger, please call{" "}
            <strong style={{ color: "#9fa8da" }}>112</strong> (India emergency)
            immediately. Soul Sync is a supportive tool, not a substitute for
            professional mental health care.
          </p>
        </div>
      </div>
    </div>
  );
}
