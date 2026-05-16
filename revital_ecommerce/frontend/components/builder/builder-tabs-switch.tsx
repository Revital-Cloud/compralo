"use client";

type TabItem<T extends string> = {
  id: T;
  label: string;
};

export function BuilderTabsSwitch<T extends string>({
  value,
  items,
  onChange,
}: {
  value: T;
  items: TabItem<T>[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="bg-background inline-flex w-full rounded-lg border border-white/10 p-1">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            className={`h-8 flex-1 rounded-md px-3 text-xs font-semibold transition-all ${
              active
                ? "bg-[#ff0000] text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
            onClick={() => onChange(item.id)}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
