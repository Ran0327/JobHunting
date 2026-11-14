import { interviewStamp } from "./components/WhenPicker";
import {
  stageNext,
  type Application,
  type InterviewMode,
  type InterviewReview,
  type InterviewRound,
  type InterviewRoundResult,
  type InterviewRoundStatus,
  type Stage,
} from "./data";

const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const statuses: InterviewRoundStatus[] = ["待安排", "已安排", "已完成"];
const results: InterviewRoundResult[] = ["待反馈", "通过", "未通过"];
const modes: InterviewMode[] = ["线上", "线下"];

export function chineseOrdinal(value: number) {
  if (value <= 0) return String(value);
  if (value < 10) return digits[value];
  if (value === 10) return "十";
  if (value < 20) return `十${digits[value - 10]}`;
  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${digits[tens]}十${ones ? digits[ones] : ""}`;
  }
  return String(value);
}

export function roundName(order: number) {
  return `第${chineseOrdinal(order)}轮面试`;
}

export function blankReview(): InterviewReview {
  return { questions: "", answers: "", problems: "", gaps: "", feedback: "", prepare: "" };
}

export function createRound(order: number, patch: Partial<InterviewRound> = {}): InterviewRound {
  return {
    id: patch.id || `r-${Date.now()}-${order}`,
    order,
    name: patch.name?.trim() || roundName(order),
    date: patch.date ?? "",
    time: patch.time ?? "",
    mode: patch.mode ?? "",
    interviewer: patch.interviewer ?? "",
    place: patch.place ?? "",
    note: patch.note ?? "",
    status: patch.status ?? "待安排",
    result: patch.result ?? "",
    review: { ...blankReview(), ...patch.review },
  };
}

export function roundWhen(round: Pick<InterviewRound, "date" | "time">) {
  if (!round.date) return "时间待定";
  return interviewStamp(round.date, round.time);
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function sanitizeRound(value: unknown): InterviewRound | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<InterviewRound>;
  if (!raw.id) return null;
  const order = Number(raw.order);
  const review = raw.review ?? blankReview();
  return createRound(Number.isFinite(order) && order > 0 ? order : 1, {
    id: String(raw.id),
    order: Number.isFinite(order) && order > 0 ? order : 1,
    name: text(raw.name),
    date: text(raw.date),
    time: text(raw.time),
    mode: modes.includes(raw.mode as InterviewMode) ? raw.mode : "",
    interviewer: text(raw.interviewer),
    place: text(raw.place),
    note: text(raw.note),
    status: statuses.includes(raw.status as InterviewRoundStatus) ? raw.status : "待安排",
    result: results.includes(raw.result as InterviewRoundResult) ? raw.result : "",
    review: {
      questions: text(review.questions),
      answers: text(review.answers),
      problems: text(review.problems),
      gaps: text(review.gaps),
      feedback: text(review.feedback),
      prepare: text(review.prepare),
    },
  });
}

export function reindex(rounds: InterviewRound[]) {
  return [...rounds]
    .sort((a, b) => a.order - b.order)
    .map((round, index) => {
      const order = index + 1;
      const name = round.name === roundName(round.order) ? roundName(order) : round.name;
      return { ...round, order, name };
    });
}

export function legacyRound(item: Application): InterviewRound {
  const told = `${item.note} ${item.when ?? ""}`;
  const finished = /结束|通过|未通过/.test(told);
  return createRound(1, {
    id: `r-${item.id}-1`,
    date: item.interviewAt ?? "",
    time: item.interviewTime ?? "",
    note: item.when && !item.interviewAt ? item.when : "",
    status: item.interviewAt ? "已安排" : finished ? "已完成" : "待安排",
    result: finished ? "待反馈" : "",
    review: { ...blankReview(), problems: item.note, prepare: item.next },
  });
}

export function mirrorStamp(item: Application): Application {
  const rounds = reindex(item.rounds ?? []);
  const upcoming = rounds.find((round) => round.date && round.status !== "已完成") ?? [...rounds].reverse().find((round) => round.date);
  if (!upcoming) return { ...item, rounds };
  return { ...item, rounds, interviewAt: upcoming.date, interviewTime: upcoming.time };
}

export function normalizeApplication(item: Application): Application {
  const rounds = Array.isArray(item.rounds)
    ? reindex(item.rounds.map(sanitizeRound).filter((round): round is InterviewRound => Boolean(round)))
    : item.stage === "面试"
      ? [legacyRound(item)]
      : [];
  return mirrorStamp({ ...item, rounds });
}

export function withStage(item: Application, stage: Stage): Application {
  const next: Application = {
    ...item,
    stage,
    viewed: stage === "已投递" ? item.viewed : true,
    next: stageNext[stage],
  };
  if (stage === "面试" && item.stage !== "面试" && !(item.rounds && item.rounds.length > 0)) {
    next.rounds = [createRound(1, { id: `r-${item.id}-${Date.now()}` })];
  }
  return mirrorStamp(next);
}
