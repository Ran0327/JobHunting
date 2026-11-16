import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Banknote, Briefcase, Car, ExternalLink, House, MessagesSquare, Send, Sparkles, Star, UserRound } from "lucide-react";
import { ApplyPickDialog } from "../components/ApplyPickDialog";
import { Highlight, RichText } from "../components/RichText";
import { jobFacts } from "../catalog";
import { jobById, matchScore, type Job } from "../data";
import { jobPostings } from "../postings";
import { useApp } from "../store";

export function JobDetail() {
  const { id = "" } = useParams();
  const job = jobById(id);
  const navigate = useNavigate();
  const { favorites, applications, profile, toggleFavorite, addDirectedResume, notify, deepJobs, agreeDeep } = useApp();
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const record = applications.find((item) => item.jobId === id);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!job) {
    return (
      <article className="card glass-read">
        <Link to="/jobs" className="back"><ArrowLeft size={16} /> 返回职位</Link>
        <p>没有找到这个职位。</p>
      </article>
    );
  }

  const fields = [
    ["姓名", profile.name],
    ["手机", profile.phone],
    ["邮箱", profile.email],
    ["学校", profile.school],
    ["学历", profile.major],
    ["毕业时间", profile.cohort],
    ["城市", profile.city],
    ["意向", job.title],
    ["一段经历", job.tags.includes("产品") ? "技术部招新：访谈 8 名新生，入部转化 18% → 35%。" : "检索演示台：查询等待从 1.4 秒降到 0.5 秒，课题组内部使用。"],
  ];

  return (
    <div className="stack">
      <article className="card glass-read">
        <Link to="/jobs" className="back"><ArrowLeft size={16} /> 返回职位</Link>
        <div className="detail-head">
          <div>
            <h2>{job.title}</h2>
            <p className="job-meta mt">{job.company} · {job.size} · {job.salary}</p>
            <p className="hint mt"><ExternalLink size={14} /> 信息来源：{jobFacts(job).source}</p>
            {job.aliases.length ? <p className="hint mt">相近名称：{job.aliases.join("、")}</p> : null}
            <div className="tags">
              <span className="badge tone-indigo">{job.employment}</span>
              <span className="badge tone-slate">{job.recruit}</span>
              <span className={`badge ${job.risk === "高" ? "tone-rose" : job.risk === "中" ? "tone-amber" : "tone-green"}`}>风险{job.risk}</span>
              <span className="badge tone-slate">匹配 {matchScore(job)}</span>
            </div>
          </div>
          <div className="detail-actions">
            <button className={`icon-btn${favorites.includes(job.id) ? " on" : ""}`} type="button" aria-label="收藏" onClick={() => toggleFavorite(job.id)}>
              <Star size={16} fill={favorites.includes(job.id) ? "currentColor" : "none"} />
            </button>
            <button className="quiet" type="button" onClick={() => setOpen(true)}>预填网申</button>
            <button className="quiet" type="button" onClick={() => { addDirectedResume(job); navigate("/resumes"); }}>生成定向简历</button>
            <button className={`plane-mark tip${record ? " sent" : ""}`} type="button" data-tip="投递简历" aria-label="投递简历" onClick={() => { if (record) { window.open(jobFacts(job).sourceUrl, "_blank", "noopener,noreferrer"); return; } setPicking(true); }}><Send size={16} /></button>
          </div>
        </div>
      </article>

      <div className="split">
        <div className="stack">
          <JobPosting job={job} />
          <article className="card glass-read">
            <h3>岗位介绍</h3>
            <ul className="plain">{job.duties.map((item) => <li key={item}><Highlight text={item} /></li>)}</ul>
          </article>
          <article className="card glass-read">
            <h3 className="with-icon"><Sparkles size={15} /> 为什么和你有关</h3>
            <ul className="plain">{job.reasons.length ? job.reasons.map((item) => <li key={item}><Highlight text={item} /></li>) : <li>方向弱相关，不进入首页推荐。</li>}</ul>
            <div className="block">
              <h3 className="with-icon"><AlertTriangle size={15} /> 投之前要补的缺口</h3>
              <ul>{job.gaps.map((item) => <li key={item}><Highlight text={item} /></li>)}</ul>
            </div>
          </article>
          <DeepSections job={job} open={deepJobs.includes(job.id)} onOpen={() => agreeDeep(job.id)} />
        </div>
        <aside className="stack">
          <article className="card glass-read">
            <h3 className="with-icon"><Car size={15} /> 通勤和家庭</h3>
            <div className="mt fact-row"><Car size={14} /> <RichText text={job.commute} /></div>
            <div className="mt fact-row"><House size={14} /> <RichText text={job.family} /></div>
          </article>
          <article className="card glass-read">
            <h3 className="with-icon"><ExternalLink size={15} /> 投递入口</h3>
            <div className="mt"><RichText text={job.channel} /></div>
            {job.channelOk ? null : <p className="hint mt">入口不可靠</p>}
            <p className="mt text-row">
              <a className="accent-link" href={`https://www.qcc.com/web/search?key=${encodeURIComponent(job.company.split("·")[0])}`} target="_blank" rel="noreferrer">企查查</a>
              <a className="accent-link" href={`https://www.tianyancha.com/search?key=${encodeURIComponent(job.company.split("·")[0])}`} target="_blank" rel="noreferrer">天眼查</a>
              <Link className="accent-link" to={`/assistant?job=${job.id}`}>问助手</Link>
            </p>
          </article>
          {record ? (
            <article className="card glass-read">
              <h3 className="with-icon"><Send size={15} /> 投递记录</h3>
              <p className="plain mt">{record.stage} · {record.viewed ? "企业已查看" : "尚未查看"}</p>
              <div className="mt"><RichText text={record.next} /></div>
              <Link className="accent-link mt" to="/progress">查看进度</Link>
            </article>
          ) : null}
        </aside>
      </div>

      {open ? (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <div className="modal glass-read" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="prefill-title">
            <div className="between">
              <h2 id="prefill-title">用个人档案预填</h2>
              <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>关闭</button>
            </div>
            <p className="hint mt">档案只填一次。这个岗位仍要改摘要和项目顺序，不要把代投当成省时间。</p>
            <div className="form-grid">
              {fields.map(([label, value]) => (
                <label key={label} className={`field${label === "一段经历" ? " wide" : ""}`}>
                  <span>{label}</span>
                  {label === "一段经历" ? <textarea readOnly value={value} /> : <input readOnly value={value} />}
                </label>
              ))}
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={async () => {
                const text = fields.map(([label, value]) => `${label}：${value}`).join("\n");
                try {
                  await navigator.clipboard.writeText(text);
                  notify("已复制，可粘贴到网申");
                  setOpen(false);
                } catch {
                  notify("复制失败，请手动选择文本");
                }
              }}
            >
              复制预填内容
            </button>
          </div>
        </div>
      ) : null}
      {picking ? <ApplyPickDialog job={job} onClose={() => setPicking(false)} /> : null}
    </div>
  );
}

function JobPosting({ job }: { job: Job }) {
  const blocks = jobPostings[job.id];
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const facts = jobFacts(job);

  useLayoutEffect(() => {
    const node = bodyRef.current;
    setExpanded(false);
    setOverflow(Boolean(node && node.scrollHeight > 248));
  }, [job.id]);

  return (
    <article className="card glass-read">
      <div className="posting-head">
        <h3>岗位描述</h3>
        <span className="posting-tag">招聘原文</span>
      </div>
      {blocks?.length ? (
        <>
          <div ref={bodyRef} className={`posting-body${overflow && !expanded ? " is-clamped" : ""}`}>
            {blocks.map((block) => (
              <section key={block.title}>
                <h4>{block.title}</h4>
                <ol>
                  {block.lines.map((line) => <li key={line}><Highlight text={line} /></li>)}
                </ol>
              </section>
            ))}
          </div>
          {overflow ? (
            <button className="posting-more" type="button" onClick={() => setExpanded((value) => !value)}>
              {expanded ? "收起" : "展开全部"}
            </button>
          ) : null}
        </>
      ) : (
        <div className="posting-empty">
          <p>暂时无法获取该职位的原始招聘描述</p>
          <a className="accent-link" href={facts.sourceUrl} target="_blank" rel="noreferrer">查看原始招聘链接</a>
        </div>
      )}
    </article>
  );
}

function MatchRing({ value }: { value: number }) {
  return (
    <div className="ring" style={{ background: `conic-gradient(#6fb3d0 ${value * 3.6}deg, rgba(111,179,208,.16) 0)` }}>
      <span className="num">{value}</span>
    </div>
  );
}

function DeepSections({ job, open, onOpen }: { job: Job; open: boolean; onOpen: () => void }) {
  const score = matchScore(job);
  if (!open) {
    return (
      <article className="card glass-read detail-match">
        <MatchRing value={score} />
        <p>
          {score < 85 ? "因匹配度<85，故不主动提供录用样本、薪资构成和实际休息，若需查看请点击" : "录用样本、薪资构成和实际休息要单独查，若需查看请点击"}
          <button className="accent-link" type="button" onClick={onOpen}>AI搜索</button>
        </p>
      </article>
    );
  }
  return (
    <>
      <article className="card glass-read">
        <h3 className="with-icon"><AlertTriangle size={15} /> 近两年录用样本</h3>
        {/录用|样本|届/.test(job.extra) ? <RichText text={job.extra} /> : <p className="hint mt">这个岗位没有整理到近两年录用样本。</p>}
      </article>
      <article className="card glass-read">
        <h3 className="with-icon"><Banknote size={15} /> 薪资构成</h3>
        <div className="salary-grid mt">
          {job.parts.map((part) => (
            <div key={part.label}><strong>{part.label}</strong><Highlight text={part.value} /></div>
          ))}
        </div>
        <div className="block">
          <h3 className="with-icon"><MessagesSquare size={15} /> 和 HR 谈的时候</h3>
          <ul>{job.negotiate.map((item) => <li key={item}><Highlight text={item} /></li>)}</ul>
        </div>
      </article>
      <article className="card glass-read">
        <h3 className="with-icon"><Briefcase size={15} /> 实际工作与休息</h3>
        <ul>{job.duties.map((item) => <li key={item}><Highlight text={item} /></li>)}</ul>
        <div className="mt"><RichText text={job.rest} /></div>
        <div className="mt"><RichText text={job.atmosphere} /></div>
        <div className="block">
          <h3 className="with-icon"><UserRound size={15} /> 可以问谁</h3>
          <RichText text={job.insider} />
        </div>
      </article>
    </>
  );
}
