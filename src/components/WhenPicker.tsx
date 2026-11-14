import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function AnchoredPop({ children, watch }: { children: ReactNode; watch?: unknown }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ position: "fixed", zIndex: 80, visibility: "hidden" });
  useLayoutEffect(() => {
    const anchor = anchorRef.current?.parentElement;
    const node = popRef.current;
    if (!anchor || !node) return;
    const zoom = Number(getComputedStyle(document.documentElement).zoom) || 1;
    const rect = anchor.getBoundingClientRect();
    const width = node.offsetWidth;
    const viewW = window.innerWidth / zoom;
    let left = rect.left / zoom;
    const top = rect.bottom / zoom + 6;
    if (left + width > viewW - 8) left = Math.max(8, viewW - width - 8);
    setStyle({ position: "fixed", top, left, zIndex: 80, visibility: "visible" });
  }, [watch]);
  return (
    <>
      <span ref={anchorRef} className="stamp-anchor" />
      {createPortal(<div className="stamp-pop" ref={popRef} style={style}>{children}</div>, document.body)}
    </>
  );
}

export function DateTimePop({
  date,
  time,
  phase,
  onDate,
  onTime,
  onPhase,
  onDone,
}: {
  date: string;
  time: string;
  phase: "date" | "time";
  onDate: (iso: string) => void;
  onTime: (value: string) => void;
  onPhase: (phase: "date" | "time") => void;
  onDone: () => void;
}) {
  const [hour, minute] = (time || "09:00").split(":");
  return (
    <AnchoredPop watch={`${phase}-${date}-${time}`}>
      {phase === "date" ? <MiniCalendar value={date} onChange={onDate} /> : null}
      {phase === "time" ? (
        <div className="clock-pop">
          <div className="clock-face">
            <div className="clock-band" />
            <Wheel options={Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"))} value={(hour || "09").padStart(2, "0")} onChange={(next) => onTime(`${next}:${(minute || "00").padStart(2, "0")}`)} />
            <span className="clock-colon">:</span>
            <Wheel options={Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"))} value={(minute || "00").padStart(2, "0")} onChange={(next) => onTime(`${(hour || "09").padStart(2, "0")}:${next}`)} />
          </div>
          <div className="clock-actions">
            <button type="button" onClick={() => onPhase("date")}>改日期</button>
            <button type="button" onClick={onDone}>完成</button>
          </div>
        </div>
      ) : null}
    </AnchoredPop>
  );
}

function MiniCalendar({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(0), ...Array.from({ length: days }, (_, index) => index + 1)];
  return (
    <div className="calendar lite">
      <div className="calendar-head">
        <button type="button" className="quiet" onClick={() => setCursor(new Date(year, month - 1, 1))}>上月</button>
        <strong>{year}.{month + 1}</strong>
        <button type="button" className="quiet" onClick={() => setCursor(new Date(year, month + 1, 1))}>下月</button>
      </div>
      <div className="calendar-grid">
        {["日", "一", "二", "三", "四", "五", "六"].map((label) => <span key={label} className="calendar-week">{label}</span>)}
        {cells.map((day, index) => {
          if (!day) return <span key={`e-${index}`} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return (
            <button key={iso} type="button" className={`calendar-day${value === iso ? " on" : ""}`} onClick={() => onChange(iso)}>{day}</button>
          );
        })}
      </div>
    </div>
  );
}

function Wheel({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const parent = listRef.current;
    const node = parent?.querySelector<HTMLButtonElement>("button.on");
    if (!parent || !node) return;
    parent.scrollTop = node.offsetTop - parent.clientHeight / 2 + node.clientHeight / 2;
  }, [value]);
  return (
    <div className="clock-col" ref={listRef}>
      {options.map((item) => (
        <button key={item} type="button" className={item === value ? "on" : ""} onClick={() => onChange(item)}>{item}</button>
      ))}
    </div>
  );
}

export function smallDate(value?: string) {
  if (!value) return "选日期";
  const iso = value.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${Number(iso[2])}.${Number(iso[3])}`;
  return value.replace(/\s.*/, "");
}

export function interviewStamp(date?: string, time?: string) {
  if (!date) return "选日期";
  const clock = time && /^\d{1,2}:\d{2}$/.test(time) ? time : "09:00";
  const iso = date.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  const day = iso ? `${Number(iso[2])}月${Number(iso[3])}日` : smallDate(date);
  return `${day} ${clock}`;
}
