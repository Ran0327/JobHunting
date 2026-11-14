import type { Job, ResumeSection, ResumeVersion } from "./data";

export type JobFacts = {
  source: "BOSS直聘" | "智联招聘";
  sourceUrl: string;
  degree: string;
  salaryBand: string;
  experience: string;
  industry: string;
  headcount: string;
  funding: string;
};

const bossIds = new Set(["meituan", "bytedance", "ctrip", "xhs-web", "alibaba", "chengguang"]);

export function jobFacts(job: Job): JobFacts {
  const source = bossIds.has(job.id) ? "BOSS直聘" : "智联招聘";
  const query = encodeURIComponent(`${job.company.split("·")[0]} ${job.title}`);
  const sourceUrl = source === "BOSS直聘"
    ? `https://www.zhipin.com/web/geek/job?query=${query}`
    : `https://sou.zhaopin.com/?kw=${query}`;
  const salaryBand = job.recruit === "实习"
    ? "5-10k"
    : /11–14|12–16/.test(job.salary)
      ? "10-20k"
      : "20-50k";
  const headcount = /万人/.test(job.size)
    ? "10000人以上"
    : /千人/.test(job.size)
      ? "1000-9999人"
      : /百人/.test(job.size)
        ? "100-499人"
        : /未知/.test(job.size)
          ? "0-20人"
          : "20-99人";
  const funding = ["meituan", "ctrip", "alibaba", "sensetime"].includes(job.id)
    ? "已上市"
    : ["bytedance", "xhs-product", "xhs-web"].includes(job.id)
      ? "D轮及以上"
      : job.id === "chengguang"
        ? "天使轮"
        : job.id === "institute"
          ? "不需要融资"
          : "未融资";
  return {
    source,
    sourceUrl,
    degree: job.id === "training" ? "大专" : job.id === "qihang" || job.id === "consultant" ? "本科" : "硕士",
    salaryBand,
    experience: job.recruit === "实习" ? "在校生" : job.recruit === "社招" ? "1-3年" : "应届生",
    industry: job.id === "alibaba" ? "电子商务" : job.id === "training" ? "广告营销" : job.id === "institute" ? "数据服务" : "互联网/IT/电子/通信",
    headcount,
    funding,
  };
}

export const intentions = [
  {
    id: "algo",
    name: "算法岗",
    blurb: "对应算法方向的简历",
    match: (job: Job) => job.tags.includes("算法") || /算法|检索/.test(job.title),
  },
  {
    id: "frontend",
    name: "前端岗",
    blurb: "对应前端方向的简历",
    match: (job: Job) => !job.tags.includes("算法") && (job.tags.includes("前端") || /前端|Web|全栈/.test(job.title)),
  },
  {
    id: "product",
    name: "产品岗",
    blurb: "对应产品方向的简历",
    match: (job: Job) => job.tags.includes("产品") || /产品/.test(job.title),
  },
] as const;

export const nameStyles = [
  { id: "name-role", label: "姓名 + 岗位" },
  { id: "role", label: "只写岗位" },
  { id: "major-role", label: "专业 + 岗位" },
] as const;

export function resumeFileName(styleId: string, typeName: string, person?: { name?: string; major?: string }) {
  if (styleId === "role") return typeName;
  if (styleId === "major-role") {
    const major = (person?.major || "计算机").split("·")[0].trim() || "计算机";
    return `${major} · ${typeName}`;
  }
  const name = person?.name?.trim() || "林晚宁";
  return `${name} · ${typeName}`;
}

export function withDrafts(resume: ResumeVersion): ResumeVersion {
  if (resume.drafts && resume.drafts.length >= 1) return resume;
  const stamps = ["10月20日", "10月26日", "11月2日"];
  const drafts = ["版本一", "版本二", "版本三"].map((label, index) => ({
    id: `${resume.id}-v${index + 1}`,
    label,
    savedAt: stamps[index],
    summary: resume.summary,
    sections: resume.sections.map((section) => tweakSection(section, index)),
  }));
  return { ...resume, drafts, sections: drafts[0].sections };
}

function tweakSection(section: ResumeSection, index: number): ResumeSection {
  if (index === 1 && section.title === "个人信息") {
    return { ...section, after: `${section.after}\n这一版是 10 月 26 日留下的：求职意向单独放在第一行。` };
  }
  if (index === 2 && section.title === "工作经历") {
    return { ...section, after: `${section.after}\n这一版是 11 月 2 日留下的：补了一句可以打开演示的说明。` };
  }
  return { ...section };
}
