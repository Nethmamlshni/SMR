"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Layers3 } from "lucide-react";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type Section = { _id: string; name: string; cagesCount: number; cageButtonsCount: number };

export default function CNOPage() {
  return (
    <AuthGate role="supervisor">
      <CNOSections />
    </AuthGate>
  );
}

function CNOSections() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then((data) => setSections(data.sections || []));
  }, []);

  return (
    <AppShell title="CNO Production Sections" subtitle="Choose Section 1, Section 2 or any additional production section created by the Admin.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section, index) => (
          <motion.div key={section._id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="group overflow-hidden">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-coconut-cream text-coconut-leaf transition group-hover:scale-105">
                <Layers3 size={24} />
              </div>
              <CardTitle>{section.name}</CardTitle>
              <CardDescription>{section.cagesCount} cage sections • {section.cageButtonsCount} cage buttons per cage</CardDescription>
              <Button className="mt-7 w-full" onClick={() => router.push(`/supervisor/cno/${section._id}`)}>
                Select {section.name} <ChevronRight size={16} />
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </AppShell>
  );
}
