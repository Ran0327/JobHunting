export type TodayTask = { id: string; done: boolean; text: string };

const dailyUnsent = 150;

export function buildTodayTasks(submittedCount: number): TodayTask[] {
  return [
    {
      id: "apply",
      done: false,
      text: `投简历：已投 ${submittedCount} 份，未投 ${dailyUnsent} 份`,
    },
    { id: "edit-alibaba", done: false, text: "简历要改：阿里巴巴中后台前端还用着算法岗，换成前端岗后再决定重投" },
    { id: "exam-bytedance", done: false, text: "准备笔试：字节跳动前端研发，11月4日 19:00" },
    { id: "interview-xhs", done: false, text: "准备面试：小红书产品培训生，11月2日，先补 3 次用户访谈" },
    { id: "reply-offers", done: false, text: "比较并回复 Offer：澄光智能 11月6日前，小红书社区前端 11月8日前" },
    { id: "versions", done: true, text: "简历已分成算法岗、前端岗、产品岗" },
    { id: "campus", done: true, text: "已确认可以参加 2027 届校招" },
  ];
}

export function summarizeTasks(tasks: TodayTask[]) {
  const total = tasks.length;
  const done = tasks.filter((item) => item.done).length;
  const pending = total - done;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pending, rate };
}
