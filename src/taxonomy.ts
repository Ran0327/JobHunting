export type JobBranch = { name: string; children: { name: string; leaves: string[] }[] };

export const jobTree: JobBranch[] = [
  {
    name: "互联网/AI",
    children: [
      { name: "后端开发", leaves: ["Java", "Python", "Go", "C/C++", "PHP", "Node.js", ".NET", "全栈工程师", "软件工程师", "信息化开发", "驻场开发"] },
      { name: "前端/移动开发", leaves: ["Web前端", "Android", "iOS", "小程序", "Flutter", "鸿蒙"] },
      { name: "测试", leaves: ["测试工程师", "自动化测试", "测试开发"] },
      { name: "运维/技术支持", leaves: ["运维工程师", "DBA", "网络工程师", "技术支持"] },
      { name: "数据", leaves: ["数据分析师", "数据开发", "数据仓库"] },
      { name: "人工智能", leaves: ["算法工程师", "机器学习", "自然语言处理", "计算机视觉"] },
    ],
  },
  {
    name: "产品",
    children: [{ name: "产品经理", leaves: ["产品经理", "产品助理", "产品培训生", "数据产品"] }],
  },
  {
    name: "设计",
    children: [{ name: "视觉/交互", leaves: ["UI设计师", "视觉设计师", "交互设计师", "平面设计师"] }],
  },
  {
    name: "运营/市场",
    children: [
      { name: "运营", leaves: ["内容运营", "用户运营", "活动运营", "新媒体运营"] },
      { name: "市场", leaves: ["市场营销", "品牌", "公关", "广告投放"] },
    ],
  },
  {
    name: "销售/客服",
    children: [
      { name: "销售", leaves: ["销售专员", "大客户销售", "电话销售", "销售管理"] },
      { name: "客服", leaves: ["客服专员", "售后支持"] },
    ],
  },
  {
    name: "人事/行政/财务/法务",
    children: [
      { name: "人力资源", leaves: ["招聘", "HRBP", "薪酬绩效", "培训"] },
      { name: "行政", leaves: ["行政专员", "前台"] },
      { name: "财务", leaves: ["会计", "审计", "出纳", "财务分析"] },
      { name: "法务", leaves: ["法务专员", "律师助理"] },
    ],
  },
  {
    name: "金融",
    children: [
      { name: "银行", leaves: ["柜员", "客户经理", "风控"] },
      { name: "证券/基金", leaves: ["投资顾问", "行业研究", "基金会计"] },
    ],
  },
  {
    name: "教育/培训",
    children: [{ name: "教师", leaves: ["教师", "教务", "课程顾问", "教研"] }],
  },
  {
    name: "医疗/健康",
    children: [{ name: "医疗", leaves: ["医生", "护士", "药剂师", "医药代表"] }],
  },
  {
    name: "生产/制造",
    children: [{ name: "工程", leaves: ["机械工程师", "电子工程师", "质量工程师", "工艺工程师"] }],
  },
  {
    name: "汽车",
    children: [{ name: "汽车研发", leaves: ["汽车电子", "自动驾驶", "整车工程"] }],
  },
  {
    name: "房地产/建筑",
    children: [{ name: "工程", leaves: ["土建工程师", "造价", "工程管理"] }],
  },
  {
    name: "物流/采购",
    children: [
      { name: "物流", leaves: ["物流专员", "仓储", "供应链"] },
      { name: "采购", leaves: ["采购专员", "采购经理"] },
    ],
  },
  {
    name: "管培生",
    children: [{ name: "管培", leaves: ["管理培训生", "技术培训生"] }],
  },
];

const extraDirections = ["前端开发", "算法工程", "产品经理"];

export function directionLeaves() {
  const names = new Set<string>(extraDirections);
  jobTree.forEach((group) => group.children.forEach((child) => child.leaves.forEach((leaf) => names.add(leaf))));
  return [...names];
}

export function matchDirections(query: string) {
  const q = query.trim();
  const all = directionLeaves();
  if (!q) return { exact: [] as string[], suggest: [] as string[] };
  const exact = all.filter((item) => item.toLowerCase().includes(q.toLowerCase()));
  if (exact.length) return { exact: exact.slice(0, 8), suggest: [] as string[] };
  const suggest = all
    .map((name) => ({ name, score: [...q].filter((ch) => name.includes(ch)).length }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.length - b.name.length)
    .slice(0, 4)
    .map((item) => item.name);
  return { exact: [] as string[], suggest };
}

export function classifyJob(job: { title: string; tags: string[] }): [string, string, string] {
  const blob = `${job.title} ${job.tags.join(" ")}`;
  if (/产品/.test(blob)) return ["产品", "产品经理", "产品培训生"];
  if (/算法|检索/.test(blob)) return ["互联网/AI", "人工智能", "算法工程师"];
  if (/Java/.test(job.title)) return ["互联网/AI", "后端开发", "Java"];
  if (/全栈/.test(job.title)) return ["互联网/AI", "后端开发", "全栈工程师"];
  if (/信息化/.test(job.title)) return ["互联网/AI", "后端开发", "信息化开发"];
  if (/驻场/.test(job.title)) return ["互联网/AI", "后端开发", "驻场开发"];
  if (/软件工程师/.test(job.title)) return ["互联网/AI", "后端开发", "软件工程师"];
  if (/前端|Web/.test(blob)) return ["互联网/AI", "前端/移动开发", "Web前端"];
  return ["互联网/AI", "后端开发", "软件工程师"];
}
