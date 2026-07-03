import { useRef, useEffect, useCallback } from "react";

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = 2;

interface WheelProps {
  items: number[];
  selected: number;
  onChange: (v: number) => void;
  label: string;
  testId: string;
  fmt?: (n: number) => string;
  onInteract?: (active: boolean) => void;
}

function SingleWheel({ items, selected, onChange, label, testId, fmt, onInteract }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const programmingRef = useRef(false);

  const display = fmt ?? ((n: number) => String(n));

  const scrollToIdx = useCallback(
    (idx: number, behavior: ScrollBehavior = "instant") => {
      const el = ref.current;
      if (!el) return;
      programmingRef.current = true;
      el.scrollTo({ top: idx * ITEM_H, behavior });
      if (behavior === "instant") {
        programmingRef.current = false;
      } else {
        setTimeout(() => { programmingRef.current = false; }, 450);
      }
    },
    []
  );

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0) scrollToIdx(idx, "instant");
  }, []);

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0) scrollToIdx(idx, "smooth");
  }, [selected, items]);

  const handleScroll = useCallback(() => {
    if (programmingRef.current) return;
    onInteract?.(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const raw = Math.round(el.scrollTop / ITEM_H);
      const idx = Math.max(0, Math.min(raw, items.length - 1));
      scrollToIdx(idx, "smooth");
      if (items[idx] !== undefined && items[idx] !== selected) {
        onChange(items[idx]);
      }
      onInteract?.(false);
    }, 100);
  }, [items, selected, onChange, scrollToIdx, onInteract]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 12, color: "#C9A84C", marginBottom: 4, letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </span>
      <div style={{ position: "relative", width: "100%", height: ITEM_H * VISIBLE, borderRadius: 8, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(0,0,0,0.72)", overflow: "hidden" }}>
        {/* Gold selection band */}
        <div style={{ position: "absolute", top: ITEM_H * PAD, left: 0, right: 0, height: ITEM_H, background: "linear-gradient(to bottom,rgba(212,175,55,0.09),rgba(212,175,55,0.17))", borderTop: "1px solid rgba(212,175,55,0.45)", borderBottom: "1px solid rgba(212,175,55,0.45)", pointerEvents: "none", zIndex: 10 }} />
        {/* Top fade */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: ITEM_H * 2, background: "linear-gradient(to bottom,#0D0D0D 30%,transparent)", pointerEvents: "none", zIndex: 20 }} />
        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: ITEM_H * 2, background: "linear-gradient(to top,#0D0D0D 30%,transparent)", pointerEvents: "none", zIndex: 20 }} />

        <div
          ref={ref}
          data-testid={testId}
          onScroll={handleScroll}
          style={{ height: "100%", overflowY: "scroll", scrollSnapType: "y mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          <style>{`[data-testid="${testId}"]::-webkit-scrollbar{display:none}`}</style>
          <div style={{ height: ITEM_H * PAD }} />
          {items.map((item) => {
            const isSel = item === selected;
            return (
              <div
                key={item}
                onClick={() => {
                  const idx = items.indexOf(item);
                  scrollToIdx(idx, "smooth");
                  onChange(item);
                }}
                style={{
                  height: ITEM_H,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  scrollSnapAlign: "center",
                  cursor: "pointer",
                  fontSize: isSel ? 19 : 14,
                  fontWeight: isSel ? 700 : 400,
                  color: isSel ? "#D4AF37" : "rgba(255,255,255,0.28)",
                  textShadow: isSel ? "0 0 10px rgba(212,175,55,0.8),0 0 22px rgba(212,175,55,0.4)" : "none",
                  transition: "all 0.15s ease",
                  userSelect: "none",
                  letterSpacing: isSel ? "0.05em" : "0",
                }}
              >
                {display(item)}
              </div>
            );
          })}
          <div style={{ height: ITEM_H * PAD }} />
        </div>
      </div>
    </div>
  );
}

export interface BirthdayValue {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

interface BirthdayWheelsProps {
  value: BirthdayValue;
  onChange: (val: BirthdayValue) => void;
  testIdPrefix?: string;
  onTimeInteract?: (active: boolean) => void;
}

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function BirthdayWheels({ value, onChange, testIdPrefix = "bw", onTimeInteract }: BirthdayWheelsProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => 1940 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const maxDay = getDaysInMonth(value.year, value.month);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const setYear = (y: number) => {
    const md = getDaysInMonth(y, value.month);
    onChange({ ...value, year: y, day: Math.min(value.day, md) });
  };
  const setMonth = (m: number) => {
    const md = getDaysInMonth(value.year, m);
    onChange({ ...value, month: m, day: Math.min(value.day, md) });
  };
  const setDay = (d: number) => onChange({ ...value, day: d });
  const setHour = (h: number) => onChange({ ...value, hour: h });
  const setMinute = (min: number) => onChange({ ...value, minute: min });

  return (
    <div style={{ display: "flex", gap: 6, width: "100%" }}>
      <SingleWheel items={years} selected={value.year} onChange={setYear} label="年" testId={`${testIdPrefix}-year`} />
      <SingleWheel items={months} selected={value.month} onChange={setMonth} label="月" testId={`${testIdPrefix}-month`} />
      <SingleWheel items={days} selected={value.day} onChange={setDay} label="日" testId={`${testIdPrefix}-day`} />
      <SingleWheel items={hours} selected={value.hour} onChange={setHour} label="時" testId={`${testIdPrefix}-hour`} fmt={pad2} onInteract={onTimeInteract} />
      <SingleWheel items={minutes} selected={value.minute} onChange={setMinute} label="分" testId={`${testIdPrefix}-minute`} fmt={pad2} onInteract={onTimeInteract} />
    </div>
  );
}

export function SimpleBirthdayWheels({ value, onChange, testIdPrefix = "sbw" }: {
  value: { year: number; month: number; day: number };
  onChange: (v: { year: number; month: number; day: number }) => void;
  testIdPrefix?: string;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => 1940 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const maxDay = getDaysInMonth(value.year, value.month);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const setYear = (y: number) => {
    const md = getDaysInMonth(y, value.month);
    onChange({ ...value, year: y, day: Math.min(value.day, md) });
  };
  const setMonth = (m: number) => {
    const md = getDaysInMonth(value.year, m);
    onChange({ ...value, month: m, day: Math.min(value.day, md) });
  };
  const setDay = (d: number) => onChange({ ...value, day: d });

  return (
    <div style={{ display: "flex", gap: 8, width: "100%" }}>
      <SingleWheel items={years} selected={value.year} onChange={setYear} label="年" testId={`${testIdPrefix}-year`} />
      <SingleWheel items={months} selected={value.month} onChange={setMonth} label="月" testId={`${testIdPrefix}-month`} />
      <SingleWheel items={days} selected={value.day} onChange={setDay} label="日" testId={`${testIdPrefix}-day`} />
    </div>
  );
}
