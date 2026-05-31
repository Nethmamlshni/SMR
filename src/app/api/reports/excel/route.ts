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
// SMR HEADER
// =========================================

sheet.mergeCells("A1:K2");

const companyTitle = sheet.getCell("A1");

companyTitle.value =
  "SMR CONSOLIDATED\nCOCONUT COUNTING MANAGEMENT SYSTEM";

companyTitle.font = {
  bold: true,
  size: 22,
  color: { argb: "FFFFFFFF" },
};

companyTitle.alignment = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};

companyTitle.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: {
    argb: "FF3E2723", // coconut brown
  },
};

sheet.getRow(1).height = 35;
sheet.getRow(2).height = 35;

// =========================================
// REPORT DATE
// =========================================

sheet.mergeCells("A4:K4");

const reportDate = sheet.getCell("A4");

reportDate.value = `Production Report - ${date}`;

reportDate.font = {
  bold: true,
  size: 14,
  color: { argb: "FF1B5E20" },
};

reportDate.alignment = {
  horizontal: "center",
};

sheet.getRow(4).height = 22;


  
// =========================================
// TABLE 01+
// DYNAMIC SECTION FULL DETAILS
// =========================================

const sectionGroups = new Map();

records.forEach((record: any) => {
  const section =
    record.sectionName || "Unknown";

  if (!sectionGroups.has(section)) {
    sectionGroups.set(section, []);
  }

  sectionGroups
    .get(section)
    .push(record);
});

let tableNo = 1;

for (const [
  sectionName,
  sectionRecords,
] of sectionGroups.entries()) {
  // TITLE

  const titleRow = sheet.addRow([
    `TABLE ${tableNo} - ${String(
      sectionName
    ).toUpperCase()} FULL DETAILS`,
  ]);

  sheet.mergeCells(
    `A${titleRow.number}:K${titleRow.number}`
  );

  const titleCell =
    titleRow.getCell(1);

  titleCell.font = {
    bold: true,
    size: 16,
    color: {
      argb: "FFFFFFFF",
    },
  };

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF1565C0",
    },
  };

  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  titleRow.height = 25;

  sheet.addRow([]);

  // HEADERS

  const headerRow =
    sheet.addRow([
      "Date",
      "Shift",
      "Filling Type",
      "Cage No",
      "Cage Name",
      "Another Cage Name",
      "Coconut Type",
      "Raw Weight",
      "Final Weight",
      "Coconut Count",
      "Supervisor Name",
    ]);

  styleHeader(headerRow.number);

  // DATA

  sectionRecords.forEach(
    (record: any) => {
      const row =
        sheet.addRow([
          record.date,

          record.shift
            ?.toUpperCase(),

          record.fillingType ===
          "next-day"
            ? "Next Day Filling"
            : "Additional Filling",

          record.cageNumber,

          record.cageName ||
            "-",

          record.anotherCageName ||
            "-",

          record.coconutType,

          record.rawWeight,

          record.finalWeight,

          record.coconutCount,

          record.supervisorName,
        ]);

      styleDataRow(row);
    }
  );

  // TOTALS

  const totalRawWeight =
    sectionRecords.reduce(
      (
        sum: number,
        r: any
      ) =>
        sum +
        Number(
          r.rawWeight || 0
        ),
      0
    );

  const totalFinalWeight =
    sectionRecords.reduce(
      (
        sum: number,
        r: any
      ) =>
        sum +
        Number(
          r.finalWeight || 0
        ),
      0
    );

  const totalCoconutCount =
    sectionRecords.reduce(
      (
        sum: number,
        r: any
      ) =>
        sum +
        Number(
          r.coconutCount || 0
        ),
      0
    );

  const totalRow =
    sheet.addRow([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      totalRawWeight,
      totalFinalWeight,
      totalCoconutCount,
      "",
    ]);

  totalRow.getCell(7).value =
    "TOTAL";

  styleTotalRow(totalRow);

  sheet.addRow([]);
  sheet.addRow([]);

  tableNo++;
}

// =========================================
// TABLE 02 - ANOTHER CAGE SUMMARY
// =========================================

const anotherTitleRow = sheet.addRow([
  "TABLE " + tableNo + " - ANOTHER CAGE SUMMARY",
]);

sheet.mergeCells(
  `A${anotherTitleRow.number}:D${anotherTitleRow.number}`
);

const anotherTitleCell =
  anotherTitleRow.getCell(1);

anotherTitleCell.font = {
  bold: true,
  size: 16,
  color: { argb: "FFFFFFFF" },
};

anotherTitleCell.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF8E24AA" },
};

anotherTitleCell.alignment = {
  horizontal: "center",
  vertical: "middle",
};

sheet.addRow([]);

// =========================================
// HEADERS
// =========================================

const anotherHeader =
  sheet.addRow([
    "Another Cage Name",
    "Cage Names",
    "Cage Count",
    "Total Coconut Count",
  ]);

styleHeader(
  anotherHeader.number
);

// =========================================
// GROUP DATA
// =========================================

const anotherMap = new Map();

records.forEach((record: any) => {
  const anotherName =
    record.anotherCageName?.trim() ||
    "-";

  const cageName =
    record.cageName?.trim() || "-";

  if (!anotherMap.has(anotherName)) {
    anotherMap.set(anotherName, {
      anotherCageName:
        anotherName,
      cageNames: new Set(),
      totalCoconutCount: 0,
    });
  }

  const item =
    anotherMap.get(
      anotherName
    );

  item.cageNames.add(
    cageName
  );

  item.totalCoconutCount +=
    Number(
      record.coconutCount || 0
    );
});

// =========================================
// DISPLAY ROWS
// =========================================

Array.from(
  anotherMap.values()
).forEach((item: any) => {
  const row =
    sheet.addRow([
      item.anotherCageName,

      Array.from(
        item.cageNames
      ).join(", "),

      item.cageNames.size,

      item.totalCoconutCount,
    ]);

  styleDataRow(row);
});

// =========================================
// GRAND TOTAL
// =========================================

const grandTotal =
  Array.from(
    anotherMap.values()
  ).reduce(
    (
      sum: number,
      item: any
    ) =>
      sum +
      item.totalCoconutCount,
    0
  );

const totalRow =
  sheet.addRow([
    "",
    "GRAND TOTAL",
    "",
    grandTotal,
  ]);

styleTotalRow(totalRow);

sheet.addRow([]);
sheet.addRow([]);

tableNo++;

// =========================================
// TABLE 03 - CAGE NAME SUMMARY
// =========================================

const cageTitleRow = sheet.addRow([
  "TABLE " + tableNo + " - CAGE NAME SUMMARY",
]);

sheet.mergeCells(
  `A${cageTitleRow.number}:C${cageTitleRow.number}`
);

const cageTitleCell =
  cageTitleRow.getCell(1);

cageTitleCell.font = {
  bold: true,
  size: 16,
  color: { argb: "FFFFFFFF" },
};

cageTitleCell.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF00897B" },
};

cageTitleCell.alignment = {
  horizontal: "center",
  vertical: "middle",
};

sheet.addRow([]);

// =========================================
// HEADERS
// =========================================

const cageHeader = sheet.addRow([
  "Cage Name",
  "Cage No",
  "Total Coconut Count",
]);

styleHeader(cageHeader.number);

// =========================================
// GROUP DATA
// =========================================

const cageMap = new Map();

records.forEach((record: any) => {
  const cageName =
    record.cageName?.trim() || "-";

  if (!cageMap.has(cageName)) {
    cageMap.set(cageName, {
      cageName,
      cageNumbers: new Set(),
      totalCoconutCount: 0,
    });
  }

  const item =
    cageMap.get(cageName);

  item.cageNumbers.add(
    record.cageNumber
  );

  item.totalCoconutCount +=
    Number(
      record.coconutCount || 0
    );
});

// =========================================
// DISPLAY ROWS
// =========================================

Array.from(
  cageMap.values()
)
.sort((a: any, b: any) =>
  a.cageName.localeCompare(
    b.cageName
  )
)
.forEach((item: any) => {
  const row = sheet.addRow([
    item.cageName,

    Array.from(
      item.cageNumbers
    )
      .sort((a: any, b: any) => a - b)
      .join(", "),

    item.totalCoconutCount,
  ]);

  styleDataRow(row);
});

// =========================================
// GRAND TOTAL
// =========================================

const cageGrandTotal =
  Array.from(
    cageMap.values()
  ).reduce(
    (
      sum: number,
      item: any
    ) =>
      sum +
      item.totalCoconutCount,
    0
  );

const cageTotalRow =
  sheet.addRow([
    "",
    "GRAND TOTAL",
    cageGrandTotal,
  ]);

styleTotalRow(
  cageTotalRow
);

sheet.addRow([]);
sheet.addRow([]);

tableNo++;


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