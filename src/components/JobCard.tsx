import { Link } from "react-router-dom";
import { Building2, ExternalLink, Send, Star } from "lucide-react";
import { jobFacts } from "../catalog";
import { matchScore, type Job } from "../data";
import { useApp } from "../store";

function metaLine(text: string) {
  const parts = text.split(/(?<=，)|(?<=,)/).filter(Boolean);
  if (parts.length < 2) return text;
  return parts.map((part, index) => (
    index === 0 ? <span key={index}>{part}</span> : <span key={index} className="meta-tail">{part.replace(/^\s+/, "")}</span>
  ));
}

function tone(label: string) {
  if (label === "直招" || label === "校招" || label === "低" || label === "BOSS直聘") return "tone-indigo";
  if (label === "实习" || label === "智联招聘") return "tone-sky";
  if (label === "外包" || label === "中" || label === "社招") return "tone-amber";
  if (label === "中介" || label === "培训" || label === "高") return "tone-rose";
  return "tone-slate";
}

export function JobCard({ job, showApply = true, onApply }: { job: Job; showApply?: boolean; onApply?: (job: Job) => void }) {
  const { favorites, applications, toggleFavorite } = useApp();
  const facts = jobFacts(job);
  const record = showApply ? applications.find((item) => item.jobId === job.id) : undefined;
  const saved = favorites.includes(job.id);

  return (
    <article className="job-card glass-read">
      <div>
        <h3><Link to={`/jobs/${job.id}`}>{job.title}</Link></h3>
        <p className="job-meta"><Building2 size={14} /> <span>{metaLine(`${job.company} · ${job.salary} · ${job.commute}`)}</span></p>
        <p className="hint"><ExternalLink size={14} /> 信息来源：{facts.source}</p>
        <div className="tags">
          <span className={`badge ${tone(facts.source)}`}>{facts.source}</span>
          <span className={`badge ${tone(job.employment)}`}>{job.employment}</span>
          <span className={`badge ${tone(job.risk)}`}>风险{job.risk}</span>
          <span className="badge tone-slate">匹配 {matchScore(job)}</span>
          {record ? <span className="badge tone-green">{record.stage}</span> : null}
        </div>
        <p className="hint">{job.riskText}</p>
      </div>
      <div className="job-actions">
        <button className={`star-quiet${saved ? " on" : ""}`} type="button" aria-label={saved ? "取消收藏" : "收藏"} onClick={() => toggleFavorite(job.id)}>
          <Star size={16} fill={saved ? "currentColor" : "none"} />
        </button>
        {showApply ? (
          record ? (
            <span className="tip" data-tip="已投递">
              <button className="plane-mark sent" type="button" disabled aria-label="已投递">
                <Send size={16} />
              </button>
            </span>
          ) : (
            <button className="plane-mark tip" type="button" data-tip="投递简历" aria-label="投递简历" onClick={() => onApply?.(job)}>
              <Send size={16} />
            </button>
          )
        ) : null}
      </div>
    </article>
  );
}
