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
}

function SingleWheel({ items, selected, onChange, label, testId }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const programmingRef = useRef(false);

  const scrollToIdx = useCallback(
    (idx: number, behavior: ScrollBehavior = "instant") => {
      const el = ref.current;
      if (!el) return;
      programmingRef.current = true;
      el.scrollTo({ top: idx * ITEM_H, behavior });
      if (behavior === "instant") {
        programmingRef.current = false;
      } else {
        setTimeout(() => {
          programmingRef.current = false;
        }, 400);
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
    }, 80);
  }, [items, selected, onChange, scrollToIdx]);

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <span
        style={{
          fontSize: 13,
          color: "#C9A84C",
          marginBottom: 6,
          letterSpacing: "0.08em",
          fontWeight: 600,
        }}
      >
        {label}
      </span>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: ITEM_H * VISIBLE,
          borderRadius: 10,
          border: "1px solid rgba(212,175,55,0.28)",
          background: "rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: ITEM_H * PAD,
            left: 0,
            right: 0,
            height: ITEM_H,
            background:
              "linear-gradient(to bottom,rgba(212,175,55,0.10),rgba(212,175,55,0.18))",
            borderTop: "1px solid rgba(212,175,55,0.45)",
            borderBottom: "1px solid rgba(212,175,55,0.45)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: ITEM_H * PAD,
            background: "linear-gradient(to bottom,#0D0D0D 40%,transparent)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: ITEM_H * PAD,
            background: "linear-gradient(to top,#0D0D0D 40%,transparent)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />

        <div
          ref={ref}
          data-testid={testId}
          onScroll={handleScroll}
          style={{
            height: "100%",
            overflowY: "scroll",
            scrollSnapType: "y mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties}
        >
          <style>{`[data-testid="${testId}"]::-webkit-scrollbar{display:none}`}</style>

          <div style={{ height: ITEM_H * PAD, flexShrink: 0 }} />
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
                  fontSize: isSel ? 20 : 15,
                  fontWeight: isSel ? 700 : 400,
                  color: isSel ? "#D4AF37" : "rgba(255,255,255,0.28)",
                  textShadow: isSel
                    ? "0 0 10px rgba(212,175,55,0.8),0 0 20px rgba(212,175,55,0.4)"
                    : "none",
                  transition: "color 0.15s,font-size 0.15s,text-shadow 0.15s",
                  userSelect: "none",
                }}
              >
                {String(item).padStart(item < 100 ? 2 : 4, " ")}
              </div>
            );
          })}
          <div style={{ height: ITEM_H * PAD, flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
}

interface BirthdayWheelsProps {
  value: { year: number; month: number; day: number };
  onChange: (val: { year: number; month: number; day: number }) => void;
  testIdPrefix?: string;
}

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

export function BirthdayWheels({
  value,
  onChange,
  testIdPrefix = "bw",
}: BirthdayWheelsProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1940 + 1 },
    (_, i) => 1940 + i
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const maxDay = getDaysInMonth(value.year, value.month);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const setYear = (y: number) => {
    const md = getDaysInMonth(y, value.month);
    onChange({ year: y, month: value.month, day: Math.min(value.day, md) });
  };
  const setMonth = (m: number) => {
    const md = getDaysInMonth(value.year, m);
    onChange({ year: value.year, month: m, day: Math.min(value.day, md) });
  };
  const setDay = (d: number) => onChange({ ...value, day: d });

  return (
    <div style={{ display: "flex", gap: 8, width: "100%" }}>
      <SingleWheel
        items={years}
        selected={value.year}
        onChange={setYear}
        label="年"
        testId={`${testIdPrefix}-year`}
      />
      <SingleWheel
        items={months}
        selected={value.month}
        onChange={setMonth}
        label="月"
        testId={`${testIdPrefix}-month`}
      />
      <SingleWheel
        items={days}
        selected={value.day}
        onChange={setDay}
        label="日"
        testId={`${testIdPrefix}-day`}
      />
    </div>
  );
}
