import type { DateString } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "YYYY-MM-DD" を UTC 0 時の Date として解釈する（タイムゾーンのずれを避けるため） */
export function parseDate(value: DateString): Date | null {
  const m = DATE_RE.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

export function isValidDateString(value: string): boolean {
  return parseDate(value) !== null;
}

export function formatDateString(date: Date): DateString {
  return date.toISOString().slice(0, 10);
}

/** 端末のローカル日付で今日を返す */
export function todayString(now: Date = new Date()): DateString {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(value: DateString, days: number): DateString {
  const date = parseDate(value);
  if (!date) throw new Error(`Invalid date: ${value}`);
  return formatDateString(new Date(date.getTime() + days * DAY_MS));
}

export function addMonths(value: DateString, months: number): DateString {
  const date = parseDate(value);
  if (!date) throw new Error(`Invalid date: ${value}`);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return formatDateString(target);
}

/** from から to までの日数（to が過去なら負数） */
export function daysBetween(from: DateString, to: DateString): number {
  const a = parseDate(from);
  const b = parseDate(to);
  if (!a || !b) return Number.NaN;
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** "2026年4月1日" 形式 */
export function formatJaDate(value: DateString | null | undefined): string {
  if (!value) return "—";
  const date = parseDate(value);
  if (!date) return value;
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

/** "YYYY-MM" */
export function monthKey(value: DateString): string {
  return value.slice(0, 7);
}
