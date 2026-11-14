import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { DateTimePop, interviewStamp } from "./WhenPicker";
import { jobById, type Application, type InterviewMode, type InterviewRound, type InterviewRoundResult, type InterviewRoundStatus } from "../data";
import { createRound, roundName, roundWhen } from "../interview";
import { useApp } from "../store";

const statuses: InterviewRoundStatus[] = ["待安排", "已安排", "已完成"];
const results: InterviewRoundResult[] = ["待反馈", "通过", "未通过"];
const modes: InterviewMode[] = ["线上", "线下"];

const reviewFields: { key: keyof InterviewRound["review"]; label: string }[] = [
  { key: "questions", label: "面试问题" },
  { key: "answers", label: "自己的回答" },
  { key: "problems", label: "回答中存在的问题" },
  { key: "gaps", label: "薄弱知识点" },
  { key: "feedback", label: "面试官反馈" },
  { key: "prepare", label: "下一轮准备事项" },
];

function RoundEditor({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: InterviewRound;
  onChange: (round: InterviewRound) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<"date" | "time" | null>(null);
  const patch = (part: Partial<InterviewRound>) => onChange({ ...draft, ...part });
  return (
    <form
      className="round-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <label>
        轮次名称
        <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
      </label>
      <div className="round-field">
        <span>面试时间</span>
        <div className="stamp-wrap round-when">
          <button type="button" className="date-text" onClick={() => setPhase("date")}>
            {interviewStamp(draft.date, draft.time)}
          </button>
          {phase ? (
            <DateTimePop
              date={draft.date}
              time={draft.time || "09:00"}
              phase={phase}
              onPhase={setPhase}
              onDate={(date) => { patch({ date, time: draft.time || "09:00" }); setPhase("time"); }}
              onTime={(time) => patch({ time })}
              onDone={() => setPhase(null)}
            />
          ) : null}
        </div>
      </div>
      <div className="round-field">
        <span>面试形式</span>
        <div className="round-choices">
          {modes.map((mode) => (
            <button key={mode} type="button" className={draft.mode === mode ? "on" : ""} onClick={() => patch({ mode: draft.mode === mode ? "" : mode })}>{mode}</button>
          ))}
        </div>
      </div>
      <label>
        面试官或面试部门
        <input value={draft.interviewer} onChange={(event) => patch({ interviewer: event.target.value })} placeholder="例如：业务一面 / 张老师" />
      </label>
      <label>
        会议链接或面试地址
        <input value={draft.place} onChange={(event) => patch({ place: event.target.value })} placeholder="线上填链接，线下填地址" />
      </label>
      <label>
        备注
        <textarea value={draft.note} onChange={(event) => patch({ note: event.target.value })} />
      </label>
      <div className="round-field">
        <span>状态</span>
        <div className="round-choices">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              className={draft.status === status ? "on" : ""}
              onClick={() => patch({ status, result: status === "已完成" ? draft.result || "待反馈" : "" })}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      {draft.status === "已完成" ? (
        <div className="round-field">
          <span>本轮结果</span>
          <div className="round-choices">
            {results.map((result) => (
              <button key={result} type="button" className={draft.result === result ? "on" : ""} onClick={() => patch({ result })}>{result}</button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="round-review">
        <strong>本轮复盘</strong>
        {reviewFields.map((field) => (
          <label key={field.key}>
            {field.label}
            <textarea value={draft.review[field.key]} onChange={(event) => patch({ review: { ...draft.review, [field.key]: event.target.value } })} />
          </label>
        ))}
      </div>
      <div className="round-form-actions">
        <button type="submit">保存</button>
        <button type="button" onClick={onCancel}>取消</button>
      </div>
    </form>
  );
}

export function InterviewDrawer({ item, onClose }: { item: Application; onClose: () => void }) {
  const { saveInterviewRound, removeInterviewRound, moveInterviewRound } = useApp();
  const job = jobById(item.jobId);
  const rounds = [...(item.rounds ?? [])].sort((a, b) => a.order - b.order);
  const [draft, setDraft] = useState<(InterviewRound & { fresh?: boolean }) | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const done = rounds.filter((round) => round.status === "已完成").length;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    if (!draft) return;
    const round: InterviewRound = {
      id: draft.id,
      order: draft.order,
      name: draft.name.trim() || roundName(draft.order),
      date: draft.date,
      time: draft.time,
      mode: draft.mode,
      interviewer: draft.interviewer,
      place: draft.place,
      note: draft.note,
      status: draft.status,
      result: draft.result,
      review: draft.review,
    };
    if (saveInterviewRound(item.id, round)) setDraft(null);
  };

  const startAdd = () => {
    const order = rounds.length + 1;
    setPendingDelete(null);
    setDraft({ ...createRound(order), fresh: true });
  };

  return createPortal(
    <div className="interview-shade" onMouseDown={onClose}>
      <aside className="interview-drawer" role="dialog" aria-modal="true" aria-label="面试详情" onMouseDown={(event) => event.stopPropagation()}>
        <header className="interview-drawer-head">
          <div>
            <strong>{job?.company.split("·")[0] ?? "面试详情"}</strong>
            <p>{job?.title}</p>
          </div>
          <button type="button" className="interview-close" aria-label="关闭" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="interview-drawer-body">
          <section>
            <h3>面试进度</h3>
            <p className="interview-hint">收到下一轮通知后再添加。这里不会预填还没发生的轮次。</p>
            <p className="interview-count">已完成 {done} 轮</p>
            <ol className="round-line">
              {rounds.map((round, index) => (
                <li key={round.id} className={round.status === "已完成" ? "done" : "plan"}>
                  {draft?.id === round.id ? (
                    <RoundEditor draft={draft} onChange={setDraft} onSave={save} onCancel={() => setDraft(null)} />
                  ) : (
                    <div className="round-node-body">
                      <div className="round-node-top">
                        <strong>{round.name}</strong>
                        <span className={`round-status is-${round.status}`}>{round.status}</span>
                        {round.status === "已完成" && round.result ? <span className={`round-status is-${round.result}`}>{round.result}</span> : null}
                      </div>
                      <p>{roundWhen(round)}</p>
                      <p className="round-meta">
                        {[round.mode, round.interviewer, round.place].filter(Boolean).join(" · ") || "形式和面试官还没写"}
                      </p>
                      {round.note ? <p>{round.note}</p> : null}
                      {round.review.problems ? <p className="round-echo">复盘：{round.review.problems}</p> : null}
                      <div className="round-ops">
                        <button type="button" onClick={() => { setDraft({ ...round, review: { ...round.review } }); setPendingDelete(null); }}>编辑</button>
                        {index > 0 ? <button type="button" onClick={() => moveInterviewRound(item.id, round.id, -1)}>上移</button> : null}
                        {index < rounds.length - 1 ? <button type="button" onClick={() => moveInterviewRound(item.id, round.id, 1)}>下移</button> : null}
                        {pendingDelete === round.id ? (
                          <>
                            <span>删除这一轮？</span>
                            <button type="button" onClick={() => { removeInterviewRound(item.id, round.id); setPendingDelete(null); }}>删除</button>
                            <button type="button" onClick={() => setPendingDelete(null)}>取消</button>
                          </>
                        ) : (
                          <button type="button" onClick={() => setPendingDelete(round.id)}>删除</button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            {draft?.fresh ? <RoundEditor draft={draft} onChange={setDraft} onSave={save} onCancel={() => setDraft(null)} /> : null}
            {draft?.fresh ? null : (
              <button type="button" className="round-add" onClick={startAdd}>+ 添加下一轮面试</button>
            )}
          </section>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
