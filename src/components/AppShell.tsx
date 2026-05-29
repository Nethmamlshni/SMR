"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Factory } from "lucide-react";

export default function AppShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-coconut-milk bg-woodgrain text-coconut-bark">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-12 h-96 w-96 rounded-full bg-coconut-leaf/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[34rem] w-[34rem] rounded-full bg-coconut-gold/15 blur-3xl" />
      </div>
      <header className="sticky top-0 z-30 border-b border-white/55 bg-coconut-milk/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/Screenshot_2026-05-29_at_11.10.23-removebg-preview.png" alt="Logo" className="h-10 w-30 " />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-coconut-leaf">SMR Consolidated</p>
              <p className="text-xs text-coconut-bark/55">Production Management System</p>
            </div>
          </Link>
          <Button variant="outline" onClick={logout}>
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </header>
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 rounded-[2rem] border border-white/60 bg-white/60 p-6 shadow-soft backdrop-blur-xl md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-coconut-bark md:text-5xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-coconut-bark/65">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-coconut-bark px-5 py-3 text-sm font-semibold text-coconut-cream shadow-premium">
            Natural • Premium • Factory Grade
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
