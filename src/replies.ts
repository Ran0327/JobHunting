import { intentions, jobFacts } from "./catalog";
import { jobById, jobs, matchScore, type Job } from "./data";
import { findInterviewQuestion } from "./interviewCatalog";

export type Prompt = { id: string; group: string; label: string; answer: string };

export const prompts: Prompt[] = [
  {
    id: "write-exp",
    group: "经历与方向",
    label: "没有实习，科研和校园经历怎么写？",
    answer:
      "可以写，而且应该写。科研改成三句：你负责的模块、评测或使用者、一个前后对比的数字。避免「参与课题」「协助完成」。\n校园经历写成职责和结果，用来证明协作。它不能替代项目，但可以补上实习里的团队信息。\n投前端时，把同一课题改成可演示的界面和工程取舍；投算法时，保留指标、失败实验和个人模块。不要两份简历用同一段话。",
  },
  {
    id: "switch",
    group: "经历与方向",
    label: "不想继续原专业，能转哪些方向？",
    answer:
      "以你现在的材料，近的方向是前端工程和算法工程；产品可以试，但要换证据，不能把论文原样投过去。\n能迁过去的是：独立模块、指标或体验上的取舍、技术部里的排期和招新转化。\n产品岗还缺一个用户样本。先做 3 次访谈，写成「问题、你放弃的方案、结果」，再使用转产品版简历。不建议同时用一份通用简历海投。",
  },
  {
    id: "versions",
    group: "经历与方向",
    label: "不同岗位为什么要分成多份简历？",
    answer:
      "档案只留一份：教育、联系方式、课题里的数字、校园经历的结果。叙事按岗位分成版本。\n前端校招版把演示台放在第一段；转产品版把招新取舍放在第一段；算法岗位才把 Recall 放在第一段。\n阿里这条停在筛选，就是因为通用科研版看不出你和中后台页面的关系。",
  },
  {
    id: "employment",
    group: "识别岗位",
    label: "怎么区分直招、外包和中介？",
    answer:
      "先看合同会和谁签，而不是帖子标题里的公司。\n直招：招聘主体、面试官和劳动合同是同一家。外包：面试可能在银行或大厂项目组，合同和社保在供应商。中介：对方只收简历或代投，用人方经常不公开。\n外包不是不能去，但薪资、加班和简历上的公司名都要按供应商理解。中介在给出用人方官方入口之前，不要授权代投。启航信息就是外包，职达顾问那条是中介。",
  },
  {
    id: "campus",
    group: "识别岗位",
    label: "还没缴社保，还能参加校招吗？",
    answer:
      "你现在的状态是在读、未缴社保，2027 届校招通道仍然开放。\n开始按社招准备的时点通常是：毕业并且以全职身份缴社保，或已经签了三方并开始履约。实习发的补贴一般不改变校招身份，但要以当季招聘简章为准。\n若接受一份会缴社保的实习或提前入职，先问 HR 这是否影响下一届校招报名，把答复留在邮件里。",
  },
  {
    id: "fake",
    group: "识别岗位",
    label: "怎么识别以招聘为名的培训？",
    answer:
      "这些信号出现任意两条，就停下来：保证就业或保证薪资、先缴费或办理分期、面试地点在教室、催你交身份证和完整简历、用人方说不清。\n真实企业可以要求简历，但不会用「锁定名额」换证件，也不会把培训合同当成录用通知。\n职位页里「Java 高薪就业（带薪实训）」就是这种结构。处理方式是不提交、不付费，已提交证件就告诉学校就业指导中心。",
  },
  {
    id: "alias",
    group: "识别岗位",
    label: "搜一个职业，怎么找到名称不同的同类岗位？",
    answer:
      "搜「前端」时，同时看 Web 开发、前端研发、客户端（Web）。名称差一截，职责经常是同一类。\n判断是不是同一工作，看日常产出：页面和交互，还是模型与评测，还是需求文档。\n职位列表已经按别名检索。首页推荐会去掉高风险和明显不相关的帖子。",
  },
  {
    id: "relevant",
    group: "识别岗位",
    label: "怎么减少不相关推荐？",
    answer:
      "推荐只保留和你的方向、城市约束相符，且能说清入口的岗位。中介代投、培训引流、用人方不公开的帖子留在职位页，用风险筛选核对，不进首页。\n方向弱相关时降权。转产品如果还是论文叙事，就不要推荐产品岗。",
  },
  {
    id: "prefill",
    group: "投递之前",
    label: "网申要重复填写，怎么减少？",
    answer:
      "重复的是个人档案，不是每份简历的叙事。档案只保留一份：教育、联系方式、课题里的数字、校园经历的结果。\n在职位详情使用「预填网申」。先核对档案，再按岗位只改三段：摘要、项目顺序、最想让对方追问的一行。\n不要把代投授权当成省时间的办法。省下的填表时间，不值得用简历流向不明来换。",
  },
  {
    id: "intern-tradeoff",
    group: "投递之前",
    label: "实习的转正机会怎么权衡？",
    answer:
      "实习要同时看三件事：转正是不是单独评估、公司名对简历的帮助、会不会占掉秋招准备。\n商汤这条和课题吻合，留用有历史口径，但每周到岗 4 天以上。8 月若还没有评估节点，就应把时间拨回秋招。\n名气不能替代转正条件。把「何时给反馈、不留用是否影响毕业」问清楚再决定入职天数。",
  },
  {
    id: "extra",
    group: "投递之前",
    label: "写着接受应届，还有附加要求吗？",
    answer:
      "「接受应届」只说明身份门槛，不说明竞争门槛。前端岗常见的附加要求是一段实习，或一个能讲 15 分钟的独立项目。\n没有实习时，不要伪装成在职。把课题改成可演示模块，并在第一段写清你个人的范围。\n职位详情里的「附加要求」就是在投之前要补的洞。美团、字节、携程三条都写了这一点。",
  },
  {
    id: "salary",
    group: "投递之前",
    label: "期望薪资怎么定，怎么跟 HR 谈？",
    answer:
      "先拆结构，再报数字。月薪、绩效、年终、签字费和试用期比例是五件不同的事。\n以你的城市和方向，校招前端可以把 18–25k 作为区间，报价用上沿，并补一句可以按职级调整。\n优先争取的顺序：试用期全薪、年终是否有保底月数、签字费的服务期。不要只把总包口头数字抬高。对方不给构成时，不进入具体砍价。",
  },
  {
    id: "structure",
    group: "投递之前",
    label: "真实薪资构成怎么看？",
    answer:
      "每个职位详情都把底薪、绩效、奖金和附带条件拆开。口头「15 薪」或「20k+」在没有构成之前不算数。\n澄光的 20k 看起来接近小红书，但年终写的是「视经营情况」，期权也没进合同。比较时用这四格，不用一个总数。",
  },
  {
    id: "duty",
    group: "投递之前",
    label: "实际职责和休息制度怎么问？",
    answer:
      "职责看日常产出的三行，不看头衔。休息看双休是否稳定、忙的是节点还是每一天。\n问在职的人时用三句：上周实际离开时间、双休是否稳定、导师如何给反馈。问不到人，就降低这个 Offer 在「氛围」上的把握。",
  },
  {
    id: "channel",
    group: "投递之前",
    label: "没有宣讲会时，投递入口在哪？",
    answer:
      "没有宣讲会不等于没有入口。研究所这条的真实入口是人事邮箱和学院就业网，招聘网站的转载帖经常过期。\n小公司看官网域名邮箱。中介帖在拿到用人方官方链接之前，不当作入口。\n每个职位详情右侧有「投递入口」，可靠与否会直接标明。",
  },
  {
    id: "viewed",
    group: "投递之后",
    label: "怎么知道企业有没有查看简历？",
    answer:
      "进度里把「已查看」和「尚未查看」分开。美团这条已标记为 HR 查看，仍处在「已投递」。查看不等于进入笔试。\n若查看后两个工作日没有下一状态，就检查附件是不是前端版，而不是反复重投。",
  },
  {
    id: "no-interview",
    group: "投递之后",
    label: "投了没有面试，问题出在哪？",
    answer:
      "阿里这条停在筛选，渠道没有问题，简历叙事有问题。\n「参与课题」看不出模块、数字和使用者。对方无法判断要不要给你 15 分钟。\n先改前端校招版的第一段，再投名称相近的 Web 开发，不要用同一份通用科研版继续海投。",
  },
  {
    id: "prep",
    group: "投递之后",
    label: "拿到面试要准备什么？",
    answer:
      "准备材料只围绕岗位卡片上的职责，不要平均复习所有知识点。\n前端岗：项目范围、一次失败或性能问题、你和后端如何对齐。\n算法实习：个人模块、指标定义、一个失败实验。产品岗：一次取舍和用户是谁。",
  },
  {
    id: "weak",
    group: "投递之后",
    label: "面试后薄弱点怎么练？",
    answer:
      "产品一面的薄弱点已经记在进度里：用户样本不够，叙事像功能介绍。\n接下来只练一件事：补 3 次访谈，每次用「问题、放弃的方案、结果」讲 2 分钟。\n二面不要再追加模型指标。那会把对话拉回技术岗。",
  },
  {
    id: "wait",
    group: "投递之后",
    label: "流程到了哪里，还要不要等？",
    answer:
      "看进度列，不看焦虑。已投递且已查看：等一个明确的笔试或筛选截止，同时改简历。笔试和面试：按卡片上的时间准备。Offer：在有效期内比较。未通过：停止等待。\n没有新状态时，等待本身不是行动。行动是改材料或准备下一次评价。",
  },
  {
    id: "culture",
    group: "投递之后",
    label: "入职前怎么了解加班和氛围？",
    answer:
      "入职前要问的是具体组，不是公司口号。问三句：上周实际离开时间、双休是否稳定、导师如何给反馈。\n小红书这条可以问已约到的学姐陈可。澄光智能可以问前员工发薪和周日发布是否常态。\n问不到人，就降低该 Offer 在「氛围」一项上的把握，而不是用评分网站的总分代替。",
  },
  {
    id: "offers",
    group: "投递之后",
    label: "两个 Offer 怎么一起看？",
    answer:
      "两个 Offer 放在进度页顶部比较：薪资构成、日常工作、公司规模、通勤、家庭。\n小红书的书面条款更完整，并且在上海。澄光的固定月薪看起来接近，但年终不保底、期权未写入合同，还要承担杭州往返。\n若家庭约束是硬条件，同城且条款清楚的一份优先。搬迁只有在书面年终和期权补齐后才重新比较。",
  },
  {
    id: "break",
    group: "投递之后",
    label: "已经接受或签了约，又想去另一家",
    answer:
      "还没签三方：邮件感谢并说明不去，避免失联。\n已经签约：按协议准备解约申请、对方要求的说明、新单位接收证明。违约金以合同数字为准。\n先拿到要去的那家书面 Offer，再启动解约。不要两头口头承诺。",
  },
  {
    id: "find-fe",
    group: "岗位分析",
    label: "帮我找出和前端相关的岗位",
    answer: "按职位库里的前端岗汇总。",
  },
  {
    id: "common",
    group: "岗位分析",
    label: "这些岗位的要求有什么共性",
    answer: "按当前筛到的岗位归纳共同要求。",
  },
  {
    id: "stack",
    group: "岗位分析",
    label: "这些岗位都提到哪些技术栈",
    answer: "按职位正文里出现的技术词归纳。",
  },
];

export const promptGroups = ["经历与方向", "识别岗位", "投递之前", "投递之后", "岗位分析"];

const skillWords = ["React", "TypeScript", "JavaScript", "Python", "PyTorch", "Java", "检索", "页面", "接口", "列表", "表单", "实验", "校招", "实习"];

function analyzeJobs(text: string) {
  const intention = intentions.find((item) => text.includes(item.name.replace("岗", "")) || text.includes(item.name));
  const picked = jobs.filter((job) => {
    if (intention) return intention.match(job);
    if (/前端|Web/.test(text)) return intentions[1].match(job);
    if (/算法|检索/.test(text)) return intentions[0].match(job);
    if (/产品/.test(text)) return intentions[2].match(job);
    return job.recommend;
  });
  if (picked.length === 0) return "";
  const names = picked.map((job) => `${job.company.split("·")[0]} · ${job.title}（${jobFacts(job).source}）`).join("\n");
  const blob = picked.flatMap((job) => [...job.duties, ...job.conditions, ...job.tags, job.title]).join("\n");
  const skills = skillWords.filter((word) => blob.includes(word));
  const duties = picked.flatMap((job) => job.duties).slice(0, 6);
  return `按现有职位筛到 ${picked.length} 个：\n${names}\n\n这些岗位反复出现的要求：\n${duties.map((item) => `· ${item}`).join("\n")}\n\n提到的技术栈或关键词：${skills.join("、") || "这批职位正文里没有集中的技术名词。"}`;
}

function brief(job: Job) {
  const lines = [
    `${job.company} · ${job.title}`,
    `用工类型是${job.employment}，招聘季类型是${job.recruit}。${job.riskText}`,
    `匹配分 ${matchScore(job)}。${job.reasons[0] ?? "方向弱相关，不作为主投。"}`,
    job.gaps[0] ? `先补的缺口：${job.gaps[0]}` : "",
    job.channelOk ? `入口可核对：${job.channel}` : `入口不可靠：${job.channel}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function answerQuestion(input: string, jobId?: string | null) {
  const text = input.trim();
  if (/找出|共性|技术栈/.test(text)) {
    const analyzed = analyzeJobs(text);
    if (analyzed) return analyzed;
  }
  const selected = jobId ? jobById(jobId) : undefined;
  const named = jobs.find((job) => text.includes(job.company) || text.includes(job.title));
  const focused = named ?? (selected && /这个岗位|这家|当前岗位|值不值得|帮我看|分析/.test(text) ? selected : undefined);
  const exact = prompts.find((item) => item.label === text);
  if (exact && focused) return `${exact.answer}\n\n若对着「${focused.company} · ${focused.title}」看：\n${brief(focused)}`;
  if (exact) return exact.answer;
  if (focused) return brief(focused);
  const fuzzy = prompts.find((item) => item.label.slice(0, 8).length > 0 && text.includes(item.label.slice(0, 6)));
  if (fuzzy) return fuzzy.answer;
  return "我可以沿你的求职顺序往下拆：经历怎么写、方向能不能转、岗位是不是直招、值不值得投、投了之后卡在哪。\n直接点左侧的一个问题，或从职位详情把岗位带过来再问。";
}

export function reviewAnswer(questionId: string, raw: string) {
  const question = findInterviewQuestion(questionId);
  if (!question) return "先选定一道题，再提交回答。";
  const text = raw.trim();
  if (question.kind === "技术") {
    if (text.length < 20) return `先把结论说出来。${question.guide}`;
    const hit = question.keywords.some((word) => text.toLowerCase().includes(word.toLowerCase()));
    if (!hit) return `还没碰到这题要的关键词。${question.guide}`;
    return `关键词有了。把原因收成两三句，不要展开成讲义。\n${question.guide}`;
  }
  if (text.length < 24) return `这段还太短。${question.guide}`;
  const misses: string[] = [];
  if (!/我/.test(text)) misses.push("用「我」圈定个人范围");
  if (!/\d/.test(text)) misses.push("补一个前后对比的数字，或人数、时长");
  if (questionId === "q3" && !/删|不放|放弃|留/.test(text)) misses.push("明确说删掉哪一段、为什么");
  if (questionId !== "q2" && !/用户|师兄|同学|新生|使用|组/.test(text)) misses.push("点明谁在使用结果");
  if (misses.length === 0) return `这版已经有范围和结果。可以再收束到两分钟：先讲模块，再讲一个取舍，最后停在数字上。\n${question.guide}`;
  return `还缺：${misses.join("；")}。\n${question.guide}`;
}
