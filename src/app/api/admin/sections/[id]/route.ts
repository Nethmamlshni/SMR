import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Section from "@/models/Section";

export async function PATCH(request: NextRequest, context: any) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();
  await connectDB();

  const section = await Section.findByIdAndUpdate(
    id,
    {
      ...(body.name ? { name: String(body.name).trim() } : {}),
      ...(body.cagesCount ? { cagesCount: Math.max(1, Number(body.cagesCount)) } : {}),
      ...(body.cageButtonsCount ? { cageButtonsCount: Math.max(1, Number(body.cageButtonsCount)) } : {}),
      ...(typeof body.active === "boolean" ? { active: body.active } : {})
    },
    { new: true }
  );

  if (!section) return NextResponse.json({ message: "Section not found." }, { status: 404 });
  return NextResponse.json({ section });
}

export async function DELETE(request: NextRequest, context: any) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  const { id } = await context.params;
  await connectDB();
  await Section.findByIdAndUpdate(id, { active: false });
  return NextResponse.json({ ok: true });
}
