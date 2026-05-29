"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Save,
  Scale,
  Sparkles,
  X,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import {
  calculateFinalWeight,
  formatDate,
  getDeduction,
} from "@/lib/utils";

type FillingMode = "next-day" | "additional";
type CoconutType = "Small" | "Red" | "Black";

type Section = {
  _id: string;
  name: string;
  cagesCount: number;
  cageButtonsCount: number;
};

type DraftRecord = {
  cageNumber: number;
  selectedCages: number[];
  rawWeight: number;
  coconutType: CoconutType;
  cageButtonsCount: number;
  cageName: string;
  anotherCageName: string;
};

export default function SectionWorkflowPage() {
  return (
    <AuthGate role="supervisor">
      <SectionWorkflow />
    </AuthGate>
  );
}

function SectionWorkflow() {
  const params = useParams<{ sectionId: string }>();
  const router = useRouter();

  const [section, setSection] = useState<Section | null>(null);
  const [mode, setMode] = useState<FillingMode | null>(null);

  const [date, setDate] = useState(formatDate());

  const [drafts, setDrafts] = useState<Record<number, DraftRecord>>({});
  const [activeCage, setActiveCage] = useState<number | null>(null);

  const [existing, setExisting] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);

  const [supervisorName, setSupervisorName] = useState(""); 
  const [shift, setShift] = useState<"Day" | "Night">("Day");

  // CONFIRM POPUP STATES
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const storageKey = useMemo(
    () => `cfs-draft-${params.sectionId}-${mode || "none"}`,
    [params.sectionId, mode]
  );

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.sections || []).find(
          (s: Section) => s._id === params.sectionId
        );

        setSection(found || null);
      });
  }, [params.sectionId]);

  useEffect(() => {
    if (!mode) return;

    const raw = localStorage.getItem(storageKey);

    setDrafts(raw ? JSON.parse(raw) : {});
  }, [mode, storageKey]);

  useEffect(() => {
    if (!mode || !section) return;

    localStorage.setItem(storageKey, JSON.stringify(drafts));
  }, [drafts, mode, section, storageKey]);

  useEffect(() => {
    if (!section || !mode) return;

    fetch(
      `/api/fillings?sectionId=${section._id}&fillingType=${mode}&date=${date}`
    )
      .then((r) => r.json())
      .then((data) => setExisting(data.records || []));
  }, [section, mode, date]);

  const cages = section
    ? Array.from({ length: section.cagesCount }, (_, i) => i + 1)
    : [];

  const completedCount = Object.keys(drafts).length;

  const requiredComplete =
    mode === "next-day"
      ? completedCount === cages.length
      : completedCount > 0;

  const totalFinal = Object.values(drafts).reduce(
    (sum, d) =>
      sum + calculateFinalWeight(d.rawWeight, d.coconutType),
    0
  );

  const totalCoconuts = Object.values(drafts).reduce(
    (sum, d) => sum + d.selectedCages.length * 50,
    0
  );

  function saveDraft(record: DraftRecord) {
    setDrafts((prev) => ({
      ...prev,
      [record.cageNumber]: record,
    }));

    setActiveCage(null);
  }

  // OPEN CONFIRM MODAL
  function openSubmitPopup() {
    setShowConfirmModal(true);
  }

  // FINAL SUBMIT
// REPLACE submitAll FUNCTION

async function submitAll() {
  if (!section || !mode || !supervisorName || !shift)
    return;

  try {
    setSaving(true);

    const res = await fetch("/api/fillings", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        date,
        sectionId: section._id,
        fillingType: mode,
        supervisorName,
        shift,
        records: Object.values(drafts),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      alert("Could not save data.");
      return;
    }

    localStorage.removeItem(storageKey);

    setDrafts({});

    setShowConfirmModal(false);

    setShowSuccessPopup(true);

    setTimeout(() => {
      router.refresh();

      window.location.href =
        "/supervisor/cno";
    }, 1800);
  } catch (error) {
    setSaving(false);

    alert("Something went wrong.");
  }
}

  return (
    <AppShell
      title={
        section
          ? `${section.name} Workflow`
          : "Section Workflow"
      }
      subtitle="Choose Next Day Filling or Additional Filling."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/supervisor/cno")}
        >
          <ArrowLeft size={16} />
          Back to Sections
        </Button>

        <div className="rounded-2xl bg-coconut-bark px-4 py-3 text-sm font-semibold text-coconut-cream">
          {section?.cagesCount || 0} cages •{" "}
          {section?.cageButtonsCount || 0} buttons
        </div>
      </div>

      {!mode && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-coconut-bark text-coconut-cream">
            <Sparkles className="mb-5 text-coconut-cream" />

            <h3 className="text-xl font-black text-coconut-cream">
              Next Day Filling
            </h3>

            <p className="mt-3 text-sm leading-6 text-coconut-cream/70">
              Complete all cages before submitting.
            </p>

            <Button
              className="mt-8"
              onClick={() => setMode("next-day")}
            >
              Start Next Day Filling
            </Button>
          </Card>

          <Card>
            <ClipboardCheck className="mb-5 text-coconut-leaf" />

            <CardTitle>Additional Filling</CardTitle>

            <CardDescription>
              Fill only required cages.
            </CardDescription>

            <Button
              className="mt-8"
              variant="secondary"
              onClick={() => setMode("additional")}
            >
              Start Additional Filling
            </Button>
          </Card>
        </div>
      )}

      {mode && section && (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div>
            <Card>
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>
                    {mode === "next-day"
                      ? "Next Day Filling"
                      : "Additional Filling"}
                  </CardTitle>

                  <CardDescription>
                    Select cage buttons and enter details.
                  </CardDescription>
                </div>

                <div className="w-full md:w-60">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-coconut-leaf">
                    Save Date
                  </label>

                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cages.map((cage) => {
                  const draft = drafts[cage];

                  return (
                    <button
                      key={cage}
                      onClick={() => setActiveCage(cage)}
                      className={`rounded-[1.7rem] border p-5 text-left transition hover:-translate-y-1 hover:shadow-soft ${
                        draft
                          ? "border-coconut-leaf bg-coconut-leaf text-white"
                          : "border-coconut-brown/12 bg-coconut-milk text-coconut-bark"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-black">
                          Cage{" "}
                          {String(cage).padStart(2, "0")}
                        </p>

                        {draft && (
                          <CheckCircle2 size={22} />
                        )}
                      </div>

                      <p
                        className={`mt-2 text-xs ${
                          draft
                            ? "text-white/75"
                            : "text-coconut-bark/55"
                        }`}
                      >
                        {draft
                          ? `${calculateFinalWeight(
                              draft.rawWeight,
                              draft.coconutType
                            )} kg final`
                          : "Click to enter details"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="sticky top-28">
              <CalendarCheck className="mb-4 text-coconut-leaf" />

              <CardTitle>Working Summary</CardTitle>

              <CardDescription>
                Review before submit.
              </CardDescription>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <SummaryBox
                  label="Completed"
                  value={`${completedCount}/${
                    mode === "next-day"
                      ? cages.length
                      : "Any"
                  }`}
                />

                <SummaryBox
                  label="Coconuts"
                  value={totalCoconuts.toLocaleString()}
                />

                <SummaryBox
                  label="Final kg"
                  value={totalFinal.toLocaleString()}
                />

                <SummaryBox label="Date" value={date} />
              </div>

              <div className="mt-5 space-y-2">
                {Object.values(drafts)
                  .sort(
                    (a, b) =>
                      a.cageNumber - b.cageNumber
                  )
                  .map((draft) => (
                    <div
                      key={draft.cageNumber}
                      className="rounded-2xl border border-coconut-brown/10 bg-white/70 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between font-black">
                        <span>
                          Cage{" "}
                          {String(
                            draft.cageNumber
                          ).padStart(2, "0")}
                        </span>

                        <span>
                          {calculateFinalWeight(
                            draft.rawWeight,
                            draft.coconutType
                          )}{" "}
                          kg
                        </span>
                      </div>

                      <p className="mt-1 text-coconut-bark/60">
                        {draft.coconutType} •{" "}
                        {draft.selectedCages.length *
                          50}{" "}
                        coconuts
                      </p>

                    </div>
                  ))}
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                className="mt-6 w-full"
                disabled={ saving}
                onClick={openSubmitPopup}
              >
                <Save size={16} />
                {saving
                  ? "Submitting..."
                  : "Submit & Refresh"}
              </Button>
            </Card>
          </aside>
        </div>
      )}

      {/* CAGE MODAL */}
      {activeCage && section && (
        <CageModal
          cageNumber={activeCage}
          buttonCount={section.cageButtonsCount}
          initial={drafts[activeCage]}
          onClose={() => setActiveCage(null)}
          onSave={saveDraft}
        />
      )}

{/* CONFIRM MODAL */}
<AnimatePresence>
  {showConfirmModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: 0.9,
        }}
        className="w-full max-w-2xl rounded-[2rem] bg-white p-7 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-500" />

              <h2 className="text-2xl font-black">
                Confirm Submission
              </h2>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Please verify all details
              before saving.
            </p>
          </div>

          <button
            onClick={() =>
              setShowConfirmModal(false)
            }
          >
            <X />
          </button>
        </div>

        {/* SUPERVISOR + SHIFT */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-coconut-leaf">
              Supervisor Name
            </label>

            <Input
              type="text"
              placeholder="Enter supervisor name"
              value={supervisorName}
              onChange={(e) =>
                setSupervisorName(
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-coconut-leaf">
              Shift
            </label>

            <Select
              value={shift}
              onChange={(e) =>
                setShift(
                  e.target
                    .value as
                    | "Day"
                    | "Night"
                )
              }
            >
              <option value="Day">
                Day Shift
              </option>

              <option value="Night">
                Night Shift
              </option>
            </Select>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-gray-100 p-4">
            <p>
              <strong>Section:</strong>{" "}
              {section?.name}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {date}
            </p>

            <p>
              <strong>Mode:</strong>{" "}
              {mode}
            </p>

            <p>
              <strong>
                Supervisor:
              </strong>{" "}
              {supervisorName ||
                "Not Entered"}
            </p>

            <p>
              <strong>Shift:</strong>{" "}
              {shift || "Not Selected"}
            </p>

            <p>
              <strong>
                Total Cages:
              </strong>{" "}
              {completedCount}
            </p>

            <p>
              <strong>
                Total Final Weight:
              </strong>{" "}
              {totalFinal} kg
            </p>

            <p>
              <strong>
                Total Coconuts:
              </strong>{" "}
              {totalCoconuts}
            </p>
          </div>

          {/* RECORD LIST */}
          <div className="max-h-64 overflow-auto rounded-2xl border p-4">
            {Object.values(drafts).map(
              (draft) => (
                <div
                  key={draft.cageNumber}
                  className="mb-3 rounded-xl bg-coconut-cream/50 p-3"
                >
                  <p className="font-black">
                    Cage{" "}
                    {String(
                      draft.cageNumber
                    ).padStart(2, "0")}
                  </p>
                  <p className="text-sm text-gray-600">
                    cagename:{" "}
                    {draft.cageName}
                  </p>

                  <p className="text-sm text-gray-600">
                    Raw:{" "}
                    {draft.rawWeight} kg
                  </p>

                  <p className="text-sm text-gray-600">
                    Final:{" "}
                    {calculateFinalWeight(
                      draft.rawWeight,
                      draft.coconutType
                    )}{" "}
                    kg
                  </p>

                  <p className="text-sm text-gray-600">
                    Type:{" "}
                    {
                      draft.coconutType
                    }
                  </p>

                  <p className="text-sm text-gray-600">
                    Buttons:{" "}
                    {draft.selectedCages.join(
                      ", "
                    )}
                  </p>

                </div>
              )
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              setShowConfirmModal(false)
            }
          >
            Cancel
          </Button>

          <Button
            className="w-full"
            onClick={submitAll}
            disabled={
              saving ||
              !supervisorName
            }
          >
            {saving
              ? "Saving..."
              : "Confirm & Save"}
          </Button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      {/* SUCCESS POPUP */}
      <AnimatePresence>
        {showSuccessPopup && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-[2rem] bg-white p-10 text-center shadow-2xl"
            >
              <CheckCircle2
                size={70}
                className="mx-auto text-green-500"
              />

              <h2 className="mt-5 text-3xl font-black">
                Saved Successfully
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Data saved and refreshing page...
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-coconut-cream/75 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-coconut-leaf">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-coconut-bark">
        {value}
      </p>
    </div>
  );
}

function CageModal({
  cageNumber,
  buttonCount,
  initial,
  onClose,
  onSave,
}: {
  cageNumber: number;
  buttonCount: number;
  initial?: DraftRecord;
  onClose: () => void;
  onSave: (record: DraftRecord) => void;
}) {
  const [selected, setSelected] = useState<number[]>(
    initial?.selectedCages || []
  );

  const [rawWeight, setRawWeight] = useState<number>(
    initial?.rawWeight || 0
  );

  const [coconutType, setCoconutType] =
    useState<CoconutType>(
      initial?.coconutType || "Red"
    );

  const [cageName, setCageName] = useState(
  initial?.cageName || ""
);

const [anotherCageName, setAnotherCageName] =
  useState(
    initial?.anotherCageName || ""
  );
  const allButtons = Array.from(
    { length: buttonCount },
    (_, i) => i + 1
  );

  const finalWeight = calculateFinalWeight(
    rawWeight,
    coconutType
  );

  function toggle(value: number) {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value].sort((a, b) => a - b)
    );
  }

  function save() {
    if (!rawWeight) return;

    onSave({
      cageNumber,
      selectedCages: selected,
      rawWeight,
      coconutType,
      cageButtonsCount: buttonCount,
      cageName,
      anotherCageName,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-coconut-bark/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-[2rem] bg-coconut-milk p-6 shadow-premium"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-coconut-bark">
              Cage {String(cageNumber).padStart(2, "0")}
            </h2>

            <p className="mt-2 text-sm text-coconut-bark/60">
              Enter cage details.
            </p>
          </div>

          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
          {allButtons.map((value) => (
            <button
              key={value}
              onClick={() => toggle(value)}
              className={`h-14 rounded-2xl text-sm font-black transition ${
                selected.includes(value)
                  ? "bg-coconut-leaf text-white"
                  : "bg-white text-coconut-bark"
              }`}
            >
              {String(value).padStart(2, "0")}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div>
  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-coconut-leaf">
    Cage Name
  </label>

  <Input
    type="text"
    placeholder="Enter cage name"
    value={cageName}
    onChange={(e) =>
      setCageName(e.target.value)
    }
  />
</div>

<div>
  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-coconut-leaf">
    Another Cage Name
  </label>

  <Input
    type="text"
    placeholder="Enter another cage name"
    value={anotherCageName}
    onChange={(e) =>
      setAnotherCageName(e.target.value)
    }
  />
</div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-coconut-leaf">
              Raw Weight
            </label>

            <Input
              type="number"
              min={0}
              value={rawWeight || ""}
              onChange={(e) =>
                setRawWeight(Number(e.target.value))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-coconut-leaf">
              Coconut Type
            </label>

            <Select
              value={coconutType}
              onChange={(e) =>
                setCoconutType(
                  e.target.value as CoconutType
                )
              }
            >
              <option value="Red">Red</option>
              <option value="Black">Black</option>
              <option value="Small">Small</option>
            </Select>
          </div>

          <div className="rounded-2xl bg-coconut-cream/80 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-coconut-leaf">
              Deduction
            </p>

            <p className="mt-2 text-2xl font-black">
              {getDeduction(coconutType)} kg
            </p>
          </div>

          <div className="rounded-2xl bg-coconut-bark p-4 text-coconut-cream">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em]">
              <Scale size={14} />
              Final
            </div>

            <p className="mt-2 text-2xl font-black">
              {finalWeight} kg
            </p>
          </div>
        </div>

        <Button
          className="mt-6 w-full"
          size="lg"
          disabled={!rawWeight}
          onClick={save}
        >
          Save Cage Draft
        </Button>
      </motion.div>
    </div>
  );
}