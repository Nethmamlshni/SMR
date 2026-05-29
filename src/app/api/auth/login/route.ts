import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { setAuthCookie, signToken, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ username: String(username).toLowerCase(), active: true });
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const payload = {
      id: String(user._id),
      name: user.name,
      username: user.username,
      role: user.role
    };
    const token = signToken(payload);
    const response = NextResponse.json({ user: payload });
    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Login failed." }, { status: 500 });
  }
}
