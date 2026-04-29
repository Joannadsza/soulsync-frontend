"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createChatSession } from "@/lib/api/chat";
import { Loader2 } from "lucide-react";

export default function TherapyIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const sessionId = await createChatSession();
        router.replace(`/therapy/${sessionId}`);
      } catch {
        router.replace("/dashboard");
      }
    };
    init();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}