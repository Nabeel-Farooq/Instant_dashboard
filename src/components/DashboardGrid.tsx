import { useEffect, useState } from "react";
import GridLayout, { type LayoutItem } from "react-grid-layout/dist/legacy";
import { Widget } from "./widgets/Widget";
import type { Dashboard } from "@/lib/dashboard-store";
import type { Subscription } from "@/lib/subscriptions";

type Props = {
  dashboard: Dashboard;
  subs: Subscription[];
  editing: boolean;
  onLayoutChange: (l: LayoutItem[]) => void;
  onRemoveWidget: (i: string) => void;
  onUpdateSub: (id: string, patch: Partial<Subscription>) => void;
  onDeleteSub: (id: string) => void;
};

export function DashboardGrid({
  dashboard, subs, editing, onLayoutChange, onRemoveWidget, onUpdateSub, onDeleteSub,
}: Props) {
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const el = document.getElementById("grid-container");
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return (
    <div id="grid-container" className="w-full">
      <GridLayout
        className="layout"
        layout={dashboard.layout}
        cols={12}
        rowHeight={56}
        width={width}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isDraggable={editing}
        isResizable={editing}
        draggableHandle=".drag-handle"
        onLayoutChange={(l) => onLayoutChange(l as LayoutItem[])}
      >
        {dashboard.widgets.map((w) => (
          <div key={w.i}>
            <Widget
              type={w.type}
              subs={subs}
              editing={editing}
              onRemove={() => onRemoveWidget(w.i)}
              onUpdateSub={onUpdateSub}
              onDeleteSub={onDeleteSub}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
