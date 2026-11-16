import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { BadgeCheck, Briefcase, CalendarClock, Eye, ListChecks, Sparkles } from "lucide-react";
import { Highlight } from "../components/RichText";
import { jobs, matchScore, stages, type Stage } from "../data";
import { useApp } from "../store";
import { buildTodayTasks, summarizeTasks } from "../todayTasks";

const nextMeta: Record<string, { title: string; action: string; to: string }> = {
  "edit-alibaba": { title: "阿里巴巴 · 中后台前端", action: "改简历", to: "/resumes" },
  "exam-bytedance": { title: "字节跳动 · 前端研发", action: "准备笔试", to: "/jobs/bytedance" },
  "interview-xhs": { title: "小红书 · 产品培训生", action: "准备面试", to: "/progress" },
  "reply-offers": { title: "澄光智能 / 小红书社区前端", action: "比较 Offer", to: "/progress" },
};

function taskDetail(text: string) {
  const index = text.indexOf("：");
  return index >= 0 ? text.slice(index + 1) : text;
}

function Ring({ value }: { value: number }) {
  return (
    <div className="ring" style={{ background: `conic-gradient(#6fb3d0 ${value * 3.6}deg, rgba(111,179,208,.16) 0)` }}>
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
  const appliedIds = new Set(applications.map((item) => item.jobId));
  const recommended = jobs
    .filter((job) => job.recommend && !appliedIds.has(job.id))
    .sort((a, b) => matchScore(b) - matchScore(a))
    .slice(0, 3);
  const pendingTasks = todayTasks.filter((task) => !task.done);
  const nextTasks = pendingTasks.filter((task) => task.id !== "apply").slice(0, 4);
  const [taskTip, setTaskTip] = useState<{ text: string; x: number; y: number } | null>(null);

  return (
    <div className="stack">
      <section className="card glass hero hero-welcome">
        <div className="hero-main">
          <div className="eyebrow">
            {profile.cohort ? (profile.cohort.includes("校招") ? profile.cohort : `${profile.cohort.replace("届", " 届")}校招`) : "校招"}
            {profile.city ? ` · ${profile.city}` : ""}
          </div>
          <h2>早上好，{profile.name}</h2>
          <p className="hero-lead">今天有 {counts.面试} 个面试跟进，{taskSummary.pending} 项任务待完成。把注意力放在最值得推进的岗位上。</p>
          <div className="hero-actions">
            <Link className="btn-primary" to="/progress">查看进度 →</Link>
            <Link className="btn-ghost" to="/interview">开始模拟面试</Link>
          </div>
        </div>
        <aside className="hero-progress">
          <div className="hero-progress-head">
            <div className="hero-progress-copy">
              <span>本周完成度</span>
              <strong>{taskSummary.pending} 项待完成</strong>
            </div>
            <Ring value={taskSummary.rate} />
          </div>
          <div className="hero-task-list" onScroll={() => setTaskTip(null)}>
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="hero-task"
                onMouseEnter={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const zoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
                  setTaskTip({
                    text: taskDetail(task.text),
                    x: (rect.left - 12) / zoom,
                    y: (rect.top + rect.height / 2) / zoom,
                  });
                }}
                onMouseLeave={() => setTaskTip(null)}
              >
                <span>{task.text.split("：")[0]}</span>
              </div>
            ))}
          </div>
        </aside>
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
            <h2 className="with-icon"><ListChecks size={16} /> 接下来推进</h2>
            <button className="check-progress" type="button" onClick={reopenChecklist}>核对进度</button>
          </div>
          <div className="next-list">
            {nextTasks.map((task) => {
              const meta = nextMeta[task.id];
              return (
                <Link key={task.id} to={meta?.to ?? "/progress"} className="next-item">
                  <div>
                    <strong>{meta?.title ?? task.text.split("：")[0]}</strong>
                    <p>{taskDetail(task.text)}</p>
                  </div>
                  <span className="next-action">{meta?.action ?? "去处理"}</span>
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
      {taskTip
        ? createPortal(
            <div className="hero-task-tip" style={{ left: taskTip.x, top: taskTip.y }}>
              {taskTip.text}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
