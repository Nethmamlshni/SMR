import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import FillingRecord from "@/models/FillingRecord";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  await connectDB();

  // තෝරාගත් දවසට අදාළ සියලුම දත්ත ලබා ගැනීම
  const records = await FillingRecord.find({ date }).lean();

  // =========================================
  // 🔥 PRE-CALCULATION: MAP TOTAL COCONUTS PER CAGE FOR DAY & NIGHT SEPARATELY
  // =========================================
  const dayCageTotalMap = new Map<string, number>();
  const nightCageTotalMap = new Map<string, number>();
  
  records.forEach((record: any) => {
    const cageKey = String(record.cageNumber);
    const currentCount = Number(record.coconutCount || 0);
    const shift = record.shift?.toLowerCase() || "";

    if (shift.includes("day")) {
      dayCageTotalMap.set(cageKey, (dayCageTotalMap.get(cageKey) || 0) + currentCount);
    } else if (shift.includes("night")) {
      nightCageTotalMap.set(cageKey, (nightCageTotalMap.get(cageKey) || 0) + currentCount);
    }
  });

  // =========================================
  // WORKBOOK CREATION
  // =========================================
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Shift Production Report");
  sheet.views = [{ showGridLines: true }];

  sheet.columns = [
    { key: "date", width: 15 },
    { key: "shift", width: 15 },
    { key: "fillingType", width: 22 },
    { key: "cageNo", width: 12 },
    { key: "cageName", width: 20 },
    { key: "anotherCageName", width: 22 },
    { key: "coconutType", width: 18 },
    { key: "rawWeight", width: 16 },
    { key: "finalWeight", width: 16 },
    { key: "coconutCount", width: 16 },
    { key: "supervisor", width: 22 },
  ];

  // STYLES
  const headerStyle = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 11 },
    fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF4A2C1D" } }, // Coconut Brown
    alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true },
  };
  const totalStyle = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 11 },
    fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1B5E20" } }, // Dark Green
  };
  const borderStyle = {
    top: { style: "thin" as const }, left: { style: "thin" as const },
    bottom: { style: "thin" as const }, right: { style: "thin" as const },
  };

  function styleHeader(rowNumber: number) {
    const row = sheet.getRow(rowNumber); row.height = 28;
    row.eachCell(cell => { cell.font = headerStyle.font; cell.fill = headerStyle.fill; cell.alignment = headerStyle.alignment; cell.border = borderStyle; });
  }
  function styleDataRow(row: any) {
    row.height = 24;
    row.eachCell((cell: any) => { cell.font = { name: "Arial", size: 10 }; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; cell.border = borderStyle; });
  }
  function styleTotalRow(row: any) {
    row.height = 26;
    row.eachCell((cell: any) => { cell.font = totalStyle.font; cell.fill = totalStyle.fill; cell.alignment = { horizontal: "center", vertical: "middle" }; cell.border = borderStyle; });
  }

  // MAIN HEADERS
  sheet.mergeCells("A1:K2");
  const companyTitle = sheet.getCell("A1");
  companyTitle.value = "SMR CONSOLIDATED\nCOCONUT COUNTING MANAGEMENT SYSTEM (SHIFT WISE)";
  companyTitle.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" }, name: "Arial" };
  companyTitle.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  companyTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3E2723" } };

  sheet.mergeCells("A4:K4");
  const reportDate = sheet.getCell("A4");
  reportDate.value = `Production Shift Wise Summary Report - ${date}`;
  reportDate.font = { bold: true, size: 13, color: { argb: "FF1B5E20" }, name: "Arial" };
  reportDate.alignment = { horizontal: "center", vertical: "middle" };

  let tableNo = 1;
  let currentExcelRow = 6;

  // ෂිෆ්ට් දෙක වෙන් වෙන්ව ලූප් කර වගු 6ක් සෑදීම
  const shiftsToProcess = ["DAY", "NIGHT"];

  shiftsToProcess.forEach((currentShift) => {
    // අදාළ Shift එකට අදාළ දත්ත පමණක් පෙරීම
    const shiftRecords = records.filter(r => (r.shift || "").toUpperCase().includes(currentShift));
    const currentMap = currentShift === "DAY" ? dayCageTotalMap : nightCageTotalMap;

    if (shiftRecords.length === 0) return; // දත්ත නැත්නම් වගු සාදන්නේ නැත

    // -----------------------------------------------------------------
    // 📊 1. SECTION WISE CAGE SUMMARY TABLE (Table 1 & Table 4)
    // -----------------------------------------------------------------
    const sectionGroups = new Map();
    shiftRecords.forEach((record: any) => {
      const section = record.sectionName || "Unknown";
      if (!sectionGroups.has(section)) sectionGroups.set(section, new Map());

      const sectionMap = sectionGroups.get(section);
      const cageKey = String(record.cageNumber);

      if (!sectionMap.has(cageKey)) {
        sectionMap.set(cageKey, {
          date: record.date, shift: currentShift, fillingTypes: new Set(), cageNumber: record.cageNumber,
          cageNames: new Set(), anotherCageNames: new Set(), coconutTypes: new Set(),
          rawWeight: 0, finalWeight: 0, coconutCount: 0, supervisors: new Set(),
        });
      }

      const group = sectionMap.get(cageKey);
      group.rawWeight += Number(record.rawWeight || 0);
      group.finalWeight += Number(record.finalWeight || 0);
      group.coconutCount += Number(record.coconutCount || 0);

      group.fillingTypes.add(record.fillingType === "next-day" ? "Next Day" : "Additional");
      if (record.cageName && record.cageName !== "-") group.cageNames.add(record.cageName.trim());
      if (record.anotherCageName && record.anotherCageName !== "-") group.anotherCageNames.add(record.anotherCageName.trim());
      if (record.coconutType && record.coconutType !== "-") group.coconutTypes.add(record.coconutType.trim());
      if (record.supervisorName && record.supervisorName !== "-") group.supervisors.add(record.supervisorName.trim());
    });

    for (const [sectionName, sectionMap] of sectionGroups.entries()) {
      sheet.mergeCells(`A${currentExcelRow}:K${currentExcelRow}`);
      const titleCell = sheet.getCell(`A${currentExcelRow}`);
      titleCell.value = `TABLE 0${tableNo} - ${currentShift} SHIFT - ${String(sectionName).toUpperCase()} CAGE SUMMARY`;
      titleCell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" }, name: "Arial" };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: currentShift === "DAY" ? "FF1565C0" : "FF283593" } }; // Blue variants
      currentExcelRow++;

      const headerRow = sheet.addRow([
        "Date", "Shift", "Filling Types", "Cage No", "Cage Name", 
        "Another Cage Name", "Coconut Type", "Total Raw Weight", "Total Final Weight", "Total Coconut Count", "Supervisor List"
      ]);
      styleHeader(headerRow.number);
      currentExcelRow++;

      let sectionRawTotal = 0; let sectionFinalTotal = 0; let sectionCountTotal = 0;
      const sortedCages = Array.from(sectionMap.values()).sort((a: any, b: any) => Number(a.cageNumber) - Number(b.cageNumber));

      sortedCages.forEach((cageData: any) => {
        sectionRawTotal += cageData.rawWeight;
        sectionFinalTotal += cageData.finalWeight;
        sectionCountTotal += cageData.coconutCount;

        const row = sheet.addRow([
          cageData.date, cageData.shift, Array.from(cageData.fillingTypes).join(" + ") || "-",
          cageData.cageNumber, Array.from(cageData.cageNames).join(", ") || "-", Array.from(cageData.anotherCageNames).join(", ") || "-",
          Array.from(cageData.coconutTypes).join(", ") || "-", cageData.rawWeight, cageData.finalWeight, cageData.coconutCount,
          Array.from(cageData.supervisors).join(", ") || "-",
        ]);
        styleDataRow(row);
        currentExcelRow++;
      });

      const totalRow = sheet.addRow(["", "", "", "", "", "", "TOTAL", sectionRawTotal, sectionFinalTotal, sectionCountTotal, ""]);
      styleTotalRow(totalRow);
      currentExcelRow++;

      sheet.addRow([]); currentExcelRow++;
    }
    tableNo++;

    // -----------------------------------------------------------------
    // 📊 2. ANOTHER CAGE SUMMARY TABLE (Table 2 & Table 5)
    // -----------------------------------------------------------------
    sheet.mergeCells(`A${currentExcelRow}:D${currentExcelRow}`);
    const anotherTitleCell = sheet.getCell(`A${currentExcelRow}`);
    anotherTitleCell.value = `TABLE 0${tableNo} - ${currentShift} SHIFT - ANOTHER CAGE SUMMARY`;
    anotherTitleCell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" }, name: "Arial" };
    anotherTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8E24AA" } }; // Purple
    currentExcelRow++;

    const anotherHeader = sheet.addRow(["Another Cage Name", "Cage Names List", "Cage Count", "Total Coconut Count"]);
    styleHeader(anotherHeader.number);
    currentExcelRow++;

    const anotherMap = new Map();
    shiftRecords.forEach((record: any) => {
      const anotherName = record.anotherCageName?.trim();
      if (!anotherName || anotherName === "-") return;

      if (!anotherMap.has(anotherName)) {
        anotherMap.set(anotherName, { anotherCageName: anotherName, cageNames: new Set<string>(), cageNumbers: new Set<string>() });
      }
      const item = anotherMap.get(anotherName);
      if (record.cageName && record.cageName !== "-") item.cageNames.add(record.cageName.trim());
      if (record.cageNumber) item.cageNumbers.add(String(record.cageNumber));
    });

    let anotherGrandTotal = 0;
    anotherMap.forEach((item: any) => {
      let totalCoconutCount = 0;
      item.cageNumbers.forEach((cageNo: string) => {
        totalCoconutCount += currentMap.get(cageNo) || 0; // මෙම Shift එකේ මුළු එකතුව ගනී
      });

      anotherGrandTotal += totalCoconutCount;
      const row = sheet.addRow([item.anotherCageName, Array.from(item.cageNames).join(", ") || "-", item.cageNumbers.size, totalCoconutCount]);
      styleDataRow(row);
      currentExcelRow++;
    });

    const anotherTotalRow = sheet.addRow(["", "GRAND TOTAL", "", anotherGrandTotal]);
    styleTotalRow(anotherTotalRow);
    currentExcelRow++;

    sheet.addRow([]); currentExcelRow++;
    tableNo++;

    // -----------------------------------------------------------------
    // 📊 3. CAGE NAME SUMMARY TABLE (Table 3 & Table 6)
    // -----------------------------------------------------------------
    sheet.mergeCells(`A${currentExcelRow}:C${currentExcelRow}`);
    const cageTitleCell = sheet.getCell(`A${currentExcelRow}`);
    cageTitleCell.value = `TABLE 0${tableNo} - ${currentShift} SHIFT - CAGE NAME SUMMARY`;
    cageTitleCell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" }, name: "Arial" };
    cageTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00897B" } }; // Teal
    currentExcelRow++;

    const cageHeader = sheet.addRow(["Cage Name", "Cage No List", "Total Coconut Count"]);
    styleHeader(cageHeader.number);
    currentExcelRow++;

    const cageMap = new Map();
    shiftRecords.forEach((record: any) => {
      const cageName = record.cageName?.trim();
      if (!cageName || cageName === "-") return;

      if (!cageMap.has(cageName)) {
        cageMap.set(cageName, { cageName, cageNumbers: new Set<string>() });
      }
      const item = cageMap.get(cageName);
      if (record.cageNumber) item.cageNumbers.add(String(record.cageNumber));
    });

    let cageGrandTotal = 0;
    Array.from(cageMap.values())
      .sort((a: any, b: any) => a.cageName.localeCompare(b.cageName))
      .forEach((item: any) => {
        let totalCoconutCount = 0;
        item.cageNumbers.forEach((cageNo: string) => {
          totalCoconutCount += currentMap.get(cageNo) || 0; // මෙම Shift එකේ මුළු එකතුව ගනී
        });

        cageGrandTotal += totalCoconutCount;
        const row = sheet.addRow([item.cageName, Array.from(item.cageNumbers).sort((a: any, b: any) => Number(a) - Number(b)).join(", "), totalCoconutCount]);
        styleDataRow(row);
        currentExcelRow++;
      });

    const cageTotalRow = sheet.addRow(["", "GRAND TOTAL", cageGrandTotal]);
    styleTotalRow(cageTotalRow);
    currentExcelRow++;

    // ෂිෆ්ට් දෙක අතර ලොකු පරතරයක් තැබීම
    sheet.addRow([]); sheet.addRow([]); currentExcelRow += 2;
    tableNo++;
  });

  // EXPORT
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="SMR-6Tables-Report-${date}.xlsx"`,
    },
  });
}