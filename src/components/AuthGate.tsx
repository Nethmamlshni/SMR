"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGate({ role, children }: { role: "admin" | "supervisor"; children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/");
        return;
      }
      const data = await res.json();
      if (data.user?.role !== role) {
        router.push(data.user?.role === "admin" ? "/admin" : "/supervisor");
        return;
      }
      setReady(true);
    }
    check();
  }, [role, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-coconut-milk text-coconut-bark">
        <div className="rounded-[2rem] bg-white/80 p-8 shadow-premium">Loading secure workspace...</div>
      </div>
    );
  }
  return <>{children}</>;
}
