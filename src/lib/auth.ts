import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export type UserRole = "admin" | "supervisor";
export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
};

const COOKIE_NAME = "cfs_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing. Add it to .env.local.");
  return secret;
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });
}

export function readToken(token?: string): SessionUser | null {
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = readToken(token);
  if (!session) return null;

  await connectDB();
  const user = await User.findById(session.id).lean();
  if (!user || !user.active) return null;
  return session;
}

export async function requireAuth(request: NextRequest, roles?: UserRole[]) {
  const session = await getSession(request);
  if (!session) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }), session: null };
  }

  if (roles?.length && !roles.includes(session.role)) {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}
