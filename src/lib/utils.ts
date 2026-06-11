import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatPhone(phone: string): string {
  // Format 254XXXXXXXXX to +254 XXX XXXXXX
  if (phone.startsWith("254") && phone.length === 12) {
    return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  }
  return phone;
}

export function formatPayerPhone(msisdn: string | null | undefined): string {
  // Real Kenyan MSISDN -> pretty format.
  if (msisdn && msisdn.startsWith("254") && msisdn.length === 12) {
    return formatPhone(msisdn);
  }
  // Safaricom hashes the MSISDN (SHA-256) in production for privacy. Show a
  // short, stable token so repeat payers are still distinguishable.
  if (msisdn && /^[a-f0-9]{64}$/i.test(msisdn)) {
    return `#${msisdn.slice(0, 8)}`;
  }
  return msisdn || "—";
}

export function normalizePhone(phone: string): string {
  // Remove spaces, dashes, and plus sign
  let cleaned = phone.replace(/[\s\-+]/g, "");

  // Convert 07XX to 2547XX
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "254" + cleaned.slice(1);
  }

  // Convert 7XX to 2547XX
  if (cleaned.startsWith("7") && cleaned.length === 9) {
    cleaned = "254" + cleaned;
  }

  return cleaned;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}
