import { Link } from "react-router-dom";
import { BadgeCheck, Briefcase, CalendarClock, CalendarDays, Eye, ListChecks, Mic, PenLine, Send, Sparkles, X } from "lucide-react";
import { Highlight } from "../components/RichText";
import { interviewStamp } from "../components/WhenPicker";
import { jobById, jobs, matchScore, stages, type Stage } from "../data";
import { useApp } from "../store";
import { buildTodayTasks, summarizeTasks } from "../todayTasks";

const stageIcon = { 已投递: Send, 笔试: PenLine, 面试: CalendarDays, Offer: BadgeCheck, 未通过: X };

function Ring({ value }: { value: number }) {
  return (
    <div className="ring" style={{ background: `conic-gradient(#4338ca ${value * 3.6}deg, rgba(15,23,42,.08) 0)` }}>
      <span className="num">{value}</span>
    </div>
  );
}

export function Dashboard() {
  const { applications, profile, reopenChecklist } = useApp();
  const todayTasks = buildTodayTasks(applications.length);
  const taskSummary = summarizeTasks(todayTasks);
  const counts = Object.fromEntries(stages.map((stage) => [stage, applications.filter((item) => item.stage === stage).length])) as Record<Stage, number>;
  const active = applications.filter((item) => item.stage !== "未通过").length;
  const offers = counts.Offer;
  const max = Math.max(1, ...stages.map((stage) => counts[stage]));
  const appliedIds = new Set(applications.map((item) => item.jobId));
  const recommended = jobs
    .filter((job) => job.recommend && !appliedIds.has(job.id))
    .sort((a, b) => matchScore(b) - matchScore(a))
    .slice(0, 3);

  const progressRows = stages.flatMap((stage) => applications.filter((item) => item.stage === stage));

  return (
    <div className="stack">
      <section className="card glass hero">
        <div className="hero-main">
          <div className="eyebrow">{profile.cohort ? (profile.cohort.includes("校招") ? profile.cohort : `${profile.cohort}校招`) : "校招"}</div>
          <h2>{profile.name}，今日待完成任务清单</h2>
          <ul className="task-scroll">
            {todayTasks.map((task) => (
              <li key={task.id}>
                <span className={task.done ? "tag done" : "tag wait"}>{task.done ? "已完成" : "待办"}</span>
                <span><Highlight text={task.text} /></span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="task-stat">
          <Ring value={taskSummary.rate} />
          <div>
            <strong>任务完成度 {taskSummary.rate}%</strong>
            <p className="hint">待完成 {taskSummary.pending} 项</p>
            <p className="hint">已完成 {taskSummary.done} 项 / 应完成 {taskSummary.total} 项</p>
          </div>
        </aside>
      </section>

      <section className="card glass-read">
        <div className="section-title">
          <h2 className="with-icon"><Mic size={16} /> 模拟面试</h2>
          <Link className="start-interview" to="/interview">开始</Link>
        </div>
        <p className="hint mt">打字、语音，屏幕上是模拟面试官。题目按行业放在左侧。</p>
      </section>

      <section className="kpi-row">
        {([
          { label: "在跟进", value: active, hint: "不含已关闭", icon: Briefcase },
          { label: "已查看", value: applications.filter((item) => item.viewed && item.stage === "已投递").length, hint: "只计你勾过已查看、且还在已投递", icon: Eye },
          { label: "笔试 / 面试", value: counts.笔试 + counts.面试, hint: "按你勾选的进度", icon: CalendarClock },
          { label: "Offer", value: offers, hint: "按你勾选的 Offer", icon: BadgeCheck },
        ] as const).map((item) => (
          <article key={item.label} className="card glass kpi">
            <span className="with-icon"><item.icon size={14} /> {item.label}</span>
            <strong className="num">{item.value}</strong>
            <span>{item.hint}</span>
          </article>
        ))}
      </section>

      <section className="grid-2">
        <article className="card glass-read progress-panel">
          <div className="section-title">
            <h2 className="with-icon"><ListChecks size={16} /> 投递进度</h2>
            <button className="check-progress" type="button" onClick={reopenChecklist}>核对进度</button>
          </div>
          <div className="funnel">
            {stages.map((stage) => (
              <div className="funnel-row" key={stage}>
                <span className="with-icon">{(() => { const Icon = stageIcon[stage]; return <Icon size={13} />; })()} {stage}</span>
                <div className="bar"><i style={{ width: `${(counts[stage] / max) * 100}%` }} /></div>
                <b className="num">{counts[stage]}</b>
              </div>
            ))}
          </div>
          <div className="signal-list mt">
            {progressRows.map((item) => {
              const job = jobById(item.jobId);
              const date = item.stage === "面试" ? interviewStamp(item.interviewAt, item.interviewTime) : "";
              return (
                <Link key={item.id} to="/progress" className="signal">
                  <strong>{job?.company.split("·")[0]} · {item.stage}{date ? ` ${date}` : ""}</strong>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="card glass-read">
          <div className="section-title">
            <h2 className="with-icon"><Sparkles size={16} /> AI 推荐</h2>
            <Link to="/jobs" className="hint">全部职位</Link>
          </div>
          <p className="hint">中介代投和培训引流不进这里，仍可在职位页按风险筛出来核对。</p>
          <div className="rec-list mt">
            {recommended.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="rec">
                <div>
                  <h3>{job.title}</h3>
                  <p className="job-meta">{job.company} · {job.salary}</p>
                  <div className="mt"><Highlight text={job.reasons[0] ?? ""} /></div>
                  <div className="tags">
                    <span className="badge tone-indigo">{job.employment}</span>
                    <span className="badge tone-slate">缺口：{job.gaps[0]}</span>
                  </div>
                </div>
                <Ring value={matchScore(job)} />
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
