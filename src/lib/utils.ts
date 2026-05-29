import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDeduction(type: "Small" | "Red" | "Black") {
  if (type === "Small") return 108;
  if (type === "Red") return 136;
  return 139;
}

export function calculateFinalWeight(rawWeight: number, type: "Small" | "Red" | "Black") {
  return Math.max(0, Number(rawWeight || 0) - getDeduction(type));
}

export function titleCase(text: string) {
  return text
    .replace(/[-_]/g, " ")
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
