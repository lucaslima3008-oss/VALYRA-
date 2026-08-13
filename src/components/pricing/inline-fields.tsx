import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NumberFieldProps {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  className?: string;
  emphasis?: boolean;
  ariaLabel: string;
}

const parse = (raw: string) => {
  const n = Number(raw.replace(/\./g, "").replace(",", "."));
  return isFinite(n) ? n : 0;
};

export function InlineNumberField({
  value,
  onChange,
  prefix,
  suffix,
  className,
  emphasis,
  ariaLabel,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(null);
  }, [value, focused]);

  const display =
    draft ??
    value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className={cn(
        "group inline-flex items-center gap-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm tabular-nums transition-all duration-200",
        "hover:border-border hover:bg-muted/60 focus-within:border-ring focus-within:bg-card focus-within:shadow-[var(--shadow-focus)]",
        emphasis && "font-semibold text-foreground",
        className,
      )}
    >
      {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
      <input
        aria-label={ariaLabel}
        inputMode="decimal"
        className="w-16 bg-transparent text-right outline-none"
        value={display}
        onFocus={(e) => {
          setFocused(true);
          setDraft(String(value).replace(".", ","));
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) onChange(parse(draft));
          setFocused(false);
          setDraft(null);
        }}
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
  );
}
