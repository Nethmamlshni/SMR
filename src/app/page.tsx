"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Factory, Leaf, Lock, UserRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.message || "Login failed");
      return;
    }
    router.push(data.user.role === "admin" ? "/admin" : "/supervisor");
  }

  return (
    <main className="coconut-industrial-bg relative min-h-screen overflow-hidden px-5 py-8 text-white">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute left-8 top-8 h-64 w-64 rounded-full border border-coconut-cream/20" />
        <div className="absolute -right-20 bottom-8 h-96 w-96 rounded-full border-[50px] border-coconut-cream/10" />
        <div className="absolute bottom-0 left-0 h-48 w-full bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-xl">
            <Leaf size={16} className="text-coconut-cream" /> Premium coconut production workspace
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Coconut Counting <span className="text-coconut-cream">Management</span> System
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
            Manage CNO filling operations, production weights, cage-wise records, day-by-day analytics, Excel reports, and secure role-based factory access in one installable PWA dashboard.
          </p>
          <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
            {["Admin Analytics", "Supervisor Filling", "Excel Reports"].map((item) => (
              <div key={item} className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 text-sm font-semibold backdrop-blur-xl">
                <ShieldCheck className="mb-3 text-coconut-cream" size={20} /> {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="rounded-[2.5rem] border border-white/25 bg-coconut-milk/90 p-7 text-coconut-bark shadow-premium backdrop-blur-2xl"
        >
          <div className="mb-7 flex items-center gap-4">
            <div>
             <img src="/Screenshot_2026-05-29_at_11.10.23-removebg-preview.png" alt="Logo" className="h-10 w-30 " />
            </div>
            <div>
              <h2 className="text-2xl font-black">SMR Consolidated</h2>
              <p className="text-sm text-coconut-bark/60"> Coconut Counting Management</p>
            </div>
          </div>
          <label className="mb-2 block text-sm font-bold">Username</label>
          <div className="relative mb-5">
            <UserRound className="absolute left-4 top-3.5 text-coconut-bark/45" size={18} />
            <Input className="pl-12" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </div>
          <label className="mb-2 block text-sm font-bold">Password</label>
          <div className="relative mb-6">
            <Lock className="absolute left-4 top-3.5 text-coconut-bark/45" size={18} />
            <Input className="pl-12" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          </div>
          {error && <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
          <Button size="lg" className="w-full" disabled={loading}>
            {loading ? "Checking credentials..." : "Login to System"}
          </Button>
        </motion.form>
      </section>
    </main>
  );
}
