export type Stage = "已投递" | "笔试" | "面试" | "Offer" | "未通过";
export type Employment = "直招" | "外包" | "中介" | "实习" | "培训";
export type Risk = "低" | "中" | "高";

export type Job = {
  id: string;
  title: string;
  aliases: string[];
  company: string;
  size: string;
  commute: string;
  family: string;
  salary: string;
  parts: { label: string; value: string }[];
  conditions: string[];
  negotiate: string[];
  employment: Employment;
  recruit: "校招" | "社招" | "实习";
  tags: string[];
  reasons: string[];
  gaps: string[];
  duties: string[];
  rest: string;
  atmosphere: string;
  insider: string;
  channel: string;
  channelOk: boolean;
  risk: Risk;
  riskText: string;
  extra: string;
  recommend: boolean;
};

export type InterviewMode = "线上" | "线下";
export type InterviewRoundStatus = "待安排" | "已安排" | "已完成";
export type InterviewRoundResult = "待反馈" | "通过" | "未通过";

export type InterviewReview = {
  questions: string;
  answers: string;
  problems: string;
  gaps: string;
  feedback: string;
  prepare: string;
};

export type InterviewRound = {
  id: string;
  order: number;
  name: string;
  date: string;
  time: string;
  mode: InterviewMode | "";
  interviewer: string;
  place: string;
  note: string;
  status: InterviewRoundStatus;
  result: InterviewRoundResult | "";
  review: InterviewReview;
};

export type Application = {
  id: string;
  jobId: string;
  stage: Stage;
  viewed: boolean;
  note: string;
  next: string;
  when?: string;
  interviewAt?: string;
  interviewTime?: string;
  rounds?: InterviewRound[];
  resumeId?: string;
  draftId?: string;
  nameStyleId?: string;
};

export type ResumeSection = { title: string; before: string; after: string };

export type MaterialTask = {
  id: string;
  title: string;
  done: boolean;
  detail: string;
};

export type ResumeDraft = {
  id: string;
  label: string;
  savedAt: string;
  summary: string;
  sections: ResumeSection[];
  body?: string;
};

export type ResumeVersion = {
  id: string;
  name: string;
  target: string;
  blurb: string;
  summary: string;
  sections: ResumeSection[];
  tasks: MaterialTask[];
  drafts?: ResumeDraft[];
};

export const stages: Stage[] = ["已投递", "笔试", "面试", "Offer", "未通过"];

export type Profile = {
  name: string;
  school: string;
  major: string;
  cohort: string;
  city: string;
  phone: string;
  email: string;
  status: string;
  background: string;
  directions: string[];
  salaryExpect: string;
  avatar: string;
};

export const profile: Profile = {
  name: "林晚宁",
  school: "华东师范大学",
  major: "计算机科学与技术 · 硕士",
  cohort: "2027届",
  city: "上海",
  phone: "138****2610",
  email: "lin.wanning@example.com",
  status: "在读，尚未缴纳社保，当前仍可参加校招",
  background: "没有正式实习。有一段实验室多模态检索课题，曾任校园技术部负责人。",
  directions: ["前端开发", "算法工程", "产品经理"],
  salaryExpect: "月薪 18–25k，优先上海",
  avatar: "",
};

export const jobs: Job[] = [
  {
    id: "meituan",
    title: "前端开发工程师",
    aliases: ["Web开发工程师", "前端研发", "客户端（Web）"],
    company: "美团",
    size: "万人以上",
    commute: "杨浦到申长路约 50 分钟",
    family: "同城，可与家人同住",
    salary: "20–28k · 15薪",
    parts: [
      { label: "底薪", value: "约 70%，按月固定发放" },
      { label: "绩效", value: "约 20%，与季度绩效挂钩" },
      { label: "奖金", value: "年终约 3–5 个月，对应 15 薪口径" },
      { label: "附带条件", value: "绩效 B 及以上才按满额年终估算；试用期通常按固定薪资的 80%–100%" },
    ],
    conditions: ["绩效 B 及以上才按满额年终估算", "试用期比例要单独问"],
    negotiate: ["报价用区间上沿 26–28k，并说明可按职级再谈", "优先争取试用期全薪", "问清年终是否有保底月数"],
    employment: "直招",
    recruit: "校招",
    tags: ["前端", "工程", "校招"],
    reasons: [
      "课题里独立写过检索演示前端，和岗位的页面交付能力对得上",
      "技术部负责人经历能说明协作和推进",
    ],
    gaps: ["缺少一段能写进简历的正式实习", "工程化（监控、发布、性能）还没有线上样本"],
    duties: ["负责商家端页面开发与已有组件复用", "和后端对齐接口，处理列表、筛选、表单校验", "跟随导师完成一次性能或体验优化"],
    rest: "双休。发布窗口可能在晚上，不是固定大小周。",
    atmosphere: "大促前两周会忙，其余时间多数能在 20:30 前结束（组内同学反馈，演示数据）。需求文档比较全，代码评审严格。",
    insider: "可问实验室学长周启明，他去年秋招进了到店事业群。",
    channel: "美团校招官网 · 上海前端。从公司校招站点进入，选择 2027 届技术类。不要走代投群里的短链。",
    channelOk: true,
    risk: "低",
    riskText: "招聘主体、面试和劳动合同一致，入口在公司校招站。",
    extra: "岗位写着接受应届，但近两届录用样本里，多数人有不少于 3 个月的相关实习。没有实习时，需要用可演示的项目补上「独立交付」。",
    recommend: true,
  },
  {
    id: "bytedance",
    title: "前端研发工程师",
    aliases: ["Web开发工程师", "前端开发"],
    company: "字节跳动",
    size: "万人以上",
    commute: "杨浦到漕河泾约 55 分钟",
    family: "同城",
    salary: "22–32k · 15薪",
    parts: [
      { label: "底薪", value: "月薪拆成固定部分加绩效月薪" },
      { label: "绩效", value: "绩效系数影响每月浮动" },
      { label: "奖金", value: "年终与绩效、部门包相关，口头 15 薪需写成书面口径" },
      { label: "附带条件", value: "部分组试用期绩效不计入年终" },
    ],
    conditions: ["口头 15 薪不等于书面承诺"],
    negotiate: ["先问清固定与浮动的比例", "用项目复杂度谈职级，而不是只报一个总数"],
    employment: "直招",
    recruit: "校招",
    tags: ["前端", "工程"],
    reasons: ["岗位名称不同，工作内容仍是 Web 前端", "检索课题里的交互页可以当作作品"],
    gaps: ["算法题和项目深挖强度高于当前准备", "没有实习时，作品需要能在线打开"],
    duties: ["中后台或内容平台的 Web 功能", "跨端页面的体验与稳定性", "与设计、后端一起拆需求"],
    rest: "双休为主，上线日除外。",
    atmosphere: "节奏快，评审和实验迭代密。文档和数据习惯重，表达要结论先行。",
    insider: "同组实习生名额可在宣讲后向学长要组名，再决定是否投该组。",
    channel: "字节校招官网。搜索「Web开发」会和「前端开发」命中同一类岗位，以官网职位 ID 为准。",
    channelOk: true,
    risk: "低",
    riskText: "公司校招官网直招。岗位名称和别的组不同，投之前对一下职责。",
    extra: "JD 接受应届，实际一面常追问实习或开源中的独立模块。",
    recommend: true,
  },
  {
    id: "ctrip",
    title: "Web 前端开发",
    aliases: ["前端开发工程师", "前端研发"],
    company: "携程",
    size: "万人以上",
    commute: "杨浦到虹桥约 40 分钟",
    family: "同城，通勤短于大多数互联网园区",
    salary: "18–26k · 15薪",
    parts: [
      { label: "底薪", value: "固定月薪占比高，适合拿来对标期望区间下沿" },
      { label: "绩效", value: "季度绩效影响奖金系数，不改写月薪" },
      { label: "奖金", value: "年终约 2–3 个月，15 薪里含补充月数" },
      { label: "附带条件", value: "签字费若出现，通常绑定服务期" },
    ],
    conditions: ["先确认 15 薪里有几个月是保底"],
    negotiate: ["期望区间报 24–26k，并说明可按职级调整", "签字费要问清服务期，不单独把总包喊高"],
    employment: "直招",
    recruit: "校招",
    tags: ["前端", "工程", "同城"],
    reasons: ["日常产出是预订流程里的页面和状态", "同城且薪资落在 18–25k 期望内"],
    gaps: ["还没有一段能在线打开的完整页面作品"],
    duties: ["预订与订单页面的功能开发", "处理加载、空状态和价格变更", "与后端对齐一次发布"],
    rest: "双休。大促和节假日值班会提前排班。",
    atmosphere: "业务规则多，适合把表单、状态和边界写清楚的人。",
    insider: "学院就业网上有去年入职学长的分享回放，可先看组是交易还是内容。",
    channel: "携程校招官网 · 上海 Web 前端。用学校邮箱注册，不经过代投。",
    channelOk: true,
    risk: "低",
    riskText: "企业校招直招，用工主体清楚。",
    extra: "接受应届。筛选时仍希望有一个能讲 15 分钟的独立页面，而不是只写「熟悉 Vue」。",
    recommend: true,
  },
  {
    id: "sensetime",
    title: "检索算法实习",
    aliases: ["多模态算法实习", "搜索算法实习"],
    company: "商汤科技",
    size: "千人以上",
    commute: "徐汇，地铁约 40 分钟",
    family: "同城，实习期可住学校",
    salary: "实习 300–400 元/天",
    parts: [
      { label: "底薪", value: "日薪，按实际出勤" },
      { label: "绩效", value: "实习评价影响转正定级，不单列月绩效" },
      { label: "奖金", value: "实习期通常无年终" },
      { label: "附带条件", value: "转正后的校招包另行评估，日薪高不代表转正薪资高" },
    ],
    conditions: ["留用条件需要写进沟通记录"],
    negotiate: ["实习阶段先谈转正评估时间点", "避免只听口头「大概率留用」"],
    employment: "实习",
    recruit: "实习",
    tags: ["算法", "科研迁移"],
    reasons: [
      "实验室检索课题和岗位的训练、评测语言直接相关",
      "没有实习时，这篇课题就是最强证据，不必伪装成公司项目",
    ],
    gaps: ["工程交付弱于论文指标", "转正与秋招备战会抢同一段时间"],
    duties: ["复现检索或排序实验", "整理评测集并给出误差分析", "把可用模块交给工程同学联调"],
    rest: "实习协议按工作日，法定节假日休息。实验跑挂时会晚走，不是每日加班。",
    atmosphere: "研究讨论多，工程规范需要自己补。",
    insider: "课题导师认识该组的合作研究员，可先内部问转正名额是否单列。",
    channel: "公司招聘官网实习通道。没有校园宣讲时，仍以官网实习职位为准，邮件标题写明学校、年级和课题名。",
    channelOk: true,
    risk: "低",
    riskText: "官网实习直招。需要单独确认留用是不是一次正式评估。",
    extra: "接受在读，但期望每周到岗 4 天以上。8 月若还没有评估节点，就应把时间拨回秋招。",
    recommend: true,
  },
  {
    id: "institute",
    title: "信息化开发",
    aliases: ["业务系统开发", "信息中心开发"],
    company: "市计算技术研究所",
    size: "百人级事业单位",
    commute: "中山公园，约 35 分钟",
    family: "同城，作息稳定，家庭侧更省心",
    salary: "12–16k · 13薪",
    parts: [
      { label: "底薪", value: "固定月薪占比高" },
      { label: "绩效", value: "年度考核影响奖金，月收入波动小" },
      { label: "奖金", value: "约 1 个月绩效奖" },
      { label: "附带条件", value: "薪资带宽受岗位等级限制，上浮空间小于互联网" },
    ],
    conditions: ["可谈的是职称通道和试用期，不是高额签字费"],
    negotiate: ["问清奖金对应的是全年还是项目结项"],
    employment: "直招",
    recruit: "校招",
    tags: ["稳定", "同城"],
    reasons: ["课题工程部分可以迁移", "若优先稳定和同城，匹配度高于纯薪资排序"],
    gaps: ["技术栈偏内部系统，成长速度慢于互联网业务组"],
    duties: ["内部业务系统的功能开发", "与使用部门整理需求", "维护已有模块"],
    rest: "双休，法定节假日完整。结项周会有集中联调。",
    atmosphere: "流程长、节奏慢，适合把确定性放在薪资前面的选择。",
    insider: "学院就业老师处有去年入职学长的联系方式，可问具体处室而不是只问单位名。",
    channel: "单位人事邮箱 hr-demo@example.com，抄送学院就业老师。今年没有公开宣讲。招聘网站上的同名帖很多不是这个单位。",
    channelOk: true,
    risk: "低",
    riskText: "真实入口是人事邮箱和学院就业网，不是招聘网站的转载帖。",
    extra: "接受应届，没有实习硬性要求。工作内容偏维护，投之前要接受成长速度。",
    recommend: true,
  },
  {
    id: "xhs-product",
    title: "技术产品培训生",
    aliases: ["产品培训生", "社区产品"],
    company: "小红书",
    size: "千人以上",
    commute: "徐汇，约 45 分钟",
    family: "同城",
    salary: "16–22k · 15薪",
    parts: [
      { label: "底薪", value: "固定月薪" },
      { label: "绩效", value: "季度绩效影响奖金系数" },
      { label: "奖金", value: "年终约 2–4 个月" },
      { label: "附带条件", value: "培训生定级后薪资会重估一次" },
    ],
    conditions: ["定级发生在培训结束之后"],
    negotiate: ["转方向时用校园项目的用户结果谈，而不是用技术深度硬比", "问清培训结束后的去向是业务组还是支持组"],
    employment: "直招",
    recruit: "校招",
    tags: ["产品", "转方向"],
    reasons: ["技术部负责人期间做过需求收集和排期，这是转产品可用的证据"],
    gaps: ["没有独立的用户访谈样本", "简历若仍按算法论文来写，会被判成不匹配"],
    duties: ["跟随产品经理写需求并跟进上线", "整理反馈和数据", "协调设计与研发"],
    rest: "双休。活动节点会忙。",
    atmosphere: "表达和文档比代码更被看见。",
    insider: "校园技术部合作过的运营学姐现就职社区产品，可问日常是写文档还是盯数据。",
    channel: "小红书校招官网 · 产品培训生。用「转产品」版本简历投递，不要和前端版混用同一附件。",
    channelOk: true,
    risk: "中",
    riskText: "直招没问题，但培训结束后去哪个组还没写清。",
    extra: "接受应届，作品集至少要有一个完整功能的前因后果。",
    recommend: false,
  },
  {
    id: "xhs-web",
    title: "社区前端开发",
    aliases: ["Web开发", "前端开发工程师"],
    company: "小红书",
    size: "千人以上",
    commute: "徐汇，约 45 分钟",
    family: "同城，和「优先上海」一致",
    salary: "22–30k · 15薪",
    parts: [
      { label: "底薪", value: "固定月薪写进 Offer 邮件" },
      { label: "绩效", value: "季度系数，有文字说明" },
      { label: "奖金", value: "年终 3 个月写入邮件，不另口头追加" },
      { label: "附带条件", value: "试用期 3 个月、全薪" },
    ],
    conditions: ["条款已经落在公司域名邮件里"],
    negotiate: ["若还想谈，只谈职级对应的带宽，不把年终再口头加码"],
    employment: "直招",
    recruit: "校招",
    tags: ["前端", "Offer"],
    reasons: ["与目标方向一致", "城市和家庭约束匹配", "书面薪资构成完整"],
    gaps: ["业务迭代快，需要接受评审密度"],
    duties: ["社区创作工具的 Web 功能", "与设计一起打磨上传与编辑流程"],
    rest: "版本周会到 21:00 左右，非每天。",
    atmosphere: "设计话语权大，前端要能讲清体验取舍。",
    insider: "已约到内推学姐陈可，下周三中午可问具体组的加班和导师风格。",
    channel: "校招官网，已走完流程。Offer 邮件来自公司域名。",
    channelOk: true,
    risk: "低",
    riskText: "流程已完成，邮件域名可核对。",
    extra: "此岗位已发 Offer。比较时看书面条款，不再重复投递。",
    recommend: false,
  },
  {
    id: "alibaba",
    title: "中后台前端开发",
    aliases: ["前端开发", "企业应用前端"],
    company: "阿里巴巴",
    size: "万人以上",
    commute: "杨浦到徐汇滨江约 50 分钟",
    family: "同城",
    salary: "20–30k · 16薪",
    parts: [
      { label: "底薪", value: "固定月薪加股票归属，总包不要只记月薪" },
      { label: "绩效", value: "绩效影响年奖和股票比例" },
      { label: "奖金", value: "16 薪口径依赖绩效，不是保底" },
      { label: "附带条件", value: "股票归属有年限" },
    ],
    conditions: ["未进入谈薪，当前卡在筛选"],
    negotiate: ["先改简历叙事，再谈数字"],
    employment: "直招",
    recruit: "校招",
    tags: ["前端", "筛选中"],
    reasons: ["职责是中后台页面，和演示台的列表、表单经验接近"],
    gaps: ["投出去的是算法岗简历", "第一段看不出模块、数字和使用者"],
    duties: ["中后台前端开发", "配置页、列表和权限相关界面"],
    rest: "双休为主，项目节点加班。",
    atmosphere: "文档和评审多，适合把个人范围讲清楚的人。",
    insider: "还没有可问的组内同学。先不要找人内推重投。",
    channel: "阿里校招官网，投递记录状态为筛选中。渠道本身可用。",
    channelOk: true,
    risk: "低",
    riskText: "公司校招直招，渠道正常。",
    extra: "接受应届。筛选时仍会看有没有能讲 15 分钟的独立项目。",
    recommend: false,
  },
  {
    id: "qihang",
    title: "驻场开发",
    aliases: ["银行开发", "软件外包"],
    company: "启航信息 · 派驻某城商行",
    size: "外包供应商，项目组约 40 人",
    commute: "陆家嘴，约 40 分钟",
    family: "同城，但驻场地点可能随合同变更",
    salary: "11–14k · 13薪",
    parts: [
      { label: "底薪", value: "合同签署在外包公司，底薪清晰" },
      { label: "绩效", value: "项目补贴按出勤，不随银行绩效" },
      { label: "奖金", value: "年终通常 0–1 个月，由外包公司发放" },
      { label: "附带条件", value: "银行方不直接录用；社保主体是外包公司" },
    ],
    conditions: ["入职会改变「未缴社保」状态，影响后续校招身份"],
    negotiate: ["问清合同主体、派驻期限和撤离后的去向", "不要把银行名义薪资当成自己的包"],
    employment: "外包",
    recruit: "社招",
    tags: ["外包", "后端"],
    reasons: ["仅当需要尽快有一份开发合同工时才相关"],
    gaps: ["技术方向与当前前端/检索背景不一致", "校招身份会因社保主体而变"],
    duties: ["按银行需求改内部系统", "驻场开发与缺陷修复"],
    rest: "跟随银行工作日。版本窗口加班，加班费口径需写进合同。",
    atmosphere: "业务稳定，技术决策权少。",
    insider: "先问合同上的用人单位全称，再决定要不要继续。",
    channel: "当前帖子由中介顾问转发。若仍想投，要求对方给出外包公司官网职位链接，而不是只收简历。",
    channelOk: false,
    risk: "中",
    riskText: "帖子写银行开发，面试地点和工牌都在外包公司。",
    extra: "不按应届校招通道招。社保一缴，下一届校招资格要重新核对。",
    recommend: false,
  },
  {
    id: "consultant",
    title: "软件工程师",
    aliases: ["Java开发", "后端开发"],
    company: "由「职达顾问」发布 · 用人方未公开",
    size: "未知",
    commute: "未说明",
    family: "无法判断",
    salary: "面议，顾问口头 20k+",
    parts: [
      { label: "底薪", value: "未提供" },
      { label: "绩效", value: "未提供" },
      { label: "奖金", value: "薪资出现在顾问话术里，职位页没有构成" },
      { label: "附带条件", value: "没有用人方和薪资构成之前，不进入谈薪" },
    ],
    conditions: ["授权代投前没有官方入口"],
    negotiate: ["不进入具体砍价"],
    employment: "中介",
    recruit: "社招",
    tags: ["中介"],
    reasons: [],
    gaps: ["用人方、团队和面试流程都不透明", "顾问要求先做一份通用后端简历并授权代投多家"],
    duties: ["职位描述是模板句，看不出日常工作"],
    rest: "未知。",
    atmosphere: "未知。",
    insider: "要求顾问提供用人方全称和官方邮箱域名，再向学长核实。",
    channel: "只有顾问微信。可信做法是拿到公司名后，自己到该公司招聘页搜索同岗位。",
    channelOk: false,
    risk: "高",
    riskText: "中介代投，用人公司没有公开。",
    extra: "与应届身份、方向都不清楚。不建议授权代投。",
    recommend: false,
  },
  {
    id: "training",
    title: "Java 高薪就业（带薪实训）",
    aliases: ["带薪实习", "就业培训"],
    company: "启程教育科技",
    size: "培训机构",
    commute: "到岗地点在培训教室，不是企业办公区",
    family: "不建议作为就业选项",
    salary: "宣传「结业后 15–25k」",
    parts: [
      { label: "底薪", value: "培训期间无工资" },
      { label: "绩效", value: "无" },
      { label: "奖金", value: "「保证就业」出现在销售话术里" },
      { label: "附带条件", value: "需要先缴费或办理分期才能锁定名额" },
    ],
    conditions: ["这不是录用通知"],
    negotiate: ["不谈薪，直接停止"],
    employment: "培训",
    recruit: "实习",
    tags: ["风险"],
    reasons: [],
    gaps: ["它不是岗位", "要求身份证、学籍和详细简历后才能「锁定名额」"],
    duties: ["实际安排是上课和模拟项目，不是入职"],
    rest: "按课程表，晚课常见。",
    atmosphere: "销售顾问跟进紧，催缴费。",
    insider: "不需要内推。若已提交证件，向学校就业指导中心说明。",
    channel: "没有企业招聘入口。对话里出现学费、贷款、保证就业，即停止并保留记录。",
    channelOk: false,
    risk: "高",
    riskText: "以招聘为名的培训，要先交费才锁定名额。",
    extra: "不要投递。",
    recommend: false,
  },
  {
    id: "chengguang",
    title: "全栈开发",
    aliases: ["前端开发", "早期员工"],
    company: "澄光智能",
    size: "40 人",
    commute: "杭州，需从上海过去",
    family: "与「优先同城」冲突，家里近期有事需要人在上海",
    salary: "20k · 14薪 + 期权口头约定",
    parts: [
      { label: "底薪", value: "20k 固定" },
      { label: "绩效", value: "无月度绩效" },
      { label: "奖金", value: "14 薪里 2 个月为年终，书面写「视经营情况」" },
      { label: "附带条件", value: "期权未进合同；试用期 6 个月且薪资 90%" },
    ],
    conditions: ["年终不保底", "期权未写入协议"],
    negotiate: ["把年终是否保底、期权归属写进协议再比较", "城市成本要算进实际收入"],
    employment: "直招",
    recruit: "社招",
    tags: ["全栈", "Offer"],
    reasons: ["能接触完整产品，成长面宽"],
    gaps: ["城市不符合家庭约束", "薪资里不确定部分更多"],
    duties: ["同时写管理后台和少量接口", "早期功能从 0 到 1"],
    rest: "名义双休，发布常常占用周日晚上。",
    atmosphere: "人少，故障会直接找到个人。扁平，边界不清。",
    insider: "投资人介绍的前员工可用微信问离职原因，先问加班和发薪是否准时。",
    channel: "创始人邮箱直达，已发 Offer。小公司没有宣讲会。入口是官网招聘页留下的邮箱，已经核过域名。",
    channelOk: true,
    risk: "中",
    riskText: "入口真实，但年终和期权都还不是承诺，城市也不符合当前约束。",
    extra: "已发 Offer。比较时把往返成本算进去。",
    recommend: false,
  },
];

export const applicationsSeed: Application[] = [
  {
    id: "a-meituan",
    jobId: "meituan",
    stage: "已投递",
    viewed: true,
    note: "企业已查看。附件是前端岗。",
    next: "查看不等于进入笔试。若到 11 月 3 日还没有下一状态，核对附件后等待，不要当天重投。",
    when: "10 月 28 日投递",
  },
  {
    id: "a-alibaba",
    jobId: "alibaba",
    stage: "已投递",
    viewed: false,
    note: "停在筛选。用的是算法岗。",
    next: "先改前端岗的第一段，再决定要不要用新版本重投。问题在叙事，不在渠道。",
    when: "10 月 26 日投递",
  },
  {
    id: "a-bytedance",
    jobId: "bytedance",
    stage: "笔试",
    viewed: true,
    note: "在线笔试，含一道页面性能题。",
    next: "只准备项目深挖：独立模块、一次性能问题和如何与后端对齐。",
    when: "11 月 4 日 19:00",
  },
  {
    id: "a-xhs-product",
    jobId: "xhs-product",
    stage: "面试",
    viewed: true,
    note: "一面结束。薄弱点是用户样本不够，叙事像功能介绍。",
    next: "接下来只练一件事：补 3 次访谈，每次用「问题、放弃的方案、结果」讲 2 分钟。二面不要再追加模型指标。",
    when: "11 月 2 日二面",
    rounds: [
      {
        id: "r-xhs-product-1",
        order: 1,
        name: "第一轮面试",
        date: "",
        time: "",
        mode: "线上",
        interviewer: "",
        place: "",
        note: "11 月 2 日曾约下一轮，时间还没定。",
        status: "已完成",
        result: "待反馈",
        review: {
          questions: "",
          answers: "",
          problems: "一面结束。薄弱点是用户样本不够，叙事像功能介绍。",
          gaps: "用户访谈样本",
          feedback: "",
          prepare: "接下来只练一件事：补 3 次访谈，每次用「问题、放弃的方案、结果」讲 2 分钟。",
        },
      },
    ],
  },
  {
    id: "a-xhs-web",
    jobId: "xhs-web",
    stage: "Offer",
    viewed: true,
    note: "书面条款完整，试用期全薪，工作地上海。",
    next: "11 月 8 日前回复。先和澄光放在一起比构成、通勤和家庭，再决定是否签约。",
    when: "11 月 8 日前回复",
  },
  {
    id: "a-chengguang",
    jobId: "chengguang",
    stage: "Offer",
    viewed: true,
    note: "固定月薪接近，年终不保底，期权未进合同，工作地杭州。",
    next: "家庭约束是硬条件时，同城且条款清楚的一份优先。搬迁只在书面年终和期权补齐后才重新比较。",
    when: "11 月 6 日前回复",
  },
  {
    id: "a-qihang",
    jobId: "qihang",
    stage: "未通过",
    viewed: true,
    note: "确认合同主体是外包公司后停止。",
    next: "不授权顾问代投。若以后要看同类岗位，先要到供应商官网链接。",
    when: "10 月 30 日关闭",
  },
];

export const resumesSeed: ResumeVersion[] = [
  {
    id: "general",
    name: "算法岗",
    target: "算法 / 检索",
    blurb: "投算法、检索岗位。第一段写重排模块和 Recall，页面只作为课题工具。",
    summary: "投算法和检索岗位。第一段写你负责的重排模块、评测数据和 Recall，不把前端页面写成主成绩。",
    tasks: [
      { id: "target", title: "先选定这份简历投哪类岗位", detail: "现在写着不限定岗位。投递时对方看不出你要前端、算法还是产品。", done: false },
      { id: "module", title: "写清课题里哪一段是你做的", detail: "已写成你负责图文检索的重排模块，不再只写「参与课题」。", done: true },
      { id: "number", title: "写上前后变化的数字", detail: "检索效果从 61% 提到 74%，招新转化从 18% 到 35%。", done: true },
      { id: "user", title: "写上谁在用这个结果", detail: "已写明课题组拿它做演示，对方知道这不是只写在纸上的课题。", done: true },
      { id: "link", title: "在简历里放上能打开的作品", detail: "没有链接时，对方无法核对你写的项目是不是你做的。", done: false },
      { id: "split", title: "不要拿这一份去海投", detail: "不同岗位要看不同经历。通用版投出去，容易被当成和岗位无关。", done: false },
    ],
    sections: [
      {
        title: "个人信息",
        before: "林晚宁，计算机硕士在读，求职方向不限。",
        after: "林晚宁｜上海｜138****2610｜lin.wanning@example.com\n求职意向：不限定岗位。2027 届，希望用科研课题和校园技术部经历进入工程或算法岗位。",
      },
      {
        title: "专业技能",
        before: "熟悉 Python、PyTorch，了解深度学习。",
        after: "Python、PyTorch；检索与评测（Recall、NDCG）。能独立完成实验记录和评测集整理。了解 React，可用于课题演示，不是这版的主技能。",
      },
      {
        title: "工作经历",
        before: "无实习。参与实验室课题。",
        after: "无正式实习。\n实验室多模态检索课题｜2025.09–至今\n独立负责图文检索的重排模块，整理 1.2 万对评测数据，Recall@10 从 61% 提到 74%。模块被课题组复用到演示系统。",
      },
      {
        title: "教育背景",
        before: "华东师范大学 计算机硕士在读。",
        after: "华东师范大学｜计算机科学与技术 硕士｜2024.09–2027.06｜2027 届\n研究方向：多模态检索。本科同年级专业，成绩前 20%。",
      },
      {
        title: "校园经历",
        before: "担任技术部负责人。",
        after: "校园技术部负责人｜2024.10–2025.06｜12 人\n把招新从一次性宣讲改成作品任务，报名到入部的转化从 18% 到 35%。这段说明协作和推进，不替代科研项目。",
      },
    ],
  },
  {
    id: "frontend",
    name: "前端岗",
    target: "前端 / Web 开发",
    blurb: "投校招前端。同一段课题改写成可演示的页面和一次等待优化。",
    summary: "投前端 / Web 开发。用检索演示台证明独立交付：页面、请求、状态，以及等待从 1.4 秒降到 0.5 秒。",
    tasks: [
      { id: "target", title: "写清这份简历要投哪类工作", detail: "已经写明投前端 / Web 开发。", done: true },
      { id: "module", title: "写清没有实习时，你独立做过什么", detail: "已经写明你做了查询、结果对比和错误分析三个页面。", done: true },
      { id: "number", title: "写上改前改后的结果", detail: "页面等待从大约 1.4 秒降到 0.5 秒。", done: true },
      { id: "user", title: "写上谁用了你的页面", detail: "已经写明是课题组里的人在用。", done: true },
      { id: "link", title: "在简历里放一个能点开的页面", detail: "投前端时，对方要点开看你做的页面。现在只有文字描述。", done: false },
      { id: "sample", title: "用这一版换掉已经投出的旧简历", detail: "阿里那次投的是算法岗，所以一直停在筛选。不换附件，企业看到的还是旧材料。", done: false },
    ],
    sections: [
      {
        title: "个人信息",
        before: "林晚宁，计算机硕士在读。",
        after: "林晚宁｜上海｜138****2610｜lin.wanning@example.com\n求职意向：前端 / Web 开发。2027 届校招。用可演示的页面说明独立交付，论文不展开。",
      },
      {
        title: "专业技能",
        before: "熟悉 HTML、CSS、JavaScript。",
        after: "React、TypeScript；列表、表单、空状态和接口失败提示。做过一次页面等待优化（约 1.4 秒降到 0.5 秒）。Python 只作为课题里整理数据的工具。",
      },
      {
        title: "工作经历",
        before: "无实习。做过实验室算法研究。",
        after: "无正式实习。\n检索演示台｜课题组内部使用｜2025.09–至今\n用 React 完成查询、结果对比、错误分析三块界面。切换查询的等待从约 1.4 秒降到 0.5 秒。空状态、接口失败和标注冲突有明确提示。",
      },
      {
        title: "教育背景",
        before: "华东师范大学 计算机硕士在读。",
        after: "华东师范大学｜计算机科学与技术 硕士｜2024.09–2027.06｜2027 届\n本科同年级专业，成绩前 20%。与岗位相关的练习是页面和工程取舍，不是论文指标。",
      },
      {
        title: "校园经历",
        before: "组织过技术分享。",
        after: "校园技术部负责人｜2024.10–2025.06\n把分享改成代码走查，学期内完成 6 次。新人两周内能改一个小组件。",
      },
    ],
  },
  {
    id: "product",
    name: "产品岗",
    target: "产品培训生",
    blurb: "投产品培训生。先写用户、取舍和结果，指标只说明你为什么这么决定。",
    summary: "投产品培训生。保留技术背景，叙事改成问题、取舍和协作。算法指标只作为判断依据。",
    tasks: [
      { id: "target", title: "写清这份简历要投哪类工作", detail: "已经写明投产品培训生，不再把论文当主成绩。", done: true },
      { id: "module", title: "写清哪个决定是你做的", detail: "转产品面试要听你自己的取舍。现在读起来还像在介绍功能。", done: false },
      { id: "number", title: "写上改前改后的结果", detail: "入部转化从 18% 到 35%。", done: true },
      { id: "user", title: "写上你问过谁", detail: "已经写明访谈过 8 名新生。", done: true },
      { id: "link", title: "在简历里放一个能点开的页面", detail: "对方要看到你改过的招新页，不能只看文字。", done: false },
      { id: "interview", title: "再补 3 次和使用者的谈话", detail: "产品岗要看你问过使用者。每次写成：当时的问题、你放弃的做法、最后的结果。", done: false },
    ],
    sections: [
      {
        title: "个人信息",
        before: "林晚宁，计算机硕士在读，研究方向检索。",
        after: "林晚宁｜上海｜138****2610｜lin.wanning@example.com\n求职意向：产品培训生。2027 届。用校园项目里的取舍和用户结果说明转方向，不把论文当主成绩。",
      },
      {
        title: "专业技能",
        before: "熟悉 Python，参加过课题。",
        after: "用户访谈、需求整理、排期与跨角色协作。能看懂页面实现，便于和研发对齐。Recall 等指标只作为判断依据，不作为主技能。",
      },
      {
        title: "工作经历",
        before: "无实习。参与实验室课题。",
        after: "无正式实习。\n检索演示台的范围取舍｜2025.09–至今\n先做「错误分析」而不是更多模型开关，因为使用者卡住的是看不懂失败样本。指标用来决定做不做，不写进第一段成绩。",
      },
      {
        title: "教育背景",
        before: "华东师范大学 计算机硕士在读。",
        after: "华东师范大学｜计算机科学与技术 硕士｜2024.09–2027.06｜2027 届\n本科同年级专业，成绩前 20%。教育背景说明学习能力，转产品的证据放在校园项目里。",
      },
      {
        title: "校园经历",
        before: "担任技术部负责人，组织招新。",
        after: "校园技术部招新改版｜2024.10–2025.06\n访谈 8 名新生后，把报名表改成先交一个小作品，并放弃一次线下宣讲。入部转化从 18% 到 35%。",
      },
    ],
  },
];

export type InterviewQuestion = {
  id: string;
  group: string;
  topic: string;
  kind: "经历" | "技术";
  text: string;
  guide: string;
  keywords: string[];
};

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: "q1",
    group: "经历",
    topic: "独立模块",
    kind: "经历",
    text: "用两分钟讲一个你独立做完的模块。没有实习的话，讲课题也可以。",
    guide: "面试官要听到范围、动作和结果。如果回答里没有数字或使用者，对方会把它听成「我参与过」。补上前后对比，再讲一次。",
    keywords: [],
  },
  {
    id: "q2",
    group: "经历",
    topic: "没有实习",
    kind: "经历",
    text: "这个岗位写着接受应届。你怎么证明自己没有实习也能独立交付？",
    guide: "不要道歉式地说「我还没有实习」。直接指向可演示的界面或实验，并说明哪一部分是你一个人做的。",
    keywords: [],
  },
  {
    id: "q3",
    group: "经历",
    topic: "只留一段",
    kind: "经历",
    text: "如果让你在转产品的简历里只留一段经历，你留哪段，为什么删掉另一段？",
    guide: "取舍本身就是产品能力。留下有用户和结果的那段，主动说明算法指标为什么不放在第一段。",
    keywords: [],
  },
  {
    id: "js-closure",
    group: "JavaScript",
    topic: "闭包",
    kind: "技术",
    text: "什么是闭包？它解决什么问题，又会带来什么代价？",
    guide: "先说函数记住了定义时的变量。再给一个用途，比如回调或缓存。最后说明这些变量不释放就会占着内存。",
    keywords: ["闭包", "作用域", "词法", "变量"],
  },
  {
    id: "js-proto",
    group: "JavaScript",
    topic: "原型链",
    kind: "技术",
    text: "说一下原型和原型链。对象自己没有某个属性时，JavaScript 怎么找？",
    guide: "讲清对象沿原型向上找，直到 null。举一个「自己没有、从构造函数的原型上找到」的例子。",
    keywords: ["原型", "prototype", "继承"],
  },
  {
    id: "js-this",
    group: "JavaScript",
    topic: "this 指向",
    kind: "技术",
    text: "this 指向由什么决定？箭头函数和普通函数有什么不同？",
    guide: "普通函数看谁调用它。箭头函数没有自己的 this，用的是外层那个。用一次具体调用把两种分开。",
    keywords: ["this", "箭头", "调用"],
  },
  {
    id: "js-loop",
    group: "JavaScript",
    topic: "事件循环",
    kind: "技术",
    text: "讲一次事件循环。同步代码、Promise.then 和 setTimeout，谁先执行？",
    guide: "调用栈清空之后才看任务队列。微任务排在下一次宏任务之前。按这个顺序写出谁先谁后。",
    keywords: ["微任务", "宏任务", "事件循环", "调用栈"],
  },
  {
    id: "js-promise",
    group: "JavaScript",
    topic: "Promise",
    kind: "技术",
    text: "Promise 有哪几种状态？async/await 和 then 是什么关系？",
    guide: "等待、成功、失败三种，成功或失败后不再变。async 函数返回的是 Promise，await 是在等它，失败要接住。",
    keywords: ["Promise", "async", "await", "状态"],
  },
  {
    id: "js-copy",
    group: "JavaScript",
    topic: "深拷贝",
    kind: "技术",
    text: "浅拷贝和深拷贝差在哪里？对象里面还有对象时，浅拷贝会出什么问题？",
    guide: "浅拷贝只复制第一层，里面的对象还是同一个。深拷贝要逐层复制。补一句：循环引用不能靠 JSON 来回转。",
    keywords: ["浅拷贝", "深拷贝", "引用", "嵌套"],
  },
  {
    id: "js-debounce",
    group: "JavaScript",
    topic: "防抖节流",
    kind: "技术",
    text: "防抖和节流有什么区别？输入搜索和滚动监听各该用哪一个？",
    guide: "防抖是停下来才执行，适合搜索框。节流是隔一段时间执行一次，适合滚动。把触发时机说清楚。",
    keywords: ["防抖", "节流"],
  },
  {
    id: "js-scope",
    group: "JavaScript",
    topic: "let 与 const",
    kind: "技术",
    text: "var、let、const 有什么区别？暂时性死区是什么？",
    guide: "var 是函数作用域。let 和 const 是块级作用域，声明前访问会报错，这段空隙就是暂时性死区。const 是绑定不能换。",
    keywords: ["块", "提升", "暂时性", "const"],
  },
  {
    id: "net-url",
    group: "浏览器与网络",
    topic: "URL 到页面",
    kind: "技术",
    text: "从输入 URL 到页面显示，中间经过哪些步骤？",
    guide: "按解析地址、建立连接、发请求、解析文档、布局绘制这条线讲。点出脚本可能挡住解析，样式会挡住渲染。",
    keywords: ["DNS", "TCP", "HTTP", "渲染", "DOM"],
  },
  {
    id: "net-reflow",
    group: "浏览器与网络",
    topic: "重排重绘",
    kind: "技术",
    text: "什么是重排和重绘？哪些写法容易把页面做卡？",
    guide: "改布局会重排，只改颜色多半是重绘。一边读布局一边改样式会强制同步计算。动画优先用 transform。",
    keywords: ["重排", "重绘", "回流", "布局"],
  },
  {
    id: "net-cache",
    group: "浏览器与网络",
    topic: "HTTP 缓存",
    kind: "技术",
    text: "强缓存和协商缓存怎么区分？Cache-Control 和 ETag 各管哪一步？",
    guide: "强缓存没过期就不再请求。过期后带着标识去问服务器，内容没变就回 304。差别在于发不发这次请求。",
    keywords: ["强缓存", "协商", "304", "ETag", "Cache-Control"],
  },
  {
    id: "net-cors",
    group: "浏览器与网络",
    topic: "跨域",
    kind: "技术",
    text: "浏览器为什么要有同源策略？接口跨域时，前端通常怎么处理？",
    guide: "同源看协议、域名和端口。接口跨域优先讲服务端允许的来源。带自定义请求头时，浏览器会先发一次预检。",
    keywords: ["同源", "跨域", "CORS", "预检"],
  },
  {
    id: "net-https",
    group: "浏览器与网络",
    topic: "HTTPS",
    kind: "技术",
    text: "HTTP 和 HTTPS 差在哪？握手时，对称加密和非对称加密各做什么？",
    guide: "HTTPS 是 HTTP 加上 TLS。证书用来确认对方是谁，非对称加密用来协商密钥，真正传数据用对称加密。",
    keywords: ["HTTPS", "TLS", "对称", "非对称", "证书"],
  },
  {
    id: "net-tcp",
    group: "浏览器与网络",
    topic: "TCP 握手",
    kind: "技术",
    text: "TCP 和 UDP 的差别是什么？建立连接为什么是三次握手？",
    guide: "TCP 保证按序到达，UDP 不保证。三次是为了双方都确认自己能发、对方能收。不要和四次挥手混在一起。",
    keywords: ["TCP", "UDP", "握手", "可靠"],
  },
  {
    id: "net-security",
    group: "浏览器与网络",
    topic: "XSS 与 CSRF",
    kind: "技术",
    text: "XSS 和 CSRF 分别是什么？页面上你会做哪几件具体的事来防？",
    guide: "XSS 是把脚本注进页面，靠转义输出。CSRF 是拿着用户的登录态跨站提交，靠限制 Cookie 或校验令牌。两种不要讲成同一种。",
    keywords: ["XSS", "CSRF", "转义", "Cookie", "令牌"],
  },
  {
    id: "react-state",
    group: "React",
    topic: "状态驱动",
    kind: "技术",
    text: "为什么说 React 里界面是状态的函数？虚拟 DOM 替你做了什么？",
    guide: "同样的状态得到同样的界面。你描述结果，React 对比前后两棵描述，再改真实 DOM 上有变化的部分。",
    keywords: ["状态", "虚拟", "声明", "DOM"],
  },
  {
    id: "react-key",
    group: "React",
    topic: "key 与 diff",
    kind: "技术",
    text: "列表的 key 为什么不要用数组下标？React 比较两棵树时，大致按什么规则？",
    guide: "key 用来认出「这还是上一行的那一项」。用下标时，中间插一行会让后面的项错位。比较按层进行，不跨层配对。",
    keywords: ["key", "下标", "同层", "复用"],
  },
  {
    id: "react-effect",
    group: "React",
    topic: "useEffect",
    kind: "技术",
    text: "useEffect 在什么时候执行？依赖数组漏写一项会怎样？",
    guide: "它在这一帧画完之后执行。依赖漏写，里面会一直拿着旧值。依赖写多了，会比预想更频繁地重跑。",
    keywords: ["依赖", "副作用", "渲染", "useEffect"],
  },
  {
    id: "react-derive",
    group: "React",
    topic: "哪些该进 state",
    kind: "技术",
    text: "组件里哪些数据该放进 state，哪些不该？多放一份会出什么问题？",
    guide: "会变、而且不能由别的数据算出来的，才放进 state。列表长度这种再存一份，两处就会不一致。",
    keywords: ["state", "状态", "派生", "计算"],
  },
  {
    id: "react-perf",
    group: "React",
    topic: "列表卡顿",
    kind: "技术",
    text: "一个列表页滚动卡顿，你会按什么顺序查？",
    guide: "先分清是请求慢还是渲染慢。渲染上先看是不是一次画了太多行、滚动时有没有读布局。再考虑分页或只画可见区域。",
    keywords: ["渲染", "请求", "重排", "分页", "虚拟"],
  },
];

export function jobById(id: string) {
  return jobs.find((job) => job.id === id);
}

export function matchScore(job: Job) {
  const raw = 58 + job.reasons.length * 12 - job.gaps.length * 8 - (job.risk === "高" ? 36 : job.risk === "中" ? 10 : 0);
  return Math.max(8, Math.min(96, raw));
}

export const stageNext: Record<Stage, string> = {
  已投递: "等查看或笔试通知。若两个工作日没有新状态，检查投出去的是哪一版简历。",
  笔试: "只准备这个岗位的职责和一张卡片上的考点，不平均复习所有知识点。",
  面试: "面试后只记一个薄弱点，下一次只练这一件事。",
  Offer: "在有效期内比较薪资构成、工作内容、公司规模、通勤和家庭。",
  未通过: "停止等待。按薄弱点改完材料，再投同类岗位。",
};
