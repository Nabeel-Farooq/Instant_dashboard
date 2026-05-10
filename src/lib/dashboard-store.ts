import { useEffect, useState, useCallback } from "react";
import type { Layout } from "react-grid-layout";
import type { Subscription } from "./subscriptions";

export type WidgetType =
  | "kpi-monthly"
  | "kpi-yearly"
  | "kpi-active"
  | "kpi-upcoming"
  | "chart-category"
  | "chart-monthly"
  | "list-upcoming"
  | "list-all";

export type Widget = {
  i: string;
  type: WidgetType;
  title?: string;
};

export type Dashboard = {
  id: string;
  name: string;
  widgets: Widget[];
  layout: Layout[];
};

const SUBS_KEY = "billtrack:subscriptions:v1";
const DASH_KEY = "billtrack:dashboards:v1";
const ACTIVE_KEY = "billtrack:active:v1";

const DEFAULT_WIDGETS: Widget[] = [
  { i: "w1", type: "kpi-monthly" },
  { i: "w2", type: "kpi-yearly" },
  { i: "w3", type: "kpi-active" },
  { i: "w4", type: "kpi-upcoming" },
  { i: "w5", type: "chart-category" },
  { i: "w6", type: "chart-monthly" },
  { i: "w7", type: "list-upcoming" },
  { i: "w8", type: "list-all" },
];

const DEFAULT_LAYOUT: Layout[] = [
  { i: "w1", x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "w2", x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "w3", x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "w4", x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "w5", x: 0, y: 2, w: 6, h: 5, minW: 3, minH: 4 },
  { i: "w6", x: 6, y: 2, w: 6, h: 5, minW: 3, minH: 4 },
  { i: "w7", x: 0, y: 7, w: 6, h: 6, minW: 3, minH: 4 },
  { i: "w8", x: 6, y: 7, w: 6, h: 6, minW: 3, minH: 4 },
];

function defaultDashboard(): Dashboard {
  return { id: "default", name: "My Dashboard", widgets: DEFAULT_WIDGETS, layout: DEFAULT_LAYOUT };
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

const SAMPLE: Subscription[] = [
  { id: "s1", name: "Netflix", amount: 15.49, currency: "USD", cycle: "monthly", nextBilling: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), category: "Entertainment" },
  { id: "s2", name: "Spotify", amount: 10.99, currency: "USD", cycle: "monthly", nextBilling: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10), category: "Music" },
  { id: "s3", name: "GitHub Pro", amount: 48, currency: "USD", cycle: "yearly", nextBilling: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10), category: "Software" },
  { id: "s4", name: "iCloud+", amount: 2.99, currency: "USD", cycle: "monthly", nextBilling: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), category: "Cloud" },
  { id: "s5", name: "NYT", amount: 4, currency: "USD", cycle: "monthly", nextBilling: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10), category: "News" },
];

export function useSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(SUBS_KEY);
    if (existing) setSubs(JSON.parse(existing));
    else { setSubs(SAMPLE); write(SUBS_KEY, SAMPLE); }
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) write(SUBS_KEY, subs); }, [subs, hydrated]);

  const add = useCallback((s: Omit<Subscription, "id">) =>
    setSubs((p) => [...p, { ...s, id: crypto.randomUUID() }]), []);
  const update = useCallback((id: string, patch: Partial<Subscription>) =>
    setSubs((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s))), []);
  const remove = useCallback((id: string) =>
    setSubs((p) => p.filter((s) => s.id !== id)), []);

  return { subs, add, update, remove, hydrated };
}

export function useDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeId, setActiveId] = useState<string>("default");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const list = read<Dashboard[]>(DASH_KEY, []);
    if (list.length === 0) {
      const d = [defaultDashboard()];
      setDashboards(d); write(DASH_KEY, d);
    } else setDashboards(list);
    setActiveId(read<string>(ACTIVE_KEY, "default"));
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) write(DASH_KEY, dashboards); }, [dashboards, hydrated]);
  useEffect(() => { if (hydrated) write(ACTIVE_KEY, activeId); }, [activeId, hydrated]);

  const active = dashboards.find((d) => d.id === activeId) ?? dashboards[0];

  const updateActive = useCallback((patch: Partial<Dashboard>) => {
    setDashboards((p) => p.map((d) => (d.id === activeId ? { ...d, ...patch } : d)));
  }, [activeId]);

  const create = useCallback((name: string) => {
    const id = crypto.randomUUID();
    const d: Dashboard = { id, name, widgets: DEFAULT_WIDGETS, layout: DEFAULT_LAYOUT };
    setDashboards((p) => [...p, d]);
    setActiveId(id);
  }, []);

  const remove = useCallback((id: string) => {
    setDashboards((p) => {
      const next = p.filter((d) => d.id !== id);
      if (next.length === 0) {
        const d = defaultDashboard();
        setActiveId(d.id);
        return [d];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }, [activeId]);

  const addWidget = useCallback((type: WidgetType) => {
    if (!active) return;
    const i = `w_${Date.now()}`;
    const maxY = active.layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
    const isKpi = type.startsWith("kpi");
    const newLayout: Layout = isKpi
      ? { i, x: 0, y: maxY, w: 3, h: 2, minW: 2, minH: 2 }
      : { i, x: 0, y: maxY, w: 6, h: 5, minW: 3, minH: 4 };
    updateActive({
      widgets: [...active.widgets, { i, type }],
      layout: [...active.layout, newLayout],
    });
  }, [active, updateActive]);

  const removeWidget = useCallback((i: string) => {
    if (!active) return;
    updateActive({
      widgets: active.widgets.filter((w) => w.i !== i),
      layout: active.layout.filter((l) => l.i !== i),
    });
  }, [active, updateActive]);

  const setLayout = useCallback((layout: Layout[]) => {
    if (!active) return;
    updateActive({ layout });
  }, [active, updateActive]);

  return { dashboards, active, activeId, setActiveId, create, remove, addWidget, removeWidget, setLayout, hydrated };
}
