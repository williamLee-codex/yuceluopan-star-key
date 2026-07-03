import { useEffect } from "react";

interface BirthdayWheelsProps {
  value: { year: number; month: number; day: number };
  onChange: (val: { year: number; month: number; day: number }) => void;
}

export function BirthdayWheels({ value, onChange }: BirthdayWheelsProps) {
  const years = Array.from({ length: 2010 - 1940 + 1 }, (_, i) => 1940 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m, 0).getDate();
  };
  
  const days = Array.from({ length: getDaysInMonth(value.year, value.month) }, (_, i) => i + 1);

  useEffect(() => {
    const maxDays = getDaysInMonth(value.year, value.month);
    if (value.day > maxDays) {
      onChange({ ...value, day: maxDays });
    }
  }, [value.year, value.month]);

  const Wheel = ({ items, selected, onChange, label }: { items: number[], selected: number, onChange: (v: number) => void, label: string }) => {
    return (
      <div className="flex flex-col items-center flex-1">
        <span className="text-primary/70 text-sm mb-2">{label}</span>
        <div className="relative h-32 w-full overflow-hidden rounded-md border border-primary/30 bg-black">
          <div className="absolute top-1/2 left-0 right-0 h-10 -mt-5 bg-primary/20 pointer-events-none border-y border-primary/40 z-10" />
          
          <div className="h-full overflow-y-auto snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[40px] pt-[40px]" 
               onScroll={(e) => {
                 const el = e.currentTarget;
                 const itemHeight = 40;
                 const index = Math.round(el.scrollTop / itemHeight);
                 if (items[index] && items[index] !== selected) {
                   onChange(items[index]);
                 }
               }}
          >
            {items.map(item => (
              <div 
                key={item} 
                className={`h-10 flex items-center justify-center snap-center text-lg transition-colors cursor-pointer ${item === selected ? 'text-primary font-bold' : 'text-primary/40'}`}
                onClick={(e) => {
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  onChange(item);
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-4 w-full max-w-sm mx-auto">
      <Wheel items={years} selected={value.year} onChange={y => onChange({ ...value, year: y })} label="年" />
      <Wheel items={months} selected={value.month} onChange={m => onChange({ ...value, month: m })} label="月" />
      <Wheel items={days} selected={value.day} onChange={d => onChange({ ...value, day: d })} label="日" />
    </div>
  );
}
