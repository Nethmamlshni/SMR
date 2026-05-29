import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import "dotenv/config";
import User from "../src/models/User";
import Section from "../src/models/Section";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI missing. Copy .env.example to .env.local and add your MongoDB Atlas connection string.");
  }

  await mongoose.connect(uri);

  const users = [
    { name: "Factory Admin", username: "admin", password: "admin123", role: "admin" },
    { name: "Factory Supervisor", username: "supervisor", password: "supervisor123", role: "supervisor" }
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await User.updateOne(
      { username: user.username },
      { $set: { name: user.name, username: user.username, passwordHash, role: user.role, active: true } },
      { upsert: true }
    );
  }

  const sections = [
    { name: "Section 1", slug: "section-1", cagesCount: 15, cageButtonsCount: 24, active: true },
    { name: "Section 2", slug: "section-2", cagesCount: 15, cageButtonsCount: 24, active: true }
  ];

  for (const section of sections) {
    await Section.updateOne({ slug: section.slug }, { $set: section }, { upsert: true });
  }

  console.log("Seed complete: admin/admin123 and supervisor/supervisor123 created with Section 1 and Section 2.");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
