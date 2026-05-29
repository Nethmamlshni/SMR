import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Section from "@/models/Section";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;
  await connectDB();
  const sections = await Section.find({}).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ sections });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  const body = await request.json();
  const name = String(body.name || "").trim();
  const cagesCount = Number(body.cagesCount || 15);
  const cageButtonsCount = Number(body.cageButtonsCount || 24);
  if (!name) return NextResponse.json({ message: "Section name is required." }, { status: 400 });

  await connectDB();
  const slugBase = slugify(name);
  let slug = slugBase;
  let index = 2;
  while (await Section.findOne({ slug })) {
    slug = `${slugBase}-${index++}`;
  }

  const section = await Section.create({ name, slug, cagesCount, cageButtonsCount, active: true });
  return NextResponse.json({ section }, { status: 201 });
}
