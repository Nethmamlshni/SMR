"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Plus, RefreshCcw, Settings2, Weight, Leaf, ClipboardList, Layers3 } from "lucide-react";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

type DashboardData = {
  date: string;
  totals: { rawWeight: number; finalWeight: number; coconutCount: number; records: number; nextDay: number; additional: number };
  bySection: { name: string; rawWeight: number; finalWeight: number; coconutCount: number }[];
  daily: { _id: string; finalWeight: number; coconutCount: number; records: number }[];
  records: any[];
};

type Section = { _id: string; name: string; cagesCount: number; cageButtonsCount: number; active: boolean };


export default function AdminPage() {
  return (
    <AuthGate role="admin">
      <AdminDashboard />
    </AuthGate>
  );
}

function AdminDashboard() {
  const [date, setDate] = useState(formatDate());
  const [data, setData] = useState<DashboardData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [newSection, setNewSection] = useState("Section 3");
  const [newCages, setNewCages] = useState(15);
  const [newButtons, setNewButtons] = useState(24);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const [dash, config] = await Promise.all([
      fetch(`/api/admin/dashboard?date=${date}`).then((r) => r.json()),
      fetch("/api/admin/sections").then((r) => r.json())
    ]);
    setData(dash);
    setSections(config.sections || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [date]);

  async function addSection() {
    await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSection, cagesCount: newCages, cageButtonsCount: newButtons })
    });
    setNewSection("");
    load();
  }

  async function updateSection(section: Section, patch: Partial<Section>) {
    await fetch(`/api/admin/sections/${section._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    load();
  }

  const cards = useMemo(() => {
    const totals = data?.totals || { rawWeight: 0, finalWeight: 0, coconutCount: 0, records: 0, nextDay: 0, additional: 0 };
    return [
      { label: "Final Weight", value: `${totals.finalWeight.toLocaleString()} kg`, icon: Weight },
      { label: "Raw Weight", value: `${totals.rawWeight.toLocaleString()} kg`, icon: Layers3 },
      { label: "Coconut Count", value: totals.coconutCount.toLocaleString(), icon: Leaf },
      { label: "Filling Records", value: totals.records.toLocaleString(), icon: ClipboardList }
    ];
  }, [data]);

  return (
    <AppShell title="Admin Dashboard" subtitle="Production analytics, daily summaries, full filling records, additional filling reports, Excel exports and factory configuration controls.">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-soft backdrop-blur-xl">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-coconut-leaf">Select production date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button variant="outline" onClick={load} className="self-end" disabled={loading}><RefreshCcw size={16} /> Refresh</Button>
        <a
  href={`/api/reports/excel?date=${date}`}
  className="self-end"
>
  <Button variant="primary" className="w-full">
    <Download size={16} /> Download Excel
  </Button>
</a>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item, index) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="overflow-hidden">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-coconut-cream text-coconut-leaf">
                <item.icon size={22} />
              </div>
              <p className="text-sm font-bold text-coconut-bark/55">{item.label}</p>
              <h2 className="mt-2 text-3xl font-black text-coconut-bark">{item.value}</h2>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardTitle>Day-by-day Production Summary</CardTitle>
          <CardDescription>Last 14 saved production days based on final weight.</CardDescription>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.daily || []}>
                <defs>
                  <linearGradient id="weight" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#1F6B45" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1F6B45" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D7B8" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="finalWeight" stroke="#1F6B45" fill="url(#weight)" strokeWidth={3} name="Final Weight" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Section Analytics</CardTitle>
          <CardDescription>Weight split by Section 1, Section 2 and newly added sections.</CardDescription>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.bySection || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D7B8" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="finalWeight" fill="#8B5A2B" radius={[12, 12, 0, 0]} name="Final Weight" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <Settings2 className="text-coconut-leaf" />
            <div>
              <CardTitle>Admin Factory Setup</CardTitle>
              <CardDescription>Add sections, increase cage count and increase cage-button count.</CardDescription>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_.45fr_.45fr_auto]">
            <Input placeholder="New section name" value={newSection} onChange={(e) => setNewSection(e.target.value)} />
            <Input type="number" min={1} value={newCages} onChange={(e) => setNewCages(Number(e.target.value))} />
            <Input type="number" min={1} value={newButtons} onChange={(e) => setNewButtons(Number(e.target.value))} />
            <Button onClick={addSection}><Plus size={16} /> Add</Button>
          </div>
          <div className="mt-5 space-y-3">
            {sections.map((section) => (
              <div key={section._id} className="grid gap-3 rounded-3xl border border-coconut-brown/10 bg-coconut-milk/80 p-4 md:grid-cols-[1fr_.35fr_.35fr_auto] md:items-center">
                <div>
                  <p className="font-black">{section.name}</p>
                  <p className="text-xs text-coconut-bark/55">{section.active ? "Active" : "Inactive"}</p>
                </div>
                <Input type="number" min={1} defaultValue={section.cagesCount} onBlur={(e) => updateSection(section, { cagesCount: Number(e.target.value) })} />
                <Input type="number" min={1} defaultValue={section.cageButtonsCount} onBlur={(e) => updateSection(section, { cageButtonsCount: Number(e.target.value) })} />
                <Button variant="outline" onClick={() => updateSection(section, { active: !section.active })}>{section.active ? "Disable" : "Enable"}</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Production Records for {date}</CardTitle>
          <CardDescription>Full filling and additional filling details remain exportable by date.</CardDescription>
          <div className="cage-grid-scroll mt-5 max-h-[34rem] overflow-auto rounded-3xl border border-coconut-brown/10">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="sticky top-0 bg-coconut-bark text-coconut-cream">
                <tr>
                  {['Section', 'Type', 'Cage', 'Raw kg', 'Deduction', 'Final kg', 'Count'].map((h) => <th key={h} className="px-4 py-3 font-black">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(data?.records || []).map((record: any) => (
                  <tr key={record._id} className="border-b border-coconut-brown/10 bg-white/60">
                    <td className="px-4 py-3 font-semibold">{record.sectionName}</td>
                    <td className="px-4 py-3">{record.fillingType === "next-day" ? "Next Day" : "Additional"}</td>
                    <td className="px-4 py-3">{record.cageNumber}</td>
                    <td className="px-4 py-3">{record.rawWeight}</td>
                    <td className="px-4 py-3">{record.deduction}</td>
                    <td className="px-4 py-3 font-black text-coconut-leaf">{record.finalWeight}</td>
                    <td className="px-4 py-3">{record.coconutCount}</td>
                  </tr>

                ))}
                {!data?.records?.length && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-coconut-bark/55">No records saved for this date yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
