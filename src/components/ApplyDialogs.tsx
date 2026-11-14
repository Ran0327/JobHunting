import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, X } from "lucide-react";
import { jobById, type Application, type Stage } from "../data";
import { jobFacts, resumeFileName } from "../catalog";
import { AnchoredPop, DateTimePop, interviewStamp } from "./WhenPicker";
import { useApp } from "../store";

const EIGHT_HOURS = 8 * 60 * 60 * 1000;

const checks = ["已投递", "企业已查看", "进入笔试", "接到面试", "拿到 Offer"] as const;

type Status = (typeof checks)[number];

function statusFrom(item: Application): Status {
  if (item.stage === "Offer") return "拿到 Offer";
  if (item.stage === "面试") return "接到面试";
  if (item.stage === "笔试") return "进入笔试";
  if (item.viewed) return "企业已查看";
  return "已投递";
}

function stageFromStatus(status: Status): { stage: Stage; viewed: boolean } {
  if (status === "拿到 Offer") return { stage: "Offer", viewed: true };
  if (status === "接到面试") return { stage: "面试", viewed: true };
  if (status === "进入笔试") return { stage: "笔试", viewed: true };
  if (status === "企业已查看") return { stage: "已投递", viewed: true };
  return { stage: "已投递", viewed: false };
}

function StatusPick({ value, onChange, pop }: { value: Status; onChange: (status: Status) => void; pop?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (wrapRef.current?.contains(target) || target.closest(".status-menu")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="stamp-wrap status-slot" ref={wrapRef}>
      <button className={`status-box${open ? " open" : ""}`} type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((prev) => !prev)}>{value}</button>
      {open ? (
        <AnchoredPop watch={value}>
          <div className="status-menu" role="listbox">
            {checks.map((label) => (
              <button key={label} type="button" role="option" aria-selected={label === value} className={label === value ? "on" : ""} onClick={() => { onChange(label); setOpen(false); }}>{label}</button>
            ))}
          </div>
        </AnchoredPop>
      ) : pop}
    </div>
  );
}

export function ApplyDialogs() {
  const { applications, resumes, profile, pendingJobId, pendingPick, lastChecklistAt, confirmPending, ackChecklist, syncProgress } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { status: Status; interviewAt: string; interviewTime: string; phase: "date" | "time" | null }>>({});

  const due = applications.length > 0 && Date.now() - lastChecklistAt >= EIGHT_HOURS;

  useEffect(() => {
    if (due) setChecklistOpen(true);
  }, [due]);

  useEffect(() => {
    if (!pendingJobId) return;
    const onVis = () => {
      if (document.visibilityState === "visible") setConfirmOpen(true);
    };
    document.addEventListener("visibilitychange", onVis);
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") setConfirmOpen(true);
    }, 800);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearTimeout(timer);
    };
  }, [pendingJobId]);

  useEffect(() => {
    if (!checklistOpen) return;
    const next: typeof drafts = {};
    applications.forEach((item) => {
      next[item.id] = { status: statusFrom(item), interviewAt: item.interviewAt ?? "", interviewTime: item.interviewTime ?? "", phase: null };
    });
    setDrafts(next);
  }, [checklistOpen]);

  const pendingJob = pendingJobId ? jobById(pendingJobId) : undefined;
  const pickedResume = resumes.find((item) => item.id === pendingPick?.resumeId);
  const pickedDraft = pickedResume?.drafts?.find((item) => item.id === pendingPick?.draftId);
  const pickedName = pendingPick && pickedResume ? resumeFileName(pendingPick.nameStyleId, pickedResume.name, profile) : "";

  function saveChecklist() {
    applications.forEach((item) => {
      const row = drafts[item.id];
      if (!row) return;
      const next = stageFromStatus(row.status);
      syncProgress(item.id, {
        viewed: next.viewed,
        stage: next.stage,
        interviewAt: row.status === "接到面试" ? row.interviewAt : undefined,
        interviewTime: row.status === "接到面试" && row.interviewAt ? (row.interviewTime || "09:00") : undefined,
      });
    });
    ackChecklist();
    setChecklistOpen(false);
  }

  return (
    <>
      {confirmOpen && pendingJob ? (
        <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="apply-confirm-title">
          <div className="modal glass-read">
            <div className="between">
              <h2 id="apply-confirm-title">是否已经投递？</h2>
              <button className="icon-btn" type="button" aria-label="关闭" onClick={() => { setConfirmOpen(false); confirmPending(false); }}><X size={16} /></button>
            </div>
            <p className="plain mt">{pendingJob.company} · {pendingJob.title}</p>
            <p className="hint mt">信息来源：{jobFacts(pendingJob).source}。第三方平台的状态不会自动回来，所以要你确认这一次。</p>
            {pickedResume ? <p className="plain mt">这次选择的是 {pickedResume.name} · {pickedDraft?.label ?? "版本一"}，文件名「{pickedName}」。</p> : null}
            <div className="detail-actions mt">
              <button className="btn btn-ghost" type="button" onClick={() => { setConfirmOpen(false); confirmPending(false); }}>否，还没投</button>
              <button className="btn btn-primary" type="button" onClick={() => { setConfirmOpen(false); confirmPending(true); }}>是，已投递</button>
            </div>
          </div>
        </div>
      ) : null}

      {checklistOpen ? (
        <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="check-title">
          <div className="modal glass-read checklist-modal">
            <div className="between">
              <h2 id="check-title"><CalendarDays size={18} /> 进度清单</h2>
              <button className="icon-btn" type="button" aria-label="关闭" onClick={() => { ackChecklist(); setChecklistOpen(false); }}><X size={16} /></button>
            </div>
            <p className="hint mt">选到「接到面试」后，先点日期，再选具体时间。点错了可以再点日期重选。</p>
            <div className="checklist">
              {applications.map((item) => {
                const job = jobById(item.jobId);
                const row = drafts[item.id] ?? { status: statusFrom(item), interviewAt: item.interviewAt ?? "", interviewTime: item.interviewTime ?? "", phase: null };
                return (
                  <article key={item.id} className="check-line">
                    <strong>{job?.company.split("·")[0]} · {job?.title}</strong>
                    <StatusPick
                      value={row.status}
                      onChange={(status) => setDrafts((prev) => ({ ...prev, [item.id]: { ...(prev[item.id] ?? row), status, phase: status === "接到面试" ? "date" : null } }))}
                      pop={row.status === "接到面试" && row.phase ? (
                        <DateTimePop
                          date={row.interviewAt}
                          time={row.interviewTime || "09:00"}
                          phase={row.phase}
                          onPhase={(phase) => setDrafts((prev) => ({ ...prev, [item.id]: { ...row, phase } }))}
                          onDate={(interviewAt) => setDrafts((prev) => ({ ...prev, [item.id]: { ...row, interviewAt, interviewTime: row.interviewTime || "09:00", phase: "time" } }))}
                          onTime={(interviewTime) => setDrafts((prev) => ({ ...prev, [item.id]: { ...row, interviewTime, phase: "time" } }))}
                          onDone={() => setDrafts((prev) => ({ ...prev, [item.id]: { ...row, interviewTime: row.interviewTime || "09:00", phase: null } }))}
                        />
                      ) : null}
                    />
                    <span className="date-slot">
                      {row.status === "接到面试" ? (
                        <button className="date-text" type="button" onClick={() => setDrafts((prev) => ({ ...prev, [item.id]: { ...row, phase: "date" } }))}>
                          {interviewStamp(row.interviewAt, row.interviewTime)}
                        </button>
                      ) : null}
                    </span>
                  </article>
                );
              })}
            </div>
            <button className="quiet mt" type="button" onClick={saveChecklist}>写入看板</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
