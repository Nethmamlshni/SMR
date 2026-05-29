import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function GET() {
  await connectDB();

  const hashed = await bcrypt.hash("admin123", 10);

  const user = await User.create({
    name: "Admin",
    username: "admin",
    passwordHash: hashed,
    role: "admin",
    active: true,
  });

  return Response.json(user);
}