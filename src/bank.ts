import type { InterviewQuestion } from "./data";

function tech(id: string, group: string, topic: string, text: string, guide: string, keywords: string[]): InterviewQuestion {
  return { id, group, topic, kind: "技术", text, guide, keywords };
}

function story(id: string, group: string, topic: string, text: string): InterviewQuestion {
  return {
    id,
    group,
    topic,
    kind: "经历",
    text,
    guide: "用「我」圈定范围，补一个数字，并说清谁在使用结果。",
    keywords: [],
  };
}

export const questionBank: InterviewQuestion[] = [
  tech("net-java", "互联网", "Java 集合", "HashMap 为什么在并发写时不安全？你准备怎么讲。", "先给结论，再讲扩容和链表成环或数据覆盖。", ["扩容", "并发", "hash"]),
  tech("net-sql", "互联网", "SQL", "一个慢查询你先看哪三样东西？", "先说索引、扫描行数和是否回表。", ["索引", "扫描"]),
  story("net-bug", "互联网", "线上问题", "讲一次你把等待时间或错误率降下来的改动。"),
  story("net-coop", "互联网", "协作", "讲一次你和后端或设计意见不一致，最后怎么定的。"),
  story("fin-risk", "金融", "风控", "如果一笔交易金额突然比平时高很多，你会先核对哪几项再决定拦不拦？"),
  story("fin-report", "金融", "报表", "讲一次口径不一致时，你怎么把数字对上。"),
  tech("fin-term", "金融", "利息", "单利和复利差在哪？用一句话给客户讲。", "先给公式，再说钱会滚到本金上。", ["本金", "复利"]),
  story("fin-secret", "金融", "保密", "客户资料不能带出办公区。你在简历或作品里会怎么处理截图？"),
  story("prod-cut", "产品", "取舍", "需求排期满了，你砍掉哪一个，依据是什么？"),
  story("prod-user", "产品", "访谈", "讲一次你问过使用者之后，改掉了原来的方案。"),
  story("prod-metric", "产品", "指标", "这个功能上线后，你看哪个数判断它有没有用？"),
  story("edu-class", "教育", "课堂", "学生听不懂时，你怎么判断是内容难，还是例子选错了？"),
  story("edu-parent", "教育", "沟通", "家长质疑成绩，你准备先说哪一句。"),
  story("med-case", "医疗", "问诊", "病人描述很乱时，你按什么顺序把信息问全？"),
  story("med-safe", "医疗", "用药", "发现医嘱和过敏史可能冲突，你先找谁确认？"),
  story("mfg-quality", "制造", "质量", "一批货不良率升高，你先停线还是先抽样？为什么？"),
  story("mfg-shift", "制造", "交接", "夜班留下一个没写完的异常，你接班后第一步做什么？"),
  story("car-test", "汽车", "测试", "一次路试出现偶发故障，你怎么记录才能让别人复现？"),
  story("car-safe", "汽车", "安全", "功能赶不上发布日期，你会不会先关掉这项安全提示？"),
  story("sale-no", "销售", "拒绝", "客户说再考虑，你下一句问什么，而不是立刻报价。"),
  story("sale-need", "销售", "需求", "讲一次你发现客户要的和采购单上写的不是同一件事。"),
  story("design-crit", "设计", "评审", "方案被说不好看，你怎么把反馈收成可以改的一条。"),
  story("ops-camp", "运营", "活动", "活动数据低于预期，你先查渠道、文案还是人群？"),
  story("hr-hire", "人事", "招聘", "业务方要的人和市场上能招到的人不一致，你怎么把标准写清楚？"),
];
