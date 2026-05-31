import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import FillingRecord from "@/models/FillingRecord";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);

  const date =
    searchParams.get("date") ||
    new Date().toISOString().slice(0, 10);

  await connectDB();

  const records = await FillingRecord.find({ date }).lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Production Report");

  // =============================
  // HELPERS
  // =============================

  function groupCages(data: any[]) {
    const map = new Map();

    data.forEach((r) => {
      const key = `${r.sectionName}-${r.cageNumber}`;

      if (!map.has(key)) {
        map.set(key, {
          ...r,
          rawWeight: 0,
          finalWeight: 0,
          coconutCount: 0,
        });
      }

      const item = map.get(key);

      item.rawWeight += Number(r.rawWeight || 0);
      item.finalWeight += Number(r.finalWeight || 0);
      item.coconutCount += Number(r.coconutCount || 0);
    });

    return Array.from(map.values());
  }

  function styleHeader(row: any) {
    row.eachCell((cell: any) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  function styleRow(row: any) {
    row.eachCell((cell: any) => {
      cell.alignment = { horizontal: "center" };
    });
  }

  // =============================
  // HEADER
  // =============================

  sheet.addRow(["SMR PRODUCTION REPORT"]);
  sheet.addRow([`DATE: ${date}`]);
  sheet.addRow([]);

  // =============================
  // FILTERS
  // =============================

  const sections = ["Section 01", "Section 02"];

  const dayRecords = groupCages(
    records.filter(
      (r: any) =>
        r.shift === "Day" &&
        sections.includes(r.sectionName)
    )
  );

  const nightRecords = groupCages(
    records.filter(
      (r: any) =>
        r.shift === "Night" &&
        sections.includes(r.sectionName)
    )
  );

  // =============================
  // TABLE 1 - DAY SHIFT
  // =============================

  sheet.addRow(["TABLE 1 - DAY SHIFT"]);
  sheet.addRow([
    "Section",
    "Cage",
    "Cage Name",
    "Raw",
    "Final",
    "Coconut",
  ]);

  styleHeader(sheet.lastRow);

  dayRecords.forEach((r) => {
    const row = sheet.addRow([
      r.sectionName,
      r.cageNumber,
      r.cageName || "-",
      r.rawWeight,
      r.finalWeight,
      r.coconutCount,
    ]);
    styleRow(row);
  });

  sheet.addRow([]);

  // =============================
  // TABLE 2 - NIGHT SHIFT
  // =============================

  sheet.addRow(["TABLE 2 - NIGHT SHIFT"]);
  sheet.addRow([
    "Section",
    "Cage",
    "Cage Name",
    "Raw",
    "Final",
    "Coconut",
  ]);

  styleHeader(sheet.lastRow);

  nightRecords.forEach((r) => {
    const row = sheet.addRow([
      r.sectionName,
      r.cageNumber,
      r.cageName || "-",
      r.rawWeight,
      r.finalWeight,
      r.coconutCount,
    ]);
    styleRow(row);
  });

  sheet.addRow([]);

  // =============================
  // TABLE 3 - ANOTHER NAME SUMMARY
  // =============================

  sheet.addRow(["TABLE 3 - ANOTHER NAME SUMMARY"]);

  const anotherMap = new Map();

  records.forEach((r: any) => {
    const key = r.anotherCageName || "-";

    if (!anotherMap.has(key)) {
      anotherMap.set(key, {
        name: key,
        cages: new Set(),
        total: 0,
      });
    }

    const item = anotherMap.get(key);

    item.cages.add(r.cageName);
    item.total += Number(r.coconutCount || 0);
  });

  sheet.addRow([
    "Another Name",
    "Cage Names",
    "Cage Count",
    "Total Coconut",
  ]);

  styleHeader(sheet.lastRow);

  Array.from(anotherMap.values()).forEach((i: any) => {
    const row = sheet.addRow([
      i.name,
      Array.from(i.cages).join(", "),
      i.cages.size,
      i.total,
    ]);
    styleRow(row);
  });

  sheet.addRow([]);

  // =============================
  // TABLE 4 - CAGE SUMMARY
  // =============================

  sheet.addRow(["TABLE 4 - CAGE SUMMARY"]);

  const cageMap = new Map();

  records.forEach((r: any) => {
    const key = r.cageName || "-";

    if (!cageMap.has(key)) {
      cageMap.set(key, {
        name: key,
        cages: new Set(),
        total: 0,
      });
    }

    const item = cageMap.get(key);

    item.cages.add(r.cageNumber);
    item.total += Number(r.coconutCount || 0);
  });

  sheet.addRow([
    "Cage Name",
    "Cage Numbers",
    "Total Coconut",
  ]);

  styleHeader(sheet.lastRow);

  Array.from(cageMap.values()).forEach((i: any) => {
    const row = sheet.addRow([
      i.name,
      Array.from(i.cages).join(", "),
      i.total,
    ]);
    styleRow(row);
  });

  // =============================
  // EXPORT
  // =============================

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="production-${date}.xlsx"`,
    },
  });
}