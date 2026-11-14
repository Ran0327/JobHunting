import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { jobFacts } from "../catalog";
import { type Job, type Risk } from "../data";
import { classifyJob, jobTree } from "../taxonomy";

export const employments = ["全部", "直招", "外包", "中介", "实习", "培训"] as const;
export const risks = ["全部", "低", "中", "高"] as const;
export const degrees = ["全部", "初中及以下", "中专/中技", "高中", "大专", "本科", "硕士", "博士"] as const;
export const salaryBands = ["全部", "3k以下", "3-5k", "5-10k", "10-20k", "20-50k", "50k以上"] as const;
export const experiences = ["全部", "在校生", "应届生", "1年以内", "1-3年", "3-5年", "5-10年", "10年以上"] as const;
export const headcounts = ["全部", "0-20人", "20-99人", "100-499人", "500-999人", "1000-9999人", "10000人以上"] as const;

export type JobFilters = {
  q: string;
  employment: (typeof employments)[number];
  risk: (typeof risks)[number];
  degree: (typeof degrees)[number];
  salaryBand: (typeof salaryBands)[number];
  experience: (typeof experiences)[number];
  headcount: (typeof headcounts)[number];
};

export const emptyJobFilters: JobFilters = {
  q: "",
  employment: "全部",
  risk: "全部",
  degree: "全部",
  salaryBand: "全部",
  experience: "全部",
  headcount: "全部",
};

export function matchesJob(job: Job, filters: JobFilters) {
  const facts = jobFacts(job);
  if (filters.employment !== "全部" && job.employment !== filters.employment) return false;
  if (filters.risk !== "全部" && job.risk !== (filters.risk as Risk)) return false;
  if (filters.degree !== "全部" && facts.degree !== filters.degree) return false;
  if (filters.salaryBand !== "全部" && facts.salaryBand !== filters.salaryBand) return false;
  if (filters.experience !== "全部" && facts.experience !== filters.experience) return false;
  if (filters.headcount !== "全部" && facts.headcount !== filters.headcount) return false;
  const query = filters.q.trim().toLowerCase();
  if (!query) return true;
  const blob = [job.title, job.company, ...job.aliases, ...job.tags, ...job.duties, facts.source].join(" ").toLowerCase();
  return blob.includes(query);
}

export function browseJobs(source: Job[], path: { group: string; sub: string; leaf: string }, filters: JobFilters) {
  return source.filter((job) => {
    const route = classifyJob(job);
    if (path.group !== "全部" && route[0] !== path.group) return false;
    if (path.sub !== "全部" && route[1] !== path.sub) return false;
    if (path.leaf !== "全部" && route[2] !== path.leaf) return false;
    return matchesJob(job, filters);
  });
}

export function JobFilterBar({
  group,
  sub,
  leaf,
  onPath,
  filters,
  onChange,
}: {
  group: string;
  sub: string;
  leaf: string;
  onPath: (next: { group: string; sub: string; leaf: string }) => void;
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
}) {
  return (
    <div className="filter-bar">
      <JobCascade group={group} sub={sub} leaf={leaf} onChange={onPath} />
      <Drop label="学历" value={filters.degree} options={degrees} onChange={(degree) => onChange({ ...filters, degree: degree as JobFilters["degree"] })} />
      <Drop label="薪资" value={filters.salaryBand} options={salaryBands} onChange={(salaryBand) => onChange({ ...filters, salaryBand: salaryBand as JobFilters["salaryBand"] })} />
      <Drop label="经验" value={filters.experience} options={experiences} onChange={(experience) => onChange({ ...filters, experience: experience as JobFilters["experience"] })} />
      <Drop label="规模" value={filters.headcount} options={headcounts} onChange={(headcount) => onChange({ ...filters, headcount: headcount as JobFilters["headcount"] })} />
      <Drop label="用工" value={filters.employment} options={employments} onChange={(employment) => onChange({ ...filters, employment: employment as JobFilters["employment"] })} />
      <Drop label="风险" value={filters.risk} options={risks} onChange={(risk) => onChange({ ...filters, risk: risk as JobFilters["risk"] })} />
    </div>
  );
}

function JobCascade({ group, sub, leaf, onChange }: { group: string; sub: string; leaf: string; onChange: (next: { group: string; sub: string; leaf: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [hoverGroup, setHoverGroup] = useState(jobTree[0].name);
  const [hoverSub, setHoverSub] = useState(jobTree[0].children[0].name);
  const rootRef = useRef<HTMLLabelElement>(null);
  const activeGroup = jobTree.find((item) => item.name === hoverGroup) ?? jobTree[0];
  const activeSub = activeGroup.children.find((item) => item.name === hoverSub) ?? activeGroup.children[0];
  const label = leaf !== "全部" ? leaf : sub !== "全部" ? sub : group !== "全部" ? group : "全部";

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function show(nextGroup: string, nextSub?: string) {
    const branch = jobTree.find((item) => item.name === nextGroup) ?? jobTree[0];
    setHoverGroup(branch.name);
    setHoverSub(branch.children.some((item) => item.name === nextSub) ? nextSub! : branch.children[0].name);
  }

  function toggle() {
    const nextGroup = group === "全部" ? jobTree[0].name : group;
    const branch = jobTree.find((item) => item.name === nextGroup) ?? jobTree[0];
    show(branch.name, sub === "全部" ? branch.children[0].name : sub);
    setOpen((prev) => !prev);
  }

  function pick(next: { group: string; sub: string; leaf: string }) {
    onChange(next);
    setOpen(false);
  }

  return (
    <label className="drop-field" ref={rootRef}>
      <span>职位</span>
      <button className={`drop cascade-trigger${label !== "全部" ? " picked" : ""}`} type="button" aria-label="职位" aria-expanded={open} onClick={toggle}>
        <span>{label}</span>
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="cascade">
          <div className="cascade-col">
            <button type="button" onClick={() => pick({ group: "全部", sub: "全部", leaf: "全部" })}>全部</button>
            {jobTree.map((item) => (
              <button key={item.name} type="button" className={hoverGroup === item.name ? "on" : ""} onMouseEnter={() => show(item.name)} onClick={() => pick({ group: item.name, sub: "全部", leaf: "全部" })}>
                <span>{item.name}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
          <div className="cascade-col">
            {activeGroup.children.map((item) => (
              <button key={item.name} type="button" className={hoverSub === item.name ? "on" : ""} onMouseEnter={() => setHoverSub(item.name)} onClick={() => pick({ group: activeGroup.name, sub: item.name, leaf: "全部" })}>
                <span>{item.name}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
          <div className="cascade-col">
            {activeSub.leaves.map((item) => (
              <button key={item} type="button" className={leaf === item && sub === activeSub.name && group === activeGroup.name ? "on" : ""} onClick={() => pick({ group: activeGroup.name, sub: activeSub.name, leaf: item })}>
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </label>
  );
}

function Drop({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  const unique = [...new Set(options)];
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
  return (
    <label className="drop-field" ref={rootRef}>
      <span>{label}</span>
      <button className={`drop cascade-trigger${value !== "全部" ? " picked" : ""}`} type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen((prev) => !prev)}>
        <span>{unique.includes(value) ? value : "全部"}</span>
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="cascade menu">
          <div className="cascade-col">
            {unique.map((item) => (
              <button key={item} type="button" className={item === value ? "on" : ""} onClick={() => { onChange(item); setOpen(false); }}>
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </label>
  );
}
