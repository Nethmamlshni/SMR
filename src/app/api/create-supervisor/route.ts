import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const existingUser = await User.findOne({
      username: "supervisor",
    });

    if (existingUser) {
      return NextResponse.json({
        message: "Supervisor already exists",
      });
    }

    const passwordHash = await bcrypt.hash(
      "super123",
      10
    );

    const supervisor = await User.create({
      name: "Supervisor",
      username: "supervisor",
      passwordHash,
      role: "supervisor",
      active: true,
    });

    return NextResponse.json({
      message: "Supervisor created successfully",
      supervisor,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}