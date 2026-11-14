import { useEffect, useState } from "react";
import { Check, FileText, GraduationCap, Layers, Send, Sparkles, User, X } from "lucide-react";
import { jobFacts, nameStyles, resumeFileName } from "../catalog";
import type { Job } from "../data";
import { useApp } from "../store";

function styleIcon(id: string) {
  if (id === "name-role") return User;
  if (id === "role") return Layers;
  if (id === "major-role") return GraduationCap;
  return FileText;
}

export function ApplyPickDialog({ job, onClose }: { job: Job; onClose: () => void }) {
  const { resumes, currentResumeId, currentDraftId, nameStyleId, markPending, profile } = useApp();
  const [resumeId, setResumeId] = useState(currentResumeId);
  const [draftId, setDraftId] = useState(currentDraftId);
  const [styleId, setStyleId] = useState(nameStyleId);
  const resume = resumes.find((item) => item.id === resumeId) ?? resumes[0];
  const drafts = resume?.drafts ?? [];
  const activeDraftId = drafts.some((item) => item.id === draftId) ? draftId : drafts[0]?.id ?? "";
  const draft = drafts.find((item) => item.id === activeDraftId);
  const style = nameStyles.find((item) => item.id === styleId) ?? nameStyles[0];
  const ready = Boolean(resume && activeDraftId && style);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function go() {
    if (!resume || !activeDraftId) return;
    const facts = jobFacts(job);
    markPending(job.id, { resumeId: resume.id, draftId: activeDraftId, nameStyleId: styleId });
    const opened = window.open(facts.sourceUrl, "_blank", "noopener,noreferrer");
    onClose();
    if (!opened) window.setTimeout(() => document.dispatchEvent(new Event("visibilitychange")), 0);
  }

  const summary = [resume?.name, draft?.label, style?.label].filter(Boolean).join(" · ");

  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="apply-pick-title">
      <div className="modal apply-pick">
        <div className="apply-head">
          <span className="apply-badge" aria-hidden="true"><FileText size={18} /></span>
          <div className="apply-head-copy">
            <h2 id="apply-pick-title">选择投递简历</h2>
            <p>目标岗位 · {job.title}</p>
          </div>
          <button className="apply-x" type="button" aria-label="关闭" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="apply-body">
          <section className="apply-block">
            <h3>简历类型</h3>
            <div className="apply-types" role="group" aria-label="简历类型">
              {resumes.map((item) => {
                const on = item.id === resume?.id;
                return (
                  <button key={item.id} type="button" className={on ? "on" : ""} aria-pressed={on} onClick={() => setResumeId(item.id)}>
                    {item.name}
                    {on ? <Check size={14} /> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="apply-block">
            <h3>选择版本</h3>
            <div className="apply-rows" role="group" aria-label="选择版本">
              {drafts.map((item) => {
                const on = item.id === activeDraftId;
                const when = item.savedAt?.trim();
                return (
                  <button key={item.id} type="button" className={`apply-row${on ? " on" : ""}`} aria-pressed={on} onClick={() => setDraftId(item.id)}>
                    <span className="apply-ico" aria-hidden="true"><FileText size={16} /></span>
                    <span className="apply-copy">
                      <strong>{item.label}</strong>
                      {when ? <span>更新于 {when}</span> : null}
                    </span>
                    {on ? <Check className="apply-check" size={16} /> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="apply-block">
            <h3>简历名称</h3>
            <div className="apply-rows" role="group" aria-label="简历名称">
              {nameStyles.map((item) => {
                const on = item.id === styleId;
                const Icon = styleIcon(item.id);
                const example = resume ? resumeFileName(item.id, resume.name, profile) : "";
                return (
                  <button key={item.id} type="button" className={`apply-row${on ? " on" : ""}`} aria-pressed={on} onClick={() => setStyleId(item.id)}>
                    <span className="apply-ico" aria-hidden="true"><Icon size={16} /></span>
                    <span className="apply-copy">
                      <strong>{item.label}</strong>
                      {example ? <span>示例：{example}</span> : null}
                    </span>
                    {on ? <Check className="apply-check" size={16} /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="apply-now">
          <Sparkles size={16} aria-hidden="true" />
          <b>当前选择</b>
          <span>{summary}</span>
        </div>

        <div className="apply-actions">
          <button className="apply-cancel" type="button" onClick={onClose}>取消</button>
          <button className="apply-go" type="button" onClick={go} disabled={!ready}><Send size={14} /> 去投递</button>
        </div>
      </div>
    </div>
  );
}
