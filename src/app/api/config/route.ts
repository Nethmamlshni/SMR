import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Section from "@/models/Section";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, ["admin", "supervisor"]);
  if (error) return error;

  await connectDB();
  const sections = await Section.find({ active: true }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ sections });
}
