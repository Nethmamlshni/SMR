import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { calculateFinalWeight, getDeduction } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import Section from "@/models/Section";
import FillingRecord from "@/models/FillingRecord";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, ["admin", "supervisor"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const sectionId = searchParams.get("sectionId");
  const fillingType = searchParams.get("fillingType");

  const query: any = {};
  if (date) query.date = date;
  if (sectionId) query.sectionId = sectionId;
  if (fillingType) query.fillingType = fillingType;

  await connectDB();
  const records = await FillingRecord.find(query).sort({ date: -1, sectionName: 1, cageNumber: 1 }).lean();
  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireAuth(request, ["supervisor", "admin"]);
  if (error) return error;

  const body = await request.json();
const {
  date,
  sectionId,
  fillingType,
  supervisorName,
  shift,
  records,
} = body;
  if (!date || !sectionId || !fillingType || !Array.isArray(records) || !records.length) {
    return NextResponse.json({ message: "Date, section, filling type and records are required." }, { status: 400 });
  }

  await connectDB();
  const section = await Section.findById(sectionId);
  if (!section) return NextResponse.json({ message: "Section not found." }, { status: 404 });

  const docs = records.map((item: any) => {
    const coconutType = item.coconutType as "Small" | "Red" | "Black";
    const selectedCages = Array.isArray(item.selectedCages) ? item.selectedCages.map(Number) : [];
    const rawWeight = Number(item.rawWeight || 0);
    const cageButtonsCount = Number(item.cageButtonsCount || section.cageButtonsCount || 24);
    return {
      date,
      sectionId: section._id,
      sectionName: section.name,
      fillingType,
      cageNumber: Number(item.cageNumber),
      selectedCages,
      cageButtonsCount,
      rawWeight,
      coconutType,
      deduction: getDeduction(coconutType),
      finalWeight: calculateFinalWeight(rawWeight, coconutType),
      coconutCount: selectedCages.length * 50,
      createdBy: session!.id,
      createdByName: session!.name,
      supervisorName,
      shift,
      cageName: item.cageName,
      anotherCageName: item.anotherCageName
    };
  });

  const operations = docs.map((doc: any) => ({
    updateOne: {
      filter: { date: doc.date, sectionId: doc.sectionId, fillingType: doc.fillingType, cageNumber: doc.cageNumber },
      update: { $set: doc },
      upsert: true
    }
  }));

  await FillingRecord.bulkWrite(operations);
  return NextResponse.json({ ok: true, saved: docs.length });
}
