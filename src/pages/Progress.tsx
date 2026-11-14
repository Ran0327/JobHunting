import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS as DndCSS, type Transform } from "@dnd-kit/utilities";
import { BadgeCheck, Banknote, Building2, CalendarDays, Car, ChevronDown, Columns2, House, Laptop, PenLine, Scale, Send, X } from "lucide-react";
import { InterviewDrawer } from "../components/InterviewDrawer";
import { RichText } from "../components/RichText";
import { jobById, stages, type Application, type Job, type Stage } from "../data";
import { roundWhen } from "../interview";
import { useApp } from "../store";

const stageIcon = { 已投递: Send, 笔试: PenLine, 面试: CalendarDays, Offer: BadgeCheck, 未通过: X };

const offerRows: { label: string; icon: typeof Banknote; cell: (job: Job) => ReactNode }[] = [
  {
    label: "薪资构成",
    icon: Banknote,
    cell: (job) => (
      <ul className="compare-lines">
        {job.parts.slice(0, 3).map((part) => (
          <li key={part.label}><span>{part.label}</span><span>{part.value}</span></li>
        ))}
      </ul>
    ),
  },
  {
    label: "工作内容",
    icon: Laptop,
    cell: (job) => (
      <ul className="compare-points">
        {job.duties.map((item) => <li key={item}>{item}</li>)}
      </ul>
    ),
  },
  { label: "公司规模", icon: Building2, cell: (job) => job.size },
  { label: "通勤", icon: Car, cell: (job) => job.commute },
  { label: "家庭", icon: House, cell: (job) => job.family },
];

const forward: Partial<Record<Stage, Stage>> = { 已投递: "笔试", 笔试: "面试", 面试: "Offer" };

function OfferPick({ label, value, options, onChange }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLabelElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const current = options.find((item) => item.id === value);
  return (
    <label className="drop-field offer-pick" ref={rootRef}>
      <span>{label}</span>
      <button className={`drop cascade-trigger${current ? " picked" : ""}`} type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen((prev) => !prev)}>
        <span>{current?.label ?? "请选择"}</span>
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="cascade menu">
          <div className="cascade-col">
            <button type="button" className={value === "" ? "on" : ""} onClick={() => { onChange(""); setOpen(false); }}><span>请选择</span></button>
            {options.map((item) => (
              <button key={item.id} type="button" className={item.id === value ? "on" : ""} onClick={() => { onChange(item.id); setOpen(false); }}>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </label>
  );
}

export function Progress() {
  const { applications, setStage, markViewed, placeApplication } = useApp();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [slots, setSlots] = useState(["", "", ""]);
  const detail = applications.find((item) => item.id === detailId) ?? null;
  const offers = applications.filter((item) => item.stage === "Offer").map((item) => ({ item, job: jobById(item.jobId) })).filter((row) => row.job);
  const picked = slots.filter(Boolean);
  const unique = [...new Set(picked)];
  const ready = unique.length >= 2;
  const chosen = unique.flatMap((id) => {
    const row = offers.find((item) => item.job!.id === id);
    return ready && row?.job ? [row] : [];
  });

  return (
    <div className="stack">
      {offers.length > 0 ? (
        <article className="card glass-read offer-board">
          <div className="section-title">
            <h2 className="with-icon"><Scale size={16} /> 已收到的offer</h2>
            <span className="hint">薪资构成、工作内容、规模、通勤、家庭</span>
          </div>
          <div className="offer-picks">
            {["职位一", "职位二", "职位三"].map((label, index) => (
              <OfferPick
                key={label}
                label={label}
                value={slots[index]}
                options={offers.map(({ job }) => ({ id: job!.id, label: `${job!.company.split("·")[0]} · ${job!.title}` }))}
                onChange={(id) => setSlots((current) => current.map((item, place) => place === index ? id : item))}
              />
            ))}
          </div>
          {ready ? (
            <>
              <div className="compare-wrap mt">
                <table className="compare">
                  <thead>
                    <tr>
                      <th><span className="row-label"><Columns2 size={15} />比较项</span></th>
                      {chosen.map(({ job }) => (
                        <th key={job!.id}><span className="row-label"><BadgeCheck size={15} />{job!.company.split("·")[0]}</span></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {offerRows.map((row) => {
                      const Icon = row.icon;
                      return (
                        <tr key={row.label}>
                          <th><span className="row-label"><Icon size={15} />{row.label}</span></th>
                          {chosen.map(({ job }) => <td key={job!.id}>{row.cell(job!)}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="hint mt"><RichText text="家庭约束是硬条件时，同城且书面条款清楚的一份优先。还没签之前用邮件说明不去；已经签约再谈解约和违约金。" /></div>
            </>
          ) : <p className="hint mt">{picked.length >= 2 ? "请选择不同的职位。" : "选择至少两个职位后，再显示对比。职位三可以不选。"}</p>}
        </article>
      ) : null}

      <article className="card glass-read">
        <h2 className="with-icon"><CalendarDays size={16} /> 面试日程</h2>
        <div className="schedule-list mt">
          {applications.flatMap((item) => (item.stage === "面试" ? (item.rounds ?? []).filter((round) => round.date) : [])).length === 0 ? <p className="hint">还没有写进日程的面试。打开面试详情，为某一轮填上日期。</p> : null}
          {applications.flatMap((item) =>
            item.stage === "面试"
              ? [...(item.rounds ?? [])].filter((round) => round.date).sort((a, b) => a.order - b.order).map((round) => {
                  const job = jobById(item.jobId);
                  return (
                    <p key={round.id} className="schedule-row">
                      <span className="date-text">{roundWhen(round)}</span>
                      <span>{job?.company.split("·")[0]}</span>
                      <span>{round.name}</span>
                    </p>
                  );
                })
              : [],
          )}
        </div>
      </article>

      <ProgressBoard
        applications={applications}
        setStage={setStage}
        markViewed={markViewed}
        placeApplication={placeApplication}
        onOpenInterview={setDetailId}
      />
      {detail ? <InterviewDrawer item={detail} onClose={() => setDetailId(null)} /> : null}
    </div>
  );
}

const stageNames = new Set<string>(stages);

class BoardPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => nativeEvent.isPrimary && nativeEvent.button === 0 && nativeEvent.pointerType !== "touch",
    },
  ];
}

const boardCollision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const cards = hits.filter((hit) => !stageNames.has(String(hit.id)));
  return cards.length > 0 ? cards : hits;
};

function pageZoom() {
  const raw = getComputedStyle(document.documentElement).zoom;
  if (!raw || raw === "normal") return 1;
  const value = raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function boardTransform(transform: Transform | null) {
  if (!transform) return undefined;
  const zoom = pageZoom();
  return DndCSS.Transform.toString({ ...transform, x: transform.x / zoom, y: transform.y / zoom });
}

function columnsOf(list: Application[]) {
  const columns = Object.fromEntries(stages.map((stage) => [stage, [] as string[]])) as Record<Stage, string[]>;
  for (const item of list) {
    if (jobById(item.jobId)) columns[item.stage].push(item.id);
  }
  return columns;
}

function columnOf(columns: Record<Stage, string[]>, id: string): Stage | null {
  for (const stage of stages) {
    if (columns[stage].includes(id)) return stage;
  }
  return stageNames.has(id) ? (id as Stage) : null;
}

function pointerPoint(event: Event | null) {
  if (!event) return null;
  if ("clientX" in event) {
    const point = event as PointerEvent;
    return { x: point.clientX, y: point.clientY };
  }
  const touch = (event as TouchEvent).touches?.[0] ?? (event as TouchEvent).changedTouches?.[0];
  return touch ? { x: touch.clientX, y: touch.clientY } : null;
}

function keepClick(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function InterviewBrief({ item, onOpen }: { item: Application; onOpen: () => void }) {
  const rounds = [...(item.rounds ?? [])].sort((a, b) => a.order - b.order);
  const done = rounds.filter((round) => round.status === "已完成").length;
  const latest = rounds[rounds.length - 1];
  return (
    <div className="round-brief">
      <span>面试进度</span>
      <div className={`round-pips${done === 0 ? " is-empty" : ""}`} aria-label={`已完成 ${done} 轮`}>
        {Array.from({ length: done }, (_, index) => <i key={index} className="on" />)}
      </div>
      <p>已完成 {done} 轮</p>
      <p className="round-recent">{latest ? `最近一轮：${latest.name} · ${latest.status}` : "还没有面试轮次"}</p>
      <button type="button" className="round-open" onPointerDown={keepClick} onClick={onOpen}>查看面试详情 →</button>
    </div>
  );
}

function CardBody({
  item,
  setStage,
  markViewed,
  onOpenInterview,
}: {
  item: Application;
  setStage: (id: string, stage: Stage) => void;
  markViewed: (id: string) => void;
  onOpenInterview: (id: string) => void;
}) {
  const job = jobById(item.jobId);
  if (!job) return null;
  const next = forward[item.stage];
  return (
    <>
      <strong>{job.company.split("·")[0]}</strong>
      <p>{job.title}</p>
      {item.stage === "面试" ? <InterviewBrief item={item} onOpen={() => onOpenInterview(item.id)} /> : (
        <>
          <RichText text={item.note} />
          <RichText text={item.next} />
        </>
      )}
      <div className="text-row" onPointerDown={keepClick}>
        <Link className="quiet" to={`/jobs/${job.id}`}>职位</Link>
        {item.stage === "已投递" && !item.viewed ? <button className="quiet" type="button" onClick={() => markViewed(item.id)}>标记已查看</button> : null}
        {next ? <button className="quiet" type="button" onClick={() => setStage(item.id, next)}>进入{next}</button> : null}
        {item.stage !== "未通过" && item.stage !== "Offer" ? <button className="quiet" type="button" onClick={() => setStage(item.id, "未通过")}>未通过</button> : null}
      </div>
    </>
  );
}

function SortableCard(props: {
  item: Application;
  setStage: (id: string, stage: Stage) => void;
  markViewed: (id: string) => void;
  onOpenInterview: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: boardTransform(transform), transition: isDragging ? undefined : transition }}
      className={`progress-card${isDragging ? " is-ghost" : ""}`}
      data-board-card={props.item.id}
      {...attributes}
      {...listeners}
    >
      <CardBody {...props} />
    </article>
  );
}

function StageColumn({
  stage,
  ids,
  highlight,
  count,
  children,
}: {
  stage: Stage;
  ids: string[];
  highlight: boolean;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: stage });
  const StageIcon = stageIcon[stage];
  return (
    <section ref={setNodeRef} className={`column${highlight ? " is-over" : ""}`} data-stage={stage}>
      <h3 className="with-icon"><StageIcon size={15} /> {stage} <span className="num">{count}</span></h3>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="stack">{children}</div>
      </SortableContext>
    </section>
  );
}

function ProgressBoard({
  applications,
  setStage,
  markViewed,
  placeApplication,
  onOpenInterview,
}: {
  applications: Application[];
  setStage: (id: string, stage: Stage) => void;
  markViewed: (id: string) => void;
  placeApplication: (id: string, stage: Stage, index: number) => boolean;
  onOpenInterview: (id: string) => void;
}) {
  const [live, setLive] = useState<Record<Stage, string[]> | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);
  const [origin, setOrigin] = useState<Stage | null>(null);
  const liveRef = useRef<Record<Stage, string[]> | null>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const following = useRef(false);
  const settleTimer = useRef<number | null>(null);
  const originRect = useRef<{ left: number; top: number } | null>(null);
  const pointer = useRef({ x: 0, y: 0, width: 0 });
  const grab = useRef({ dx: 0, dy: 0 });
  const sensors = useSensors(
    useSensor(BoardPointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );
  const columns = live ?? columnsOf(applications);
  const activeItem = activeId ? applications.find((item) => item.id === activeId) ?? null : null;

  const moveLift = (x: number, y: number, animate: boolean) => {
    const node = liftRef.current;
    if (!node) return;
    const zoom = pageZoom();
    node.style.width = `${pointer.current.width}px`;
    node.style.transition = animate ? "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none";
    node.style.transform = `translate3d(${x / zoom}px, ${y / zoom}px, 0) scale(1.02) rotate(1.2deg)`;
  };

  useLayoutEffect(() => {
    if (!activeId) return;
    moveLift(pointer.current.x, pointer.current.y, false);
  }, [activeId]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!following.current) return;
      pointer.current.x = event.clientX - grab.current.dx;
      pointer.current.y = event.clientY - grab.current.dy;
      moveLift(pointer.current.x, pointer.current.y, false);
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    document.body.classList.add("is-card-dragging");
    return () => document.body.classList.remove("is-card-dragging");
  }, [activeId]);

  const settle = (x?: number, y?: number) => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    if (x == null || y == null) {
      setActiveId(null);
      setOverStage(null);
      liveRef.current = null;
      setLive(null);
      return;
    }
    moveLift(x, y, true);
    settleTimer.current = window.setTimeout(() => {
      setActiveId(null);
      setOverStage(null);
      liveRef.current = null;
      setLive(null);
      setOrigin(null);
    }, 190);
  };

  const onDragStart = (event: DragStartEvent) => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    const id = String(event.active.id);
    const next = columnsOf(applications);
    liveRef.current = next;
    const home = columnOf(next, id);
    setOrigin(home);
    setLive(next);
    setActiveId(id);
    const node = document.querySelector(`[data-board-card="${window.CSS.escape(id)}"]`);
    const own = node?.getBoundingClientRect();
    const point = pointerPoint(event.activatorEvent);
    if (node && own && node instanceof HTMLElement) {
      originRect.current = { left: own.left, top: own.top };
      pointer.current = { x: own.left, y: own.top, width: node.offsetWidth };
      if (point) grab.current = { dx: point.x - own.left, dy: point.y - own.top };
    }
    following.current = true;
  };

  const onDragOver = (event: DragOverEvent) => {
    const current = liveRef.current;
    if (!current || !event.over) {
      setOverStage(null);
      return;
    }
    const id = String(event.active.id);
    const overId = String(event.over.id);
    const from = columnOf(current, id);
    const to = columnOf(current, overId);
    setOverStage(to);
    if (!from || !to || from === to) return;
    const fromItems = current[from].filter((item) => item !== id);
    const toItems = current[to].filter((item) => item !== id);
    let index = toItems.length;
    if (!stageNames.has(overId)) {
      const overIndex = toItems.indexOf(overId);
      const activeRect = event.active.rect.current.translated;
      const overRect = event.over.rect;
      const below = Boolean(activeRect && overRect && activeRect.top > overRect.top + overRect.height / 2);
      index = overIndex >= 0 ? overIndex + (below ? 1 : 0) : toItems.length;
    }
    const next = {
      ...current,
      [from]: fromItems,
      [to]: [...toItems.slice(0, index), id, ...toItems.slice(index)],
    };
    liveRef.current = next;
    setLive(next);
  };

  const onDragEnd = (event: DragEndEvent) => {
    following.current = false;
    const id = String(event.active.id);
    const current = liveRef.current;
    const originPoint = originRect.current;
    if (!current || !event.over) {
      liveRef.current = null;
      setLive(null);
      settle(originPoint?.left, originPoint?.top);
      return;
    }
    let next = current;
    const overId = String(event.over.id);
    const stage = columnOf(next, id);
    const overColumn = columnOf(next, overId);
    if (stage && overColumn === stage && overId !== id && !stageNames.has(overId)) {
      const items = next[stage];
      const oldIndex = items.indexOf(id);
      const newIndex = items.indexOf(overId);
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        next = { ...next, [stage]: arrayMove(items, oldIndex, newIndex) };
        liveRef.current = next;
        setLive(next);
      }
    }
    const home = columnOf(next, id);
    if (!home) {
      liveRef.current = null;
      setLive(null);
      settle(originPoint?.left, originPoint?.top);
      return;
    }
    const saved = placeApplication(id, home, next[home].indexOf(id));
    const node = document.querySelector(`[data-board-card="${window.CSS.escape(id)}"]`);
    const rect = node?.getBoundingClientRect();
    if (!saved) {
      liveRef.current = null;
      setLive(null);
      settle(originPoint?.left, originPoint?.top);
      return;
    }
    settle(rect?.left ?? originPoint?.left, rect?.top ?? originPoint?.top);
  };

  const onDragCancel = () => {
    following.current = false;
    const originPoint = originRect.current;
    liveRef.current = null;
    setLive(null);
    settle(originPoint?.left, originPoint?.top);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={boardCollision}
        autoScroll
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className={`board${activeId ? " is-sorting" : ""}`}>
          {stages.map((stage) => (
            <StageColumn key={stage} stage={stage} ids={columns[stage]} count={columns[stage].length} highlight={Boolean(activeId && overStage === stage && origin !== stage)}>
              {columns[stage].map((id) => {
                const item = applications.find((row) => row.id === id);
                if (!item) return null;
                return (
                  <SortableCard
                    key={item.id}
                    item={item}
                    setStage={setStage}
                    markViewed={markViewed}
                    onOpenInterview={onOpenInterview}
                  />
                );
              })}
            </StageColumn>
          ))}
        </div>
      </DndContext>
      {activeItem
        ? createPortal(
            <div className="board-lift" ref={liftRef}>
              <article className="progress-card">
                <CardBody
                  item={activeItem}
                  setStage={setStage}
                  markViewed={markViewed}
                  onOpenInterview={onOpenInterview}
                />
              </article>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
