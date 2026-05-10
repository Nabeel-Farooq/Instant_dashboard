import { useMemo } from "react";
import { format } from "date-fns";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Pencil, Trash2 } from "lucide-react";
import { WidgetShell } from "./WidgetShell";
import {
  CATEGORY_COLORS, daysUntil, formatCurrency, monthlyCost, nextDate, yearlyCost,
  type Subscription,
} from "@/lib/subscriptions";
import type { WidgetType } from "@/lib/dashboard-store";
import { SubscriptionDialog } from "../SubscriptionDialog";
import { Button } from "@/components/ui/button";

type Props = {
  type: WidgetType;
  subs: Subscription[];
  editing: boolean;
  onRemove: () => void;
  onUpdateSub: (id: string, patch: Partial<Subscription>) => void;
  onDeleteSub: (id: string) => void;
};

export function Widget({ type, subs, editing, onRemove, onUpdateSub, onDeleteSub }: Props) {
  const totalMonthly = subs.reduce((a, s) => a + monthlyCost(s), 0);
  const totalYearly = subs.reduce((a, s) => a + yearlyCost(s), 0);
  const upcoming = useMemo(
    () => [...subs].map((s) => ({ s, d: daysUntil(s) })).sort((a, b) => a.d - b.d),
    [subs],
  );

  const baseCurrency = subs[0]?.currency ?? "USD";

  if (type === "kpi-monthly") {
    return (
      <WidgetShell title="Monthly spend" subtitle="Across all subscriptions" editing={editing} onRemove={onRemove}>
        <div className="flex h-full flex-col justify-center">
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(totalMonthly, baseCurrency)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{subs.length} active</div>
        </div>
      </WidgetShell>
    );
  }

  if (type === "kpi-yearly") {
    return (
      <WidgetShell title="Yearly spend" subtitle="Annualized" editing={editing} onRemove={onRemove}>
        <div className="flex h-full flex-col justify-center">
          <div className="text-3xl font-semibold tracking-tight">
            {formatCurrency(totalYearly, baseCurrency)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">≈ {formatCurrency(totalMonthly, baseCurrency)}/mo</div>
        </div>
      </WidgetShell>
    );
  }

  if (type === "kpi-active") {
    const cats = new Set(subs.map((s) => s.category)).size;
    return (
      <WidgetShell title="Active" subtitle="Subscriptions" editing={editing} onRemove={onRemove}>
        <div className="flex h-full flex-col justify-center">
          <div className="text-3xl font-semibold tracking-tight">{subs.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">{cats} categories</div>
        </div>
      </WidgetShell>
    );
  }

  if (type === "kpi-upcoming") {
    const next = upcoming[0];
    return (
      <WidgetShell title="Next charge" subtitle={next ? next.s.name : "—"} editing={editing} onRemove={onRemove}>
        <div className="flex h-full flex-col justify-center">
          <div className="text-3xl font-semibold tracking-tight">
            {next ? formatCurrency(next.s.amount, next.s.currency) : "—"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {next ? (next.d === 0 ? "Today" : next.d === 1 ? "Tomorrow" : `In ${next.d} days`) : "No subscriptions"}
          </div>
        </div>
      </WidgetShell>
    );
  }

  if (type === "chart-category") {
    const map = new Map<string, number>();
    subs.forEach((s) => map.set(s.category, (map.get(s.category) ?? 0) + monthlyCost(s)));
    const data = Array.from(map, ([name, value]) => ({ name, value }));
    return (
      <WidgetShell title="Spend by category" subtitle="Monthly breakdown" editing={editing} onRemove={onRemove}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
              {data.map((d) => (
                <Cell key={d.name} fill={CATEGORY_COLORS[d.name] ?? "var(--muted-foreground)"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => formatCurrency(v, baseCurrency)}
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </WidgetShell>
    );
  }

  if (type === "chart-monthly") {
    const map = new Map<string, number>();
    subs.forEach((s) => map.set(s.category, (map.get(s.category) ?? 0) + monthlyCost(s)));
    const data = Array.from(map, ([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
    return (
      <WidgetShell title="Category totals" subtitle="Monthly spend" editing={editing} onRemove={onRemove}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              formatter={(v: number) => formatCurrency(v, baseCurrency)}
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--primary)" />
          </BarChart>
        </ResponsiveContainer>
      </WidgetShell>
    );
  }

  if (type === "list-upcoming") {
    return (
      <WidgetShell title="Upcoming charges" subtitle="Sorted by next billing date" editing={editing} onRemove={onRemove}>
        <div className="h-full overflow-auto">
          <ul className="divide-y divide-border">
            {upcoming.slice(0, 20).map(({ s, d }) => (
              <li key={s.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(nextDate(s), "MMM d")} · {d === 0 ? "Today" : d === 1 ? "Tomorrow" : `in ${d}d`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatCurrency(s.amount, s.currency)}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.cycle}</div>
                </div>
              </li>
            ))}
            {upcoming.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No subscriptions yet</li>}
          </ul>
        </div>
      </WidgetShell>
    );
  }

  if (type === "list-all") {
    return (
      <WidgetShell title="All subscriptions" subtitle="Manage your services" editing={editing} onRemove={onRemove}>
        <div className="h-full overflow-auto">
          <ul className="divide-y divide-border">
            {subs.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: CATEGORY_COLORS[s.category] ?? "var(--muted-foreground)" }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.category} · {s.cycle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-sm font-semibold">{formatCurrency(s.amount, s.currency)}</span>
                  <SubscriptionDialog
                    initial={s}
                    onSubmit={(patch) => onUpdateSub(s.id, patch)}
                    trigger={
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteSub(s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
            {subs.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">Add your first subscription</li>}
          </ul>
        </div>
      </WidgetShell>
    );
  }

  return null;
}
