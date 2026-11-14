import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApplyPickDialog } from "../components/ApplyPickDialog";
import { JobCard } from "../components/JobCard";
import { browseJobs, emptyJobFilters, JobFilterBar, type JobFilters } from "../components/JobFilterBar";
import { jobFacts } from "../catalog";
import { jobs, type Job } from "../data";
import { useApp } from "../store";

export function Jobs() {
  const { applications } = useApp();
  const [params] = useSearchParams();
  const [segment, setSegment] = useState<"岗位" | "投递记录">("岗位");
  const [filters, setFilters] = useState<JobFilters>({ ...emptyJobFilters, q: params.get("q") ?? "" });
  const [group, setGroup] = useState("全部");
  const [sub, setSub] = useState("全部");
  const [leaf, setLeaf] = useState("全部");
  const [picking, setPicking] = useState<Job | null>(null);
  const applied = new Set(applications.map((item) => item.jobId));

  useEffect(() => {
    const q = params.get("q") ?? "";
    setFilters((prev) => ({ ...prev, q }));
  }, [params]);

  const list = useMemo(() => {
    return browseJobs(jobs, { group, sub, leaf }, filters).filter((job) => {
      if (segment === "投递记录" && !applied.has(job.id)) return false;
      return true;
    });
  }, [group, sub, leaf, segment, applied, filters]);

  function goApply(job: Job) {
    if (applications.some((item) => item.jobId === job.id)) {
      window.open(jobFacts(job).sourceUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setPicking(job);
  }

  return (
    <div className="stack">
      <section className="card glass-read filter-card">
        <JobFilterBar
          group={group}
          sub={sub}
          leaf={leaf}
          onPath={({ group: nextGroup, sub: nextSub, leaf: nextLeaf }) => { setGroup(nextGroup); setSub(nextSub); setLeaf(nextLeaf); }}
          filters={filters}
          onChange={setFilters}
        />
        <div className="text-row mt">
          {(["岗位", "投递记录"] as const).map((item) => (
            <button key={item} className={`quiet${segment === item ? " on" : ""}`} type="button" onClick={() => setSegment(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="stack">
        <div className="section-title">
          <h2>{leaf !== "全部" ? leaf : sub !== "全部" ? sub : group !== "全部" ? group : "全部岗位"}</h2>
          <span className="hint">{list.length} 个岗位</span>
        </div>
        <div className="job-list">
          {list.length === 0 ? (
            <article className="card glass-read">
              这个方向下还没有整理进列表的职位。
              {leaf !== "全部" ? <a className="quiet" href={`https://sou.zhaopin.com/?kw=${encodeURIComponent(leaf)}`} target="_blank" rel="noreferrer">到智联招聘看「{leaf}」</a> : null}
            </article>
          ) : null}
          {list.map((job) => <JobCard key={job.id} job={job} onApply={goApply} />)}
        </div>
      </section>
      {picking ? <ApplyPickDialog job={picking} onClose={() => setPicking(null)} /> : null}
    </div>
  );
}
