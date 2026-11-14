export type JobPostingBlock = {
  title: string;
  lines: string[];
};

/** 按职位 id 保存的招聘网站原文。采集结果写入这里；没有原文时不要用岗位介绍补上。 */
export const jobPostings: Record<string, JobPostingBlock[]> = {};
