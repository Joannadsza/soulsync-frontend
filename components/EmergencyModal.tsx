"use client";

// ─────────────────────────────────────────────────────────────────────────────
// components/EmergencyModal.tsx
//
// Appears as a full-screen overlay when crisis is detected.
// Design: calm, warm, non-clinical. NOT alarming — reassuring.
// User must actively confirm they are okay to dismiss.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HOTLINES, ONLINE_PLATFORMS } from "@/lib/emergencyResources";

interface EmergencyModalProps {
  isOpen: boolean;
  severity: number;
  onDismiss: () => void; // called only after user explicitly confirms safety
}

export default function EmergencyModal({
  isOpen,
  severity,
  onDismiss,
}: EmergencyModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"initial" | "resources" | "confirm">(
    "initial"
  );
  const [confirmed, setConfirmed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setStep("initial");
      setConfirmed(false);
      // Prevent body scroll while modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  const handleConfirmSafe = () => {
    if (confirmed) {
      setMounted(false);
      onDismiss();
    }
  };

  const getSeverityMessage = () => {
    if (severity >= 9)
      return "It sounds like you're going through something really serious right now.";
    if (severity >= 7)
      return "It sounds like you're carrying a very heavy weight right now.";
    return "It sounds like things feel really hard for you right now.";
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ background: "rgba(10, 10, 20, 0.88)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Soft top glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "200px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #7c8cf8, transparent)",
          }}
        />

        <div className="p-8">
          {/* ── Step 1: Initial compassionate message ── */}
          {step === "initial" && (
            <div className="flex flex-col items-center text-center gap-6">
              {/* Pulse icon */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(124, 140, 248, 0.15)",
                  border: "2px solid rgba(124, 140, 248, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  animation: "pulse 2s ease-in-out infinite",
                }}
              >
                🫂
              </div>

              <div>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#e8eaf6",
                    marginBottom: "0.75rem",
                    lineHeight: 1.3,
                  }}
                >
                  You're not alone in this
                </h2>
                <p style={{ color: "#9fa8da", lineHeight: 1.7, fontSize: "0.95rem" }}>
                  {getSeverityMessage()} We want to make sure you have access
                  to real support — people who are trained to help, right now.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
                <button
                  onClick={() => setStep("resources")}
                  style={{
                    padding: "0.875rem 1.5rem",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    border: "none",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Show me emergency contacts
                </button>

                <button
                  onClick={() => router.push("/emergency")}
                  style={{
                    padding: "0.875rem 1.5rem",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.06)",
                    color: "#9fa8da",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                  }}
                >
                  Open full emergency resources page
                </button>

                <button
                  onClick={() => setStep("confirm")}
                  style={{
                    padding: "0.5rem",
                    background: "none",
                    border: "none",
                    color: "rgba(159,168,218,0.5)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  I'm safe — I don't need help right now
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Emergency contacts ── */}
          {step === "resources" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ color: "#e8eaf6", fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                  Reach out — they're ready to listen
                </h2>
                <p style={{ color: "#7986cb", fontSize: "0.85rem" }}>
                  All numbers below are free and confidential
                </p>
              </div>

              {/* Hotlines */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {HOTLINES.slice(0, 4).map((r) => (
                  <a
                    key={r.id}
                    href={`tel:${r.phone?.replace(/-/g, "")}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem 1.25rem",
                      borderRadius: "14px",
                      background: "rgba(124,140,248,0.08)",
                      border: "1px solid rgba(124,140,248,0.2)",
                      textDecoration: "none",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "rgba(124,140,248,0.15)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "rgba(124,140,248,0.08)")
                    }
                  >
                    <div>
                      <div style={{ color: "#c5cae9", fontWeight: 600, fontSize: "0.9rem" }}>
                        {r.name}
                      </div>
                      <div style={{ color: "#7986cb", fontSize: "0.78rem", marginTop: "2px" }}>
                        {r.available} · {r.language?.join(", ")}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1rem",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #667eea, #764ba2)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      📞 {r.phone}
                    </div>
                  </a>
                ))}
              </div>

              {/* Online platforms */}
              <div>
                <p style={{ color: "#7986cb", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                  Or chat with a therapist online
                </p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {ONLINE_PLATFORMS.slice(0, 3).map((r) => (
                    <a
                      key={r.id}
                      href={r.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "0.6rem 1rem",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#9fa8da",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                      }}
                    >
                      {r.name} ↗
                    </a>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => router.push("/emergency")}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#9fa8da",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  View all resources including hospitals →
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  style={{
                    padding: "0.5rem",
                    background: "none",
                    border: "none",
                    color: "rgba(159,168,218,0.4)",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  I'm okay, continue to chat
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Safety confirmation ── */}
          {step === "confirm" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>💙</div>
              <div>
                <h2 style={{ color: "#e8eaf6", fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                  Before you go back
                </h2>
                <p style={{ color: "#9fa8da", fontSize: "0.9rem", lineHeight: 1.7 }}>
                  Please confirm you're safe and not in immediate danger. If
                  things feel overwhelming, you can always call or chat with
                  someone from the list above.
                </p>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "1rem 1.25rem",
                  borderRadius: "14px",
                  background: confirmed ? "rgba(100,200,150,0.1)" : "rgba(255,255,255,0.05)",
                  border: confirmed
                    ? "1px solid rgba(100,200,150,0.4)"
                    : "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  width: "100%",
                }}
              >
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#667eea" }}
                />
                <span style={{ color: "#c5cae9", fontSize: "0.9rem" }}>
                  I am safe right now and not in immediate danger
                </span>
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
                <button
                  onClick={handleConfirmSafe}
                  disabled={!confirmed}
                  style={{
                    padding: "0.875rem",
                    borderRadius: "14px",
                    background: confirmed
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "rgba(255,255,255,0.05)",
                    color: confirmed ? "white" : "rgba(255,255,255,0.3)",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    border: "none",
                    cursor: confirmed ? "pointer" : "not-allowed",
                    transition: "all 0.3s",
                  }}
                >
                  Continue to chat
                </button>

                <button
                  onClick={() => setStep("resources")}
                  style={{
                    padding: "0.5rem",
                    background: "none",
                    border: "none",
                    color: "rgba(159,168,218,0.5)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  ← Back to emergency contacts
                </button>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(124, 140, 248, 0.4); }
            50% { box-shadow: 0 0 0 16px rgba(124, 140, 248, 0); }
          }
        `}</style>
      </div>
    </div>
  );
}
