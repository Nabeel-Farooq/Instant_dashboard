import { addMonths, addYears, differenceInDays, isBefore, parseISO, startOfDay } from "date-fns";

export type BillingCycle = "monthly" | "yearly" | "weekly" | "quarterly";

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  cycle: BillingCycle;
  nextBilling: string; // ISO date
  category: string;
  color?: string;
  notes?: string;
};

export const CATEGORIES = [
  "Entertainment",
  "Software",
  "Utilities",
  "Health",
  "Productivity",
  "Music",
  "Cloud",
  "News",
  "Other",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: "var(--chart-4)",
  Software: "var(--chart-2)",
  Utilities: "var(--chart-3)",
  Health: "var(--chart-1)",
  Productivity: "var(--chart-5)",
  Music: "var(--chart-4)",
  Cloud: "var(--chart-2)",
  News: "var(--chart-3)",
  Other: "var(--muted-foreground)",
};

export function monthlyCost(s: Subscription): number {
  switch (s.cycle) {
    case "weekly": return (s.amount * 52) / 12;
    case "monthly": return s.amount;
    case "quarterly": return s.amount / 3;
    case "yearly": return s.amount / 12;
  }
}

export function yearlyCost(s: Subscription): number {
  return monthlyCost(s) * 12;
}

export function nextDate(s: Subscription): Date {
  let d = parseISO(s.nextBilling);
  const today = startOfDay(new Date());
  while (isBefore(d, today)) {
    d = s.cycle === "yearly" ? addYears(d, 1) : addMonths(d, s.cycle === "quarterly" ? 3 : s.cycle === "weekly" ? 0 : 1);
    if (s.cycle === "weekly") d = new Date(d.getTime() + 7 * 24 * 3600 * 1000);
  }
  return d;
}

export function daysUntil(s: Subscription): number {
  return differenceInDays(nextDate(s), startOfDay(new Date()));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}
