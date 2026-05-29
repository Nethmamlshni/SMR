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

  const records = await FillingRecord.find({ date })
    .sort({
      shift: 1,
      sectionName: 1,
      fillingType: 1,
      cageNumber: 1,
    })
    .lean();

  // =========================================
  // WORKBOOK
  // =========================================

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Coconut Factory System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(
    "Production Report"
  );

  // =========================================
  // COLUMN WIDTHS
  // =========================================

  sheet.columns = [
    { key: "a", width: 18 },
    { key: "b", width: 18 },
    { key: "c", width: 22 },
    { key: "d", width: 14 },
    { key: "e", width: 28 },
    { key: "f", width: 16 },
    { key: "g", width: 14 },
    { key: "h", width: 16 },
    { key: "i", width: 18 },
  ];

  // =========================================
  // STYLES
  // =========================================

  const titleStyle = {
    font: {
      bold: true,
      size: 18,
      color: { argb: "FFFFFFFF" },
    },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FF2E7D32" },
    },
    alignment: {
      horizontal: "center" as const,
      vertical: "middle" as const,
    },
  };

  const headerStyle = {
    font: {
      bold: true,
      color: { argb: "FFFFFFFF" },
    },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FF4A2C1D" },
    },
    alignment: {
      horizontal: "center" as const,
      vertical: "middle" as const,
    },
  };

  const totalStyle = {
    font: {
      bold: true,
      color: { argb: "FFFFFFFF" },
    },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FF1B5E20" },
    },
    alignment: {
      horizontal: "center" as const,
      vertical: "middle" as const,
    },
  };

  // =========================================
  // HELPERS
  // =========================================

  function styleHeader(rowNumber: number) {
    const row = sheet.getRow(rowNumber);

    row.eachCell((cell) => {
      cell.font = headerStyle.font;

      cell.fill = headerStyle.fill;

      cell.alignment = headerStyle.alignment;

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  function styleDataRow(row: any) {
    row.eachCell((cell: any) => {
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  function styleTotalRow(row: any) {
    row.eachCell((cell: any) => {
      cell.font = totalStyle.font;

      cell.fill = totalStyle.fill;

      cell.alignment = totalStyle.alignment;

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  function getFillingType(type: string) {
    return type === "next-day"
      ? "Next Day Filling"
      : "Additional Filling";
  }

  // =========================================
  // DAY / NIGHT TABLE
  // =========================================

  function addMainTable(
    title: string,
    shift: string
  ) {
    const data = records.filter(
      (r: any) =>
        r.shift?.toLowerCase() ===
        shift.toLowerCase()
    );

    // TITLE
    const titleRow = sheet.addRow([title]);

    sheet.mergeCells(
      `A${titleRow.number}:I${titleRow.number}`
    );

    const titleCell = titleRow.getCell(1);

    titleCell.font = titleStyle.font;

    titleCell.fill = titleStyle.fill;

    titleCell.alignment =
      titleStyle.alignment;

    titleRow.height = 28;

    // SPACE
    sheet.addRow([]);

    // HEADERS
    const headerRow = sheet.addRow([
      "Date",
      "Section",
      "Filling Type",
      "Cage No",
      "Selected Buttons",
      "Raw Weight",
      "Type",
      "Final Weight",
      "Coconut Count",
    ]);

    styleHeader(headerRow.number);

    // DATA
    data.forEach((record: any) => {
      const row = sheet.addRow([
        record.date,
        record.sectionName,
        getFillingType(record.fillingType),
        record.cageNumber,
        (record.selectedCages || []).join(
          ", "
        ),
        record.rawWeight,
        record.coconutType,
        record.finalWeight,
        record.coconutCount,
      ]);

      styleDataRow(row);
    });

    // TOTALS
    const totalRawWeight = data.reduce(
      (sum: number, r: any) =>
        sum + Number(r.rawWeight || 0),
      0
    );

    const totalFinalWeight = data.reduce(
      (sum: number, r: any) =>
        sum + Number(r.finalWeight || 0),
      0
    );

    const totalCoconutCount = data.reduce(
      (sum: number, r: any) =>
        sum + Number(r.coconutCount || 0),
      0
    );

    const totalRow = sheet.addRow([
      "",
      "",
      "",
      "",
      "TOTAL",
      totalRawWeight,
      "",
      totalFinalWeight,
      totalCoconutCount,
    ]);

    styleTotalRow(totalRow);

    // SPACING
    sheet.addRow([]);
    sheet.addRow([]);
  }

  // =========================================
  // DAY TABLE
  // =========================================

  addMainTable(
    "DAY SHIFT PRODUCTION REPORT",
    "Day"
  );

  // =========================================
  // NIGHT TABLE
  // =========================================

  addMainTable(
    "NIGHT SHIFT PRODUCTION REPORT",
    "Night"
  );

  // =========================================
  // CAGE SUMMARY TABLE
  // =========================================

  const summaryTitleRow = sheet.addRow([
    "CAGE NAME SUMMARY",
  ]);

  sheet.mergeCells(
    `A${summaryTitleRow.number}:D${summaryTitleRow.number}`
  );

  const summaryTitleCell =
    summaryTitleRow.getCell(1);

  summaryTitleCell.font = titleStyle.font;

  summaryTitleCell.fill = titleStyle.fill;

  summaryTitleCell.alignment =
    titleStyle.alignment;

  summaryTitleRow.height = 28;

  sheet.addRow([]);

  // HEADERS
  const summaryHeader = sheet.addRow([
    "Another Cage Name",
    "Cage Names",
    "Total Coconut Count",
    "Total Records",
  ]);

  styleHeader(summaryHeader.number);

  // =========================================
  // GROUP DATA
  // =========================================

  const groupedMap = new Map();

  records.forEach((record: any) => {
    const anotherName =
      record.anotherCageName?.trim() || "-";

    const cageName =
      record.cageName?.trim() || "-";

    if (!groupedMap.has(anotherName)) {
      groupedMap.set(anotherName, {
        anotherCageName: anotherName,
        cageNames: new Set(),
        coconutCount: 0,
        totalRecords: 0,
      });
    }

    const existing = groupedMap.get(
      anotherName
    );

    // UNIQUE CAGE NAMES
    existing.cageNames.add(cageName);

    existing.coconutCount += Number(
      record.coconutCount || 0
    );

    existing.totalRecords += 1;
  });

  // =========================================
  // ADD SUMMARY ROWS
  // =========================================

  Array.from(groupedMap.values()).forEach(
    (item: any) => {
      const row = sheet.addRow([
        item.anotherCageName,

        Array.from(item.cageNames).join(
          ", "
        ),

        item.coconutCount,

        item.totalRecords,
      ]);

      styleDataRow(row);
    }
  );

  // =========================================
  // GRAND TOTAL
  // =========================================

  const grandTotal = Array.from(
    groupedMap.values()
  ).reduce(
    (sum: number, item: any) =>
      sum + item.coconutCount,
    0
  );

  const grandTotalRecords = Array.from(
    groupedMap.values()
  ).reduce(
    (sum: number, item: any) =>
      sum + item.totalRecords,
    0
  );

  const grandTotalRow = sheet.addRow([
    "",
    "GRAND TOTAL",
    grandTotal,
    grandTotalRecords,
  ]);

  styleTotalRow(grandTotalRow);

  // =========================================
  // GLOBAL STYLING
  // =========================================

  sheet.eachRow((row) => {
    row.height = 22;
  });

  // FREEZE TOP
  sheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  // =========================================
  // EXPORT FILE
  // =========================================

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      "Content-Disposition": `attachment; filename="creative-production-report-${date}.xlsx"`,
    },
  });
}