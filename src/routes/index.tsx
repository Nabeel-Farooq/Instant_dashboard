import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Check, LayoutGrid, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import { DashboardGrid } from "@/components/DashboardGrid";
import { useDashboards, useSubscriptions, type WidgetType } from "@/lib/dashboard-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BillBoard — Customizable subscription dashboard" },
      { name: "description", content: "Track recurring bills with a drag-and-drop dashboard you can save and customize." },
      { property: "og:title", content: "BillBoard — Customizable subscription dashboard" },
      { property: "og:description", content: "Track recurring bills with a drag-and-drop dashboard you can save and customize." },
    ],
  }),
  component: Index,
});

const WIDGET_OPTIONS: { type: WidgetType; label: string }[] = [
  { type: "kpi-monthly", label: "KPI · Monthly spend" },
  { type: "kpi-yearly", label: "KPI · Yearly spend" },
  { type: "kpi-active", label: "KPI · Active count" },
  { type: "kpi-upcoming", label: "KPI · Next charge" },
  { type: "chart-category", label: "Chart · Spend by category (donut)" },
  { type: "chart-monthly", label: "Chart · Category totals (bar)" },
  { type: "list-upcoming", label: "List · Upcoming charges" },
  { type: "list-all", label: "List · All subscriptions" },
];

function Index() {
  const { subs, add, update, remove, hydrated: subsHydrated } = useSubscriptions();
  const {
    dashboards, active, activeId, setActiveId,
    create, remove: removeDash, addWidget, removeWidget, setLayout, hydrated,
  } = useDashboards();

  const [editing, setEditing] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");

  if (!hydrated || !subsHydrated || !active) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <div
              className="grid h-9 w-9 place-items-center rounded-lg text-primary-foreground shadow-[var(--shadow-soft)]"
              style={{ background: "var(--gradient-hero)" }}
            >
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none tracking-tight">BillBoard</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Saved locally · {dashboards.length} dashboard{dashboards.length === 1 ? "" : "s"}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span className="max-w-[160px] truncate">{active.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Dashboards</DropdownMenuLabel>
                {dashboards.map((d) => (
                  <DropdownMenuItem
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{d.name}</span>
                    {d.id === activeId && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setNewOpen(true); }}>
                  <Plus className="mr-2 h-3.5 w-3.5" /> New dashboard
                </DropdownMenuItem>
                {dashboards.length > 1 && (
                  <DropdownMenuItem
                    onClick={() => removeDash(activeId)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete current
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {editing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" /> Add widget
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Widgets</DropdownMenuLabel>
                  {WIDGET_OPTIONS.map((o) => (
                    <DropdownMenuItem key={o.type} onClick={() => addWidget(o.type)}>
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant={editing ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? <><Check className="h-3.5 w-3.5" /> Done</> : <><Pencil className="h-3.5 w-3.5" /> Edit layout</>}
            </Button>

            <SubscriptionDialog
              onSubmit={add}
              trigger={
                <Button size="sm" className="gap-2">
                  <Plus className="h-3.5 w-3.5" /> Subscription
                </Button>
              }
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        {editing && (
          <div className="mb-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-xs text-foreground">
            <span className="font-medium text-primary">Edit mode:</span> drag widgets by their handle, resize from the bottom-right corner. Changes save automatically.
          </div>
        )}
        <DashboardGrid
          dashboard={active}
          subs={subs}
          editing={editing}
          onLayoutChange={setLayout}
          onRemoveWidget={removeWidget}
          onUpdateSub={update}
          onDeleteSub={remove}
        />
      </main>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New dashboard</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="e.g. Streaming services"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!newName.trim()) return;
                create(newName.trim());
                setNewName(""); setNewOpen(false);
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
