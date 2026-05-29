"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Droplets, Factory } from "lucide-react";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function SupervisorPage() {
  return (
    <AuthGate role="supervisor">
      <SupervisorHome />
    </AuthGate>
  );
}

function SupervisorHome() {
  const router = useRouter();
  return (
    <AppShell title="Supervisor Section Selection" subtitle="Select the production line. VCO is reserved for future development. CNO contains Section 1, Section 2 and admin-created sections.">
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="min-h-[18rem] bg-white/74">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-coconut-cream text-coconut-brown">
              <Droplets size={28} />
            </div>
            <CardTitle>VCO</CardTitle>
            <CardDescription>Virgin Coconut Oil section.</CardDescription>
            <Button className="mt-8" variant="outline" onClick={() => alert("Ongoing section not created yet.")}>Open VCO <ArrowRight size={16} /></Button>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card className="min-h-[18rem] bg-coconut-bark text-coconut-cream">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-coconut-cream text-coconut-leaf">
              <Factory size={28} />
            </div>
            <h3 className="text-lg font-bold text-coconut-cream">CNO</h3>
            <p className="mt-2 text-sm leading-6 text-coconut-cream/70">Coconut Natural Oil filling workflow with cage-wise weight calculations.</p>
            <Button className="mt-8" onClick={() => router.push("/supervisor/cno")}>Open CNO <ArrowRight size={16} /></Button>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  );
}
