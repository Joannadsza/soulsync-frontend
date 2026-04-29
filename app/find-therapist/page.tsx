"use client";

/**
 * Therapist Finder page
 * ─────────────────────
 * Embeds two discovery options:
 *   1. iCall directory (TISS Mumbai) — direct iframe embed + fallback link
 *   2. Practo filtered mental-health search — opens in new tab
 *
 * No API key or backend needed.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ExternalLink,
  Phone,
  MapPin,
  Heart,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

// ─── Static therapist directory from iCall (subset for offline fallback) ─────
// In production, you'd call the iCall API; for now we use a curated list.
const ICALL_THERAPISTS = [
  {
    name: "iCall Counselling Service",
    location: "Mumbai (Pan-India)",
    type: "Online & In-person",
    phone: "9152987821",
    specialty: "Anxiety, Depression, Trauma, Grief",
    link: "https://icallhelpline.org",
    fee: "Sliding scale / Free",
  },
  {
    name: "Vandrevala Foundation",
    location: "Pan-India",
    type: "Online",
    phone: "1860-2662-345",
    specialty: "Mental health crisis, Suicide prevention",
    link: "https://www.vandrevalafoundation.com",
    fee: "Free",
  },
  {
    name: "NIMHANS Helpline",
    location: "Bengaluru / Nationwide",
    type: "Phone",
    phone: "080-46110007",
    specialty: "Severe mental illness, Psychiatry",
    link: "https://nimhans.ac.in",
    fee: "Free",
  },
  {
    name: "The MINDS Foundation",
    location: "Rural India focus",
    type: "Online",
    phone: "N/A",
    specialty: "Community mental health, rural outreach",
    link: "https://mindsfoundation.org",
    fee: "Low-cost",
  },
];

// ─── Practo city slugs ────────────────────────────────────────────────────────
const CITIES = [
  { label: "Mumbai", slug: "mumbai" },
  { label: "Delhi", slug: "delhi" },
  { label: "Bengaluru", slug: "bangalore" },
  { label: "Hyderabad", slug: "hyderabad" },
  { label: "Chennai", slug: "chennai" },
  { label: "Pune", slug: "pune" },
  { label: "Kolkata", slug: "kolkata" },
  { label: "Ahmedabad", slug: "ahmedabad" },
];

function practoUrl(city: string) {
  return `https://www.practo.com/${city}/psychiatrist?specialization=psychiatry&page=1`;
}

export default function TherapistFinderPage() {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("mumbai");

  const filtered = ICALL_THERAPISTS.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase()) ||
      t.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-24 pb-10 space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Find a Therapist</h1>
          <p className="text-muted-foreground max-w-2xl">
            SoulSync connects you with qualified mental health professionals
            across India. Browse the curated iCall directory, or search
            Practo for therapists in your city.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, city, or specialty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* iCall directory */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-semibold">
              iCall & National Helplines
            </h2>
            <a
              href="https://icallhelpline.org"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              Full directory <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((t) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="border-primary/10 hover:border-primary/30 transition-colors h-full">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-snug">{t.name}</h3>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full shrink-0",
                          t.fee === "Free"
                            ? "bg-green-500/10 text-green-600"
                            : t.fee === "Sliding scale / Free"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {t.fee}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {t.location} · {t.type}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {t.specialty}
                    </p>

                    <div className="flex gap-2 pt-1">
                      {t.phone !== "N/A" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => window.open(`tel:${t.phone}`)}
                        >
                          <Phone className="w-3 h-3" />
                          {t.phone}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5 text-xs"
                        onClick={() =>
                          window.open(t.link, "_blank", "noopener")
                        }
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Practo integration */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">
              Find a Psychiatrist on Practo
            </h2>
          </div>

          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-base">Search by city</CardTitle>
              <CardDescription>
                Select your city to open a filtered list of mental health
                professionals on Practo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <Button
                    key={c.slug}
                    size="sm"
                    variant={selectedCity === c.slug ? "default" : "outline"}
                    onClick={() => setSelectedCity(c.slug)}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>

              <Button
                className="gap-2"
                onClick={() =>
                  window.open(practoUrl(selectedCity), "_blank", "noopener")
                }
              >
                Open Practo for{" "}
                {CITIES.find((c) => c.slug === selectedCity)?.label}
                <ArrowRight className="w-4 h-4" />
              </Button>

              <p className="text-xs text-muted-foreground">
                You'll be taken to Practo's website where you can filter by
                availability, language, consultation type, and fee range.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Disclaimer */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Disclaimer:</strong> SoulSync
              is an AI-powered wellness companion and is not a substitute for
              professional medical or psychiatric care. If you are in crisis,
              please call iCall at{" "}
              <a href="tel:9152987821" className="text-primary underline">
                9152987821
              </a>{" "}
              or the Vandrevala Foundation at{" "}
              <a href="tel:18602662345" className="text-primary underline">
                1860-2662-345
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
