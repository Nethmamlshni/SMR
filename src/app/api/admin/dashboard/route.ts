import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import FillingRecord from "@/models/FillingRecord";
import Section from "@/models/Section";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  await connectDB();
  const records = await FillingRecord.find({ date }).sort({ sectionName: 1, fillingType: 1, cageNumber: 1 }).lean();
  const sections = await Section.find({ active: true }).lean();

  const totals = records.reduce(
    (acc, r: any) => {
      acc.rawWeight += r.rawWeight || 0;
      acc.finalWeight += r.finalWeight || 0;
      acc.coconutCount += r.coconutCount || 0;
      acc.records += 1;
      if (r.fillingType === "next-day") acc.nextDay += 1;
      if (r.fillingType === "additional") acc.additional += 1;
      return acc;
    },
    { rawWeight: 0, finalWeight: 0, coconutCount: 0, records: 0, nextDay: 0, additional: 0 }
  );

  const bySection = sections.map((section: any) => {
    const sectionRecords = records.filter((r: any) => String(r.sectionId) === String(section._id));
    return {
      name: section.name,
      rawWeight: sectionRecords.reduce((s: number, r: any) => s + Number(r.rawWeight || 0), 0),
      finalWeight: sectionRecords.reduce((s: number, r: any) => s + Number(r.finalWeight || 0), 0),
      coconutCount: sectionRecords.reduce((s: number, r: any) => s + Number(r.coconutCount || 0), 0)
    };
  });

  const dayRange = await FillingRecord.aggregate([
    { $sort: { date: -1 } },
    { $group: { _id: "$date", finalWeight: { $sum: "$finalWeight" }, coconutCount: { $sum: "$coconutCount" }, records: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $limit: 14 }
  ]);

  return NextResponse.json({ date, totals, bySection, daily: dayRange.reverse(), records });
}
