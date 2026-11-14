import { resumesSeed, type ResumeVersion } from "./data";

export type ReviewCheck = { label: string; pass: boolean; note: string };

export type ReviewSuggestion = {
  id: string;
  title: string;
  problem: string;
  proposal: string;
  target?: string;
  sectionTitle?: string;
  text?: string;
};

export function reviewResume(resume: ResumeVersion) {
  const body = [resume.summary, ...resume.sections.map((section) => section.after)].join("\n");
  const checks: ReviewCheck[] = [
    {
      label: "目标岗位",
      pass: Boolean(resume.target.trim() && resume.target !== "不限定岗位"),
      note: "第一眼要看出这份简历投什么工作",
    },
    {
      label: "个人范围",
      pass: /独立|负责|我/.test(body),
      note: "写清哪一段是你做的，不要只写参与",
    },
    {
      label: "前后结果",
      pass: /\d/.test(body),
      note: "留一个改前改后的数字",
    },
    {
      label: "谁在使用",
      pass: /使用|用户|课题组|同学|新生|师兄|新人/.test(body),
      note: "写上结果给谁用了",
    },
  ];
  const suggestions: ReviewSuggestion[] = [];
  if (resume.target === "不限定岗位" || !resume.target.trim()) {
    suggestions.push({
      id: "target",
      title: "先写明要投的岗位",
      problem: "现在写着不限定岗位，招聘的人看不出该把你分到前端、算法还是产品。",
      proposal: "把目标岗位改成「前端 / Web 开发」。投产品时再换转产品版。",
      target: "前端 / Web 开发",
    });
  }
  const seeded = resumesSeed.find((item) => item.id === resume.id);
  const narrative = new Set(["工作经历", "校园经历"]);
  for (const section of resume.sections) {
    if (!narrative.has(section.title)) continue;
    const recommended = seeded?.sections.find((item) => item.title === section.title)?.after;
    const vague = (/参与|协助|担任/.test(section.after) && !/\d/.test(section.after)) || section.after === section.before;
    const noOwner = !/独立|负责|我/.test(section.after);
    if (recommended && recommended !== section.after && (vague || noOwner)) {
      suggestions.push({
        id: `section-${section.title}`,
        title: `改写「${section.title}」`,
        problem: noOwner ? "这段没有写清是你做的。" : "这段还像在列头衔，看不出结果。",
        proposal: recommended,
        sectionTitle: section.title,
        text: recommended,
      });
    } else if (noOwner) {
      const text = `我负责这一段：${section.after}`;
      suggestions.push({
        id: `owner-${section.title}`,
        title: `在「${section.title}」里写上你本人`,
        problem: "招聘的人分不清哪些是你做的。",
        proposal: text,
        sectionTitle: section.title,
        text,
      });
    }
  }
  if (!suggestions.some((item) => item.sectionTitle) && !/链接|http/.test(body) && checks.every((item) => item.pass)) {
    const project = resume.sections.find((section) => section.title === "工作经历") ?? resume.sections[0];
    if (project) {
      const text = `${project.after} 作品可以打开：链接待补充。`;
      suggestions.push({
        id: "link",
        title: "补一个能点开的作品",
        problem: "经历已经写清了，但对方还是没法打开你的页面。",
        proposal: "在第一段项目末尾加上作品链接。没有线上地址时，先留「链接待补充」，再换成真实地址。",
        sectionTitle: project.title,
        text,
      });
    }
  }
  const passed = checks.filter((item) => item.pass).length;
  return { checks, suggestions, passed, total: checks.length };
}
