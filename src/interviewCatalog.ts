import { interviewQuestions, type InterviewQuestion } from "./data";
import { questionBank } from "./bank";

export type InterviewDirection = { name: string; questions: InterviewQuestion[] };
export type InterviewCategory = { name: string; directions: InterviewDirection[] };

const byId = new Map([...questionBank, ...interviewQuestions].map((item) => [item.id, item]));

function pick(...ids: string[]) {
  return ids.map((id) => byId.get(id)).filter((item): item is InterviewQuestion => Boolean(item));
}

const technical = new Set(["互联网/AI", "电子/通信", "生产制造", "汽车", "能源/环保"]);

function made(category: string, direction: string): InterviewQuestion {
  const id = `dir:${category}:${direction}`;
  if (technical.has(category)) {
    return {
      id,
      group: category,
      topic: direction,
      kind: "技术",
      text: `你应聘的是${direction}。先用两三句讲清你负责过的一块，再讲一次结果不对时你第一步查什么。`,
      guide: "先圈定是你做的，再讲排查顺序，补一个前后变化。",
      keywords: ["我", "先"],
    };
  }
  return {
    id,
    group: category,
    topic: direction,
    kind: "经历",
    text: `你应聘的是${direction}。用两分钟讲一件和这个方向直接相关的事：问题是什么，你做了什么，结果谁在用。`,
    guide: "用「我」圈定范围，补一个数字，并说清谁在使用结果。",
    keywords: [],
  };
}

function pack(category: string, names: string[], extra: Record<string, InterviewQuestion[]> = {}): InterviewCategory {
  return {
    name: category,
    directions: names.map((name) => ({
      name,
      questions: extra[name]?.length ? extra[name] : [made(category, name)],
    })),
  };
}

const frontEnd = interviewQuestions.filter((item) => item.group === "JavaScript" || item.group === "浏览器与网络" || item.group === "React");
const stories = interviewQuestions.filter((item) => item.group === "经历");

export const interviewCatalog: InterviewCategory[] = [
  pack("互联网/AI", [
    "Java", "C/C++", "C#", "PHP", "Python", "Golang", "Node.js", ".NET", "全栈工程师", "软件工程师", "嵌入式软件", "架构师",
    "Web前端", "Android", "iOS", "鸿蒙", "小程序", "Flutter", "U3D", "技术美术",
    "测试工程师", "自动化测试", "测试开发", "游戏测试", "安全测试",
    "运维工程师", "DBA", "网络工程师", "网络安全", "云计算", "技术支持", "SRE",
    "数据分析", "数据开发", "数据仓库", "ETL", "数据挖掘", "数据架构",
    "算法工程师", "机器学习", "深度学习", "自然语言处理", "计算机视觉", "推荐算法", "搜索算法", "语音算法", "大模型应用",
    "数据库", "技术项目管理", "销售技术支持",
  ], {
    Java: pick("net-java"),
    数据库: pick("net-sql"),
    软件工程师: pick("net-bug", "net-coop"),
    Web前端: frontEnd,
  }),
  pack("电子/通信", [
    "电子工程师", "硬件工程师", "嵌入式硬件", "FPGA", "单片机", "PCB", "射频工程师", "驱动开发",
    "通信工程师", "5G", "光通信", "核心网", "移动通信", "物联网",
    "IC设计", "IC验证", "芯片测试", "半导体工艺", "版图设计",
    "电气工程师", "自动化", "PLC",
  ]),
  pack("产品", [
    "产品经理", "产品助理", "产品培训生", "数据产品", "B端产品", "C端产品", "策略产品", "AI产品", "商业化产品", "硬件产品", "电商产品", "用户研究", "需求分析", "游戏策划",
  ], {
    产品经理: pick("prod-cut", "prod-user", "prod-metric"),
  }),
  pack("设计", [
    "UI设计", "交互设计", "视觉设计", "平面设计", "3D设计", "动效设计", "原画", "插画", "美工",
    "工业设计", "包装设计", "服装设计", "室内设计", "景观设计", "展览设计", "游戏设计", "设计管理",
  ], {
    UI设计: pick("design-crit"),
  }),
  pack("客服/运营", [
    "客服专员", "售前客服", "售后客服", "客服主管",
    "内容运营", "用户运营", "活动运营", "社群运营", "电商运营", "直播运营", "产品运营", "数据运营", "商家运营", "新媒体运营", "游戏运营", "线下运营", "编辑",
  ], {
    活动运营: pick("ops-camp"),
  }),
  pack("销售", [
    "销售专员", "大客户销售", "电话销售", "销售管理", "销售总监", "商务拓展", "渠道销售", "网络销售", "外贸销售",
    "教培销售", "汽车销售", "房产销售", "医疗销售", "金融销售", "广告销售", "销售助理",
  ], {
    销售专员: pick("sale-no", "sale-need"),
  }),
  pack("人力/行政/法务", [
    "招聘", "HRBP", "薪酬绩效", "培训", "员工关系", "组织发展", "人力资源专员", "HRIS",
    "行政专员", "前台", "助理", "档案管理",
    "法律顾问", "公司法务", "合规", "知识产权", "律师助理",
  ], {
    招聘: pick("hr-hire"),
    合规: pick("fin-secret"),
  }),
  pack("财务/审计/税务", [
    "会计", "总账会计", "成本会计", "出纳", "财务分析", "财务经理", "审计", "税务", "资金管理", "固定资产会计",
  ], {
    财务分析: pick("fin-report"),
  }),
  pack("金融", [
    "柜员", "客户经理", "信贷", "风控", "理财顾问", "清算", "催收",
    "证券分析", "行业研究", "投资顾问", "基金会计", "量化", "交易员", "投行", "投后管理", "资产评估",
    "保险精算", "核保理赔", "保险产品",
  ], {
    风控: pick("fin-risk"),
    客户经理: pick("fin-term"),
  }),
  pack("教育培训", [
    "教师", "幼教", "教务", "课程顾问", "教研", "培训师", "留学顾问", "职业培训", "教育产品", "助教",
  ], {
    教师: pick("edu-class", "edu-parent"),
  }),
  pack("医疗健康", [
    "医生", "护士", "药剂师", "医药代表", "医学检验", "临床研究", "医疗器械", "生物医药", "健康顾问", "营养师",
  ], {
    医生: pick("med-case", "med-safe"),
  }),
  pack("生产制造", [
    "机械工程师", "机械设计", "工艺工程师", "质量工程师", "电子工程师", "电气自动化", "工业机器人",
    "生产管理", "安全工程师", "IE工程师", "模具工程师", "材料工程师", "化工工程师", "焊接工程师", "设备工程师",
  ], {
    质量工程师: pick("mfg-quality"),
    生产管理: pick("mfg-shift"),
  }),
  pack("汽车", [
    "汽车电子", "自动驾驶", "整车工程", "三电", "底盘", "车身", "标定", "汽车设计", "新能源汽车", "汽车服务", "汽车测试",
  ], {
    自动驾驶: pick("car-safe"),
    汽车测试: pick("car-test"),
  }),
  pack("房地产/建筑", [
    "土建工程师", "造价", "工程管理", "结构工程师", "给排水", "暖通", "建筑设计", "室内设计", "景观设计", "监理", "物业管理", "房地产策划", "置业顾问",
  ]),
  pack("物流/采购", [
    "物流专员", "仓储", "供应链", "配送", "调度", "采购专员", "供应商管理", "外贸跟单", "报关",
  ]),
  pack("市场/公关/广告", [
    "市场营销", "品牌", "公关", "广告投放", "媒介", "市场调研", "政府事务", "会展", "渠道推广",
  ]),
  pack("直播/影视/传媒", [
    "主播", "直播运营", "编导", "摄影", "后期", "文案", "记者", "编辑", "策划",
  ]),
  pack("咨询/翻译", ["管理咨询", "战略咨询", "调研", "翻译", "本地化"]),
  pack("能源/环保", ["能源工程师", "电力工程师", "环保工程师", "光伏", "储能", "地质"]),
  pack("管培生", ["管理培训生", "技术培训生", "营销培训生", "职能培训生", "运营培训生"]),
  {
    name: "经历",
    directions: stories.map((item) => ({ name: item.topic, questions: [item] })),
  },
];

const flat = interviewCatalog.flatMap((category) => category.directions.flatMap((direction) => direction.questions));

export function findInterviewQuestion(id: string) {
  return flat.find((item) => item.id === id);
}
