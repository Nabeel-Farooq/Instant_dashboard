import { GripVertical, X } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onRemove?: () => void;
  editing?: boolean;
  className?: string;
  accent?: ReactNode;
};

export function WidgetShell({ title, subtitle, children, onRemove, editing, className, accent }: Props) {
  return (
    <div
      className={cn(
        "group flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground",
        "shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-elevated)]",
        className,
      )}
      style={{ background: "var(--gradient-card)" }}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {editing && (
              <span className="drag-handle cursor-grab text-muted-foreground active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
              </span>
            )}
            <h3 className="truncate text-sm font-semibold tracking-tight">{title}</h3>
          </div>
          {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          {accent}
          {editing && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Remove widget"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">{children}</div>
    </div>
  );
}
