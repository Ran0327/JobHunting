import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { resumeFileName, withDrafts } from "./catalog";
import { createId } from "./ids";
import { clearDraftDocs } from "./resumeDocs";
import {
  applicationsSeed,
  profile as profileSeed,
  resumesSeed,
  stageNext,
  stages,
  type Application,
  type InterviewRound,
  type Job,
  type Profile,
  type ResumeDraft,
  type ResumeSection,
  type ResumeVersion,
  type Stage,
} from "./data";
import { mirrorStamp, normalizeApplication, reindex, withStage } from "./interview";
import { formatDraftStamp, formatStamp } from "./stamp";

const KEY = "tujian-state-v1";
const BACKUP_KEY = "tujian-state-backup";
const STORAGE_VERSION = 2;
const moduleNames = ["个人信息", "专业技能", "工作经历", "教育背景", "校园经历"];

export type ChatMessage = { id: string; role: "user" | "assistant"; text: string; image?: string };
export type ChatThread = { id: string; title: string; messages: ChatMessage[] };
export type SharePost = { id: string; title: string; excerpt: string; at: string; draftId?: string };
export type ShareComment = { id: string; postId: string; text: string; at: string };
export const postCategories = ["求职经验", "面试交流", "求职问答", "其他"] as const;
export type PostCategory = (typeof postCategories)[number];
export type CommunityPost = { id: string; title: string; category: PostCategory; body: string; at: string; updatedAt?: string };

export const postLimits = { title: 40, body: 2000 };

export function postError(input: { title: string; category: string; body: string }) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return "请填写帖子标题";
  if (title.length > postLimits.title) return `标题不超过 ${postLimits.title} 个字`;
  if (!postCategories.includes(input.category as PostCategory)) return "请选择帖子分类";
  if (!body) return "请填写帖子正文";
  if (body.length > postLimits.body) return `正文不超过 ${postLimits.body} 个字`;
  return "";
}

type Persisted = {
  schemaVersion: number;
  profile: Profile;
  favorites: string[];
  applications: Application[];
  resumes: ResumeVersion[];
  currentResumeId: string;
  currentDraftId: string;
  currentDraftByResume: Record<string, string>;
  nameStyleId: string;
  pendingJobId: string | null;
  pendingPick: { resumeId: string; draftId: string; nameStyleId: string } | null;
  lastChecklistAt: number;
  messages: ChatMessage[];
  chats: ChatThread[];
  currentChatId: string;
  shares: SharePost[];
  shareLikes: string[];
  shareSaves: string[];
  shareComments: ShareComment[];
  posts: CommunityPost[];
  postLikes: string[];
  postSaves: string[];
  postComments: ShareComment[];
  deepJobs: string[];
};

type DraftInit = Partial<Pick<ResumeDraft, "label" | "summary" | "sections" | "body">>;
type LeaveGuard = (next: () => void) => void;

const welcome: ChatMessage = {
  id: "m0",
  role: "assistant",
  text: "我可以沿你的求职顺序往下拆：经历怎么写、方向能不能转、岗位是不是直招、值不值得投、投了之后卡在哪。也可以让我按方向找岗位，并归纳这些岗位共同要求的能力。\n直接点左侧的一个问题，或从职位详情把岗位带过来再问。",
};

function normalizeProfile(value: Partial<Profile> | null | undefined): Profile {
  if (!value || typeof value !== "object") return profileSeed;
  const directions = Array.isArray(value.directions)
    ? [...new Set(value.directions.map((item) => String(item).trim()).filter(Boolean).map((item) => (item === "可考虑产品" ? "产品经理" : item)))]
    : profileSeed.directions;
  const avatar = typeof value.avatar === "string" && value.avatar.startsWith("data:image/") ? value.avatar : "";
  return { ...profileSeed, ...value, directions, avatar };
}

function seed(): Persisted {
  const resumes = resumesSeed.map((item) => withDrafts(item));
  const currentResume = resumes.find((item) => item.id === "frontend") ?? resumes[0];
  const currentDraftByResume = Object.fromEntries(
    resumes.map((resume) => [resume.id, resume.drafts?.[0]?.id ?? ""]),
  );
  return {
    schemaVersion: STORAGE_VERSION,
    profile: profileSeed,
    favorites: ["ctrip", "sensetime"],
    applications: applicationsSeed,
    resumes,
    currentResumeId: currentResume.id,
    currentDraftId: currentResume.drafts?.[0]?.id ?? "",
    currentDraftByResume,
    nameStyleId: "name-role",
    pendingJobId: null,
    pendingPick: null,
    lastChecklistAt: 0,
    messages: [welcome],
    chats: [{ id: "c0", title: "新对话", messages: [welcome] }],
    currentChatId: "c0",
    shares: [],
    shareLikes: [],
    shareSaves: [],
    shareComments: [],
    posts: [],
    postLikes: [],
    postSaves: [],
    postComments: [],
    deepJobs: [],
  };
}

function isPostCategory(value: string): value is PostCategory {
  return (postCategories as readonly string[]).includes(value);
}

function loadPosts(value: unknown): CommunityPost[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<CommunityPost>;
    if (typeof row.id !== "string" || typeof row.title !== "string" || typeof row.body !== "string" || typeof row.category !== "string" || !isPostCategory(row.category)) return [];
    const title = row.title.trim();
    const body = row.body.trim();
    if (!title || !body) return [];
    return [{ id: row.id, title: title.slice(0, postLimits.title), category: row.category, body: body.slice(0, postLimits.body), at: String(row.at ?? ""), updatedAt: row.updatedAt ? String(row.updatedAt) : undefined }];
  });
}

function loadComments(value: unknown): ShareComment[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && item.id && item.postId && item.text);
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeSections(value: unknown, fallback: ResumeSection[]): ResumeSection[] {
  if (!Array.isArray(value)) return fallback.map((section) => ({ ...section }));
  const rows = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<ResumeSection>;
    return [{ title: asText(row.title), before: asText(row.before), after: asText(row.after) }];
  });
  return rows.length ? rows : fallback.map((section) => ({ ...section }));
}

function uniqueDraftId(resumeId: string, rawId: string, index: number, used: Set<string>) {
  const base = rawId && !/^v\d+$/.test(rawId) ? rawId : `${resumeId}-v${index + 1}`;
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  return id;
}

function normalizeDraft(
  resumeId: string,
  value: unknown,
  index: number,
  fallbackSections: ResumeSection[],
  fallbackSummary: string,
  used: Set<string>,
  idMap: Record<string, string>,
): ResumeDraft {
  const raw = value && typeof value === "object" ? (value as Partial<ResumeDraft>) : {};
  const rawId = asText(raw.id);
  const id = uniqueDraftId(resumeId, rawId, index, used);
  if (rawId) idMap[rawId] = id;
  return {
    id,
    label: asText(raw.label, `版本${index + 1}`),
    savedAt: asText(raw.savedAt, "编辑记录"),
    summary: asText(raw.summary, fallbackSummary),
    sections: Array.isArray(raw.sections)
      ? normalizeSections(raw.sections, [])
      : fallbackSections.map((section) => ({ ...section })),
    body: typeof raw.body === "string" ? raw.body : undefined,
  };
}

function normalizeResume(value: ResumeVersion, used: Set<string>, idMap: Record<string, string>): ResumeVersion {
  const resume = value as Partial<ResumeVersion> & { id: string };
  const seeded = resumesSeed.find((item) => item.id === resume.id);
  const name = asText(resume.name, seeded?.name ?? "未命名简历") || "未命名简历";
  const target = asText(resume.target, seeded?.target ?? name);
  const summary = asText(resume.summary, seeded?.summary ?? "");
  const blurb = asText(resume.blurb, seeded?.blurb ?? target);
  const sections = normalizeSections(resume.sections, seeded?.sections ?? blankSections());
  const tasks = Array.isArray(resume.tasks)
    ? resume.tasks.filter((task): task is ResumeVersion["tasks"][number] => Boolean(task && typeof task.id === "string"))
    : seeded?.tasks ?? [];
  const rawDrafts = Array.isArray(resume.drafts) ? resume.drafts : [];
  const drafts = rawDrafts.length
    ? rawDrafts.map((draft, index) => normalizeDraft(resume.id, draft, index, sections, summary, used, idMap))
    : [normalizeDraft(resume.id, { label: "版本一", savedAt: formatStamp(), summary, sections }, 0, sections, summary, used, idMap)];
  return { id: resume.id, name, target, blurb, summary, sections, tasks, drafts };
}

function backupRaw(raw: string | null) {
  if (!raw) return;
  try {
    localStorage.setItem(BACKUP_KEY, raw);
  } catch {
    // 浏览器空间不足时不再强行写入，至少保留原数据。
  }
}

function load(): Persisted {
  const base = seed();
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
    if (!raw) return settle(base);
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (!Array.isArray(parsed.applications) || !Array.isArray(parsed.resumes)) {
      backupRaw(raw);
      return settle(base);
    }
    const used = new Set<string>();
    const migrations: Record<string, Record<string, string>> = {};
    const resumes = parsed.resumes.flatMap((resume) => {
      if (!resume || typeof resume !== "object" || typeof (resume as ResumeVersion).id !== "string") return [];
      const id = (resume as ResumeVersion).id;
      const idMap = (migrations[id] = {});
      return [normalizeResume(resume as ResumeVersion, used, idMap)];
    });
    if (!resumes.length) {
      backupRaw(raw);
      return settle(base);
    }
    const currentResumeId = resumes.some((resume) => resume.id === parsed.currentResumeId)
      ? String(parsed.currentResumeId)
      : resumes[0].id;
    const currentResume = resumes.find((resume) => resume.id === currentResumeId) ?? resumes[0];
    const currentMap = migrations[currentResumeId] ?? {};
    const rawDraftId = asText(parsed.currentDraftId);
    const mappedCurrentDraftId = currentMap[rawDraftId] ?? rawDraftId;
    const currentDraftId = currentResume.drafts?.some((draft) => draft.id === mappedCurrentDraftId)
      ? mappedCurrentDraftId
      : currentResume.drafts?.[0]?.id ?? "";
    const currentDraftByResume: Record<string, string> = {};
    for (const resume of resumes) {
      const saved = asText(parsed.currentDraftByResume?.[resume.id]) || (resume.id === currentResumeId ? rawDraftId : "");
      const mapped = migrations[resume.id]?.[saved] ?? saved;
      currentDraftByResume[resume.id] = resume.drafts?.some((draft) => draft.id === mapped)
        ? mapped
        : resume.drafts?.[0]?.id ?? "";
    }
    currentDraftByResume[currentResumeId] = currentDraftId;
    const activeDraft = currentResume.drafts?.find((draft) => draft.id === currentDraftId);
    if (activeDraft) {
      currentResume.sections = activeDraft.sections;
      currentResume.summary = activeDraft.summary;
    }
    const messages = Array.isArray(parsed.messages) ? parsed.messages : base.messages;
    return settle({
      ...base,
      ...parsed,
      schemaVersion: STORAGE_VERSION,
      profile: normalizeProfile(parsed.profile),
      resumes,
      currentResumeId,
      currentDraftId,
      currentDraftByResume,
      nameStyleId: parsed.nameStyleId || "name-role",
      pendingJobId: parsed.pendingJobId ?? null,
      pendingPick: parsed.pendingPick ?? null,
      lastChecklistAt: parsed.lastChecklistAt ?? 0,
      ...normalizeChats(parsed, messages),
      shares: Array.isArray(parsed.shares) ? parsed.shares.filter((item) => item && item.id && item.title) : [],
      shareLikes: Array.isArray(parsed.shareLikes) ? parsed.shareLikes.map(String) : [],
      shareSaves: Array.isArray(parsed.shareSaves) ? parsed.shareSaves.map(String) : [],
      shareComments: loadComments(parsed.shareComments),
      posts: loadPosts(parsed.posts),
      postLikes: Array.isArray(parsed.postLikes) ? parsed.postLikes.map(String) : [],
      postSaves: Array.isArray(parsed.postSaves) ? parsed.postSaves.map(String) : [],
      postComments: loadComments(parsed.postComments),
      deepJobs: Array.isArray(parsed.deepJobs) ? parsed.deepJobs.map(String) : [],
    });
  } catch {
    backupRaw(raw);
    return settle(base);
  }
}

function settle(state: Persisted): Persisted {
  return { ...state, applications: state.applications.map((item) => normalizeApplication(item)) };
}

type ProgressPatch = { viewed: boolean; stage: Stage; interviewAt?: string; interviewTime?: string };

function blankSections(): ResumeSection[] {
  return moduleNames.map((title) => ({ title, before: "", after: "" }));
}

function normalizeChats(parsed: Partial<Persisted>, messages: ChatMessage[]) {
  const raw = Array.isArray(parsed.chats) ? parsed.chats.filter((chat) => chat && typeof chat.id === "string" && Array.isArray(chat.messages)) : [];
  const chats = raw.length ? raw : [{ id: "c0", title: "新对话", messages }];
  const currentChatId = chats.some((chat) => chat.id === parsed.currentChatId) ? String(parsed.currentChatId) : chats[0].id;
  const current = chats.find((chat) => chat.id === currentChatId) ?? chats[0];
  return { chats, currentChatId, messages: current.messages };
}

type Store = Persisted & {
  toast: string | null;
  leaveGuard: LeaveGuard | null;
  setLeaveGuard: (guard: LeaveGuard | null) => void;
  notify: (text: string) => void;
  toggleFavorite: (jobId: string) => void;
  markPending: (jobId: string, pick: { resumeId: string; draftId: string; nameStyleId: string }) => void;
  confirmPending: (yes: boolean) => void;
  ackChecklist: () => void;
  reopenChecklist: () => void;
  syncProgress: (id: string, patch: ProgressPatch) => void;
  setStage: (id: string, stage: Stage) => void;
  placeApplication: (id: string, stage: Stage, index: number) => boolean;
  saveInterviewRound: (applicationId: string, round: InterviewRound) => boolean;
  removeInterviewRound: (applicationId: string, roundId: string) => boolean;
  moveInterviewRound: (applicationId: string, roundId: string, direction: -1 | 1) => boolean;
  markViewed: (id: string) => void;
  setResume: (id: string) => void;
  setDraft: (id: string) => void;
  setNameStyle: (id: string) => void;
  updateResume: (id: string, patch: Partial<Pick<ResumeVersion, "name" | "target" | "summary">>) => void;
  addDirectedResume: (job: Job) => void;
  pushMessage: (message: ChatMessage) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  createResume: (name: string) => void;
  addDraft: (id?: string, init?: DraftInit) => string;
  deleteDraft: (draftId: string) => boolean;
  saveDraft: (body?: string) => void;
  setStamp: (id: string, stamp: { date: string; time: string }) => void;
  agreeDeep: (jobId: string) => void;
  shareResume: (excerpt: string, draftId: string) => void;
  toggleShareLike: (id: string) => void;
  toggleShareSave: (id: string) => void;
  removeShareSaves: (ids: string[]) => void;
  addShareComment: (postId: string, text: string) => void;
  publishPost: (input: { title: string; category: PostCategory; body: string }) => boolean;
  updatePost: (id: string, input: { title: string; category: PostCategory; body: string }) => boolean;
  deletePost: (id: string) => void;
  togglePostLike: (id: string) => void;
  togglePostSave: (id: string) => void;
  addPostComment: (postId: string, text: string) => void;
  newChat: () => void;
  selectChat: (id: string) => void;
  reset: () => Promise<void>;
};

function relocate(applications: Application[], id: string, stage: Stage, index: number): Application[] | null {
  if (!stages.includes(stage)) return null;
  const current = applications.find((item) => item.id === id);
  if (!current) return null;
  const currentIndex = applications.filter((item) => item.stage === current.stage).findIndex((item) => item.id === id);
  if (current.stage === stage && currentIndex === index) return applications;
  const nextItem = withStage(current, stage);
  const grouped = Object.fromEntries(stages.map((name) => [name, [] as Application[]])) as Record<Stage, Application[]>;
  for (const item of applications) {
    if (item.id === id) continue;
    const bucket = grouped[item.stage];
    if (!bucket) return null;
    bucket.push(item);
  }
  const column = grouped[stage];
  column.splice(Math.max(0, Math.min(index, column.length)), 0, nextItem);
  return stages.flatMap((name) => grouped[name]);
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);
  const [toast, setToast] = useState<string | null>(null);
  const [leaveGuard, setLeaveGuard] = useState<LeaveGuard | null>(null);
  const timer = useRef<number | null>(null);
  const appsRef = useRef(state.applications);
  appsRef.current = state.applications;

  const notify = useCallback((text: string) => {
    setToast(text);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      notify("本地存储空间不足，最新修改可能没有保存");
    }
  }, [state, notify]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== KEY || !event.newValue) return;
      notify("另一个标签页更新了数据，刷新页面后才能完全同步；请不要同时编辑同一份简历");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [notify]);

  const api = useMemo<Store>(() => {
    const persistApplications = (applications: Application[]) => {
      try {
        const raw = localStorage.getItem(KEY);
        const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        localStorage.setItem(KEY, JSON.stringify({ ...parsed, applications }));
      } catch {
        return false;
      }
      appsRef.current = applications;
      setState((prev) => ({ ...prev, applications }));
      return true;
    };
    const mapRounds = (applications: Application[], applicationId: string, recipe: (rounds: InterviewRound[]) => InterviewRound[] | null) => {
      const current = applications.find((item) => item.id === applicationId);
      if (!current) return null;
      const rounds = recipe([...(current.rounds ?? [])].sort((a, b) => a.order - b.order));
      if (!rounds) return null;
      return applications.map((item) => (item.id === applicationId ? mirrorStamp({ ...item, rounds }) : item));
    };
    return {
      ...state,
      toast,
      notify,
      leaveGuard,
      setLeaveGuard,
      toggleFavorite: (jobId) => {
        const has = state.favorites.includes(jobId);
        notify(has ? "已取消收藏" : "已收藏");
        setState((prev) => ({
          ...prev,
          favorites: prev.favorites.includes(jobId) ? prev.favorites.filter((id) => id !== jobId) : [jobId, ...prev.favorites],
        }));
      },
      markPending: (jobId, pick) => setState((prev) => ({ ...prev, pendingJobId: jobId, pendingPick: pick })),
      confirmPending: (yes) => {
        const jobId = state.pendingJobId;
        if (!yes || !jobId) {
          setState((prev) => ({ ...prev, pendingJobId: null, pendingPick: null }));
          if (!yes) notify("没有记入投递，看板上的数字不变");
          return;
        }
        const pick = state.pendingPick;
        const resume = state.resumes.find((item) => item.id === (pick?.resumeId ?? state.currentResumeId));
        const draft = resume?.drafts?.find((item) => item.id === (pick?.draftId ?? state.currentDraftId));
        const nameStyleId = pick?.nameStyleId ?? state.nameStyleId;
        const fileName = resume ? resumeFileName(nameStyleId, resume.name, state.profile) : "";
        const next: Application = {
          id: `a-${jobId}-${Date.now()}`,
          jobId,
          stage: "已投递",
          viewed: false,
          note: `你确认已在第三方平台投出。简历是${resume?.name ?? "当前类型"}的${draft?.label ?? "版本一"}，文件名「${fileName}」。`,
          next: stageNext.已投递,
          when: "刚刚确认",
          resumeId: resume?.id,
          draftId: draft?.id,
          nameStyleId,
        };
        notify("已按你的确认记入「已投递」");
        setState((prev) => (prev.applications.some((item) => item.jobId === jobId) ? { ...prev, pendingJobId: null, pendingPick: null } : { ...prev, pendingJobId: null, pendingPick: null, applications: [next, ...prev.applications] }));
      },
      ackChecklist: () => setState((prev) => ({ ...prev, lastChecklistAt: Date.now() })),
      reopenChecklist: () => setState((prev) => ({ ...prev, lastChecklistAt: 0 })),
      syncProgress: (id, patch) => {
        setState((prev) => ({
          ...prev,
          applications: prev.applications.map((item) => {
            if (item.id !== id) return item;
            const next = withStage(item, patch.stage);
            const dated = patch.stage === "面试" && patch.interviewAt;
            const rounds = dated
              ? (next.rounds ?? []).map((round, index) => {
                  if (index !== 0) return round;
                  const status: InterviewRound["status"] = round.status === "已完成" ? "已完成" : "已安排";
                  return { ...round, date: patch.interviewAt ?? "", time: patch.interviewTime || round.time || "09:00", status };
                })
              : next.rounds;
            return mirrorStamp({
              ...next,
              viewed: patch.viewed,
              rounds,
              note: dated ? `面试时间 ${patch.interviewAt}${patch.interviewTime ? ` ${patch.interviewTime}` : ""}，已放进日程。` : item.note,
              when: patch.interviewAt ? `${patch.interviewAt}${patch.interviewTime ? ` ${patch.interviewTime}` : ""}` : item.when,
            });
          }),
        }));
      },
      setStage: (id, stage) => {
        setState((prev) => ({
          ...prev,
          applications: prev.applications.map((item) => (item.id === id ? withStage(item, stage) : item)),
        }));
        notify(`已移到「${stage}」`);
      },
      placeApplication: (id, stage, index) => {
        const before = appsRef.current;
        const next = relocate(before, id, stage, index);
        if (!next) {
          notify("没能保存这次移动，卡片已回到原位");
          return false;
        }
        if (next === before) return true;
        const from = before.find((item) => item.id === id);
        try {
          const raw = localStorage.getItem(KEY);
          const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
          localStorage.setItem(KEY, JSON.stringify({ ...parsed, applications: next }));
        } catch {
          notify("没能保存这次移动，卡片已回到原位");
          return false;
        }
        appsRef.current = next;
        setState((prev) => {
          const applied = relocate(prev.applications, id, stage, index);
          return applied && applied !== prev.applications ? { ...prev, applications: applied } : prev;
        });
        notify(from && from.stage !== stage ? `已移到「${stage}」` : "已调整顺序");
        return true;
      },
      saveInterviewRound: (applicationId, round) => {
        const next = mapRounds(appsRef.current, applicationId, (rounds) => {
          const exists = rounds.some((item) => item.id === round.id);
          const merged = exists ? rounds.map((item) => (item.id === round.id ? { ...item, ...round, review: { ...item.review, ...round.review } } : item)) : [...rounds, round];
          return reindex(merged);
        });
        if (!next) {
          notify("没能保存这次修改");
          return false;
        }
        if (!persistApplications(next)) {
          notify("没能保存这次修改");
          return false;
        }
        const saved = next.find((item) => item.id === applicationId)?.rounds?.find((item) => item.id === round.id);
        notify(saved ? `已保存「${saved.name}」` : "已保存这一轮");
        return true;
      },
      removeInterviewRound: (applicationId, roundId) => {
        const next = mapRounds(appsRef.current, applicationId, (rounds) => reindex(rounds.filter((item) => item.id !== roundId)));
        if (!next || !persistApplications(next)) {
          notify("没能删除这一轮");
          return false;
        }
        notify("已删除这一轮");
        return true;
      },
      moveInterviewRound: (applicationId, roundId, direction) => {
        const next = mapRounds(appsRef.current, applicationId, (rounds) => {
          const index = rounds.findIndex((item) => item.id === roundId);
          const target = index + direction;
          if (index < 0 || target < 0 || target >= rounds.length) return null;
          const copy = [...rounds];
          const [row] = copy.splice(index, 1);
          copy.splice(target, 0, row);
          return reindex(copy);
        });
        if (!next || !persistApplications(next)) {
          notify("没能调整轮次顺序");
          return false;
        }
        notify("已调整轮次顺序");
        return true;
      },
      markViewed: (id) => {
        setState((prev) => ({
          ...prev,
          applications: prev.applications.map((item) => (item.id === id ? { ...item, viewed: true, note: "已标记为企业查看。" } : item)),
        }));
        notify("已标记查看");
      },
      setResume: (id) => {
        setState((prev) => {
          const resume = prev.resumes.find((item) => item.id === id);
          if (!resume) return prev;
          const savedDraftId = prev.currentDraftByResume[id];
          const draft = resume.drafts?.find((item) => item.id === savedDraftId) ?? resume.drafts?.[0];
          return {
            ...prev,
            currentResumeId: id,
            currentDraftId: draft?.id ?? "",
            currentDraftByResume: { ...prev.currentDraftByResume, [id]: draft?.id ?? "" },
            resumes: prev.resumes.map((item) => (item.id === id && draft ? { ...item, sections: draft.sections, summary: draft.summary } : item)),
          };
        });
      },
      setDraft: (id) => {
        setState((prev) => {
          const resume = prev.resumes.find((item) => item.id === prev.currentResumeId);
          const draft = resume?.drafts?.find((item) => item.id === id);
          if (!resume || !draft) return prev;
          return {
            ...prev,
            currentDraftId: id,
            currentDraftByResume: { ...prev.currentDraftByResume, [resume.id]: id },
            resumes: prev.resumes.map((item) =>
              item.id === resume.id ? { ...item, sections: draft.sections, summary: draft.summary } : item,
            ),
          };
        });
      },
      setNameStyle: (id) => setState((prev) => ({ ...prev, nameStyleId: id })),
      updateResume: (id, patch) => {
        setState((prev) => ({
          ...prev,
          resumes: prev.resumes.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }));
      },
      addDirectedResume: (job) => {
        const id = `directed-${job.id}`;
        const existing = state.resumes.find((item) => item.id === id);
        if (existing) {
          const saved = state.currentDraftByResume[id];
          const draft = existing.drafts?.find((item) => item.id === saved) ?? existing.drafts?.[0];
          const draftId = draft?.id ?? "";
          notify("这个岗位的定向版本已经在简历库里");
          setState((prev) => ({
            ...prev,
            currentResumeId: id,
            currentDraftId: draftId,
            currentDraftByResume: { ...prev.currentDraftByResume, [id]: draftId },
            resumes: prev.resumes.map((item) => (item.id === id && draft ? { ...item, sections: draft.sections, summary: draft.summary } : item)),
          }));
          return;
        }
        const base = job.tags.includes("产品") ? "product" : job.tags.includes("算法") ? "general" : "frontend";
        const from = state.resumes.find((item) => item.id === base) ?? state.resumes[0];
        const tasks = (from.tasks?.length ? from.tasks : resumesSeed.find((item) => item.id === from.id)?.tasks ?? []).map((task) =>
          task.id === "target" ? { ...task, done: true, detail: `已对准「${job.title}」。` } : task,
        );
        const created = withDrafts({
          id,
          name: `${job.company.split("·")[0]} · ${job.title}`,
          target: job.title,
          blurb: `按「${job.title}」单独留的一版。`,
          summary: `第一段直接写和「${job.title}」有关的产出。${job.gaps[0] ? `缺口「${job.gaps[0]}」留到面试再解释。` : ""}`,
          sections: from.sections.map((section, index) =>
            index === 0 ? { ...section, after: `${section.after} 投递「${job.company}」时，把这段放在摘要下面。` } : section,
          ),
          tasks,
        });
        const draftId = created.drafts?.[0]?.id ?? "";
        notify("已生成一个岗位定向版本");
        setState((prev) => ({
          ...prev,
          resumes: [created, ...prev.resumes],
          currentResumeId: id,
          currentDraftId: draftId,
          currentDraftByResume: { ...prev.currentDraftByResume, [id]: draftId },
        }));
      },
      updateProfile: (patch) => setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } })),
      createResume: (name) => {
        const id = createId("r");
        const draftId = createId("d");
        const sections = blankSections();
        const created: ResumeVersion = {
          id,
          name,
          target: name,
          blurb: name,
          summary: "",
          sections,
          tasks: [],
          drafts: [{ id: draftId, label: "新记录", savedAt: formatStamp(), summary: "", sections }],
        };
        notify(`已创建「${name}」`);
        setState((prev) => ({
          ...prev,
          resumes: [created, ...prev.resumes],
          currentResumeId: id,
          currentDraftId: draftId,
          currentDraftByResume: { ...prev.currentDraftByResume, [id]: draftId },
        }));
      },
      addDraft: (id = createId("d"), init) => {
        setState((prev) => {
          const resume = prev.resumes.find((item) => item.id === prev.currentResumeId);
          if (!resume) return prev;
          const drafts = resume.drafts ?? [];
          const source = drafts.find((draft) => draft.id === prev.currentDraftId);
          const sections = (init?.sections ?? source?.sections ?? resume.sections).map((section) => ({ ...section }));
          return {
            ...prev,
            currentDraftId: id,
            currentDraftByResume: { ...prev.currentDraftByResume, [resume.id]: id },
            resumes: prev.resumes.map((item) => item.id !== resume.id ? item : {
              ...item,
              drafts: [...drafts, {
                id,
                label: init?.label ?? "新记录",
                savedAt: formatDraftStamp(new Date(), drafts),
                summary: init?.summary ?? source?.summary ?? item.summary,
                sections,
                body: init?.body ?? source?.body,
              }],
              sections,
            }),
          };
        });
        notify(init?.label ? `已新增「${init.label}」` : "已新增一条记录");
        return id;
      },
      saveDraft: (body) => {
        const resume = state.resumes.find((item) => item.id === state.currentResumeId);
        const draft = resume?.drafts?.find((item) => item.id === state.currentDraftId);
        if (!resume || !draft) {
          notify("没有可保存的版本");
          return;
        }
        setState((prev) => ({
          ...prev,
          resumes: prev.resumes.map((item) => {
            if (item.id !== prev.currentResumeId) return item;
            const peers = (item.drafts ?? []).filter((row) => row.id !== prev.currentDraftId);
            return {
              ...item,
              drafts: (item.drafts ?? []).map((row) => (row.id === prev.currentDraftId ? { ...row, savedAt: formatDraftStamp(new Date(), peers), ...(body !== undefined ? { body } : {}) } : row)),
            };
          }),
        }));
        notify("已保存");
      },
      deleteDraft: (draftId) => {
        const resume = state.resumes.find((item) => item.id === state.currentResumeId);
        const draft = resume?.drafts?.find((item) => item.id === draftId);
        if (!resume || !draft) {
          notify("没有找到这个版本");
          return false;
        }
        if ((resume.drafts?.length ?? 0) <= 1) {
          notify("至少保留一个版本");
          return false;
        }
        setState((prev) => {
          let currentDraftId = prev.currentDraftId;
          const resumes = prev.resumes.map((item) => {
            if (item.id !== prev.currentResumeId) return item;
            const drafts = (item.drafts ?? []).filter((row) => row.id !== draftId);
            const nextId = drafts.some((row) => row.id === prev.currentDraftId) ? prev.currentDraftId : drafts[0]?.id ?? "";
            currentDraftId = nextId;
            const active = drafts.find((row) => row.id === nextId);
            return active ? { ...item, drafts, sections: active.sections, summary: active.summary } : { ...item, drafts };
          });
          return {
            ...prev,
            resumes,
            currentDraftId,
            currentDraftByResume: { ...prev.currentDraftByResume, [prev.currentResumeId]: currentDraftId },
          };
        });
        notify("已删除这个版本");
        return true;
      },
      setStamp: (id, stamp) => {
        setState((prev) => ({
          ...prev,
          applications: prev.applications.map((item) => {
            if (item.id !== id) return item;
            const rounds = (item.rounds ?? []).map((round, index) =>
              index === 0 ? { ...round, date: stamp.date, time: stamp.time, status: round.status === "待安排" ? "已安排" as const : round.status } : round,
            );
            return mirrorStamp({ ...item, rounds, interviewAt: stamp.date, interviewTime: stamp.time, when: `${stamp.date} ${stamp.time}` });
          }),
        }));
      },
      agreeDeep: (jobId) => {
        setState((prev) => ({ ...prev, deepJobs: prev.deepJobs.includes(jobId) ? prev.deepJobs : [...prev.deepJobs, jobId] }));
        notify("开始整理录用样本、薪资构成和休息安排");
      },
      shareResume: (excerpt, draftId) => {
        const resume = state.resumes.find((item) => item.id === state.currentResumeId) ?? state.resumes[0];
        const draft = resume.drafts?.find((item) => item.id === draftId) ?? resume.drafts?.find((item) => item.id === state.currentDraftId);
        const fallback = (draft?.body || draft?.sections.map((section) => `${section.title}\n${section.after}`).join("\n\n") || resume.summary).slice(0, 4000);
        const post: SharePost = { id: `s-${Date.now()}`, title: resume.name, excerpt: (excerpt.trim() || fallback).slice(0, 4000), at: formatStamp(), draftId: draft?.id };
        setState((prev) => ({ ...prev, shares: [post, ...prev.shares] }));
        notify("已分享到社区");
      },
      toggleShareLike: (id) => {
        const has = state.shareLikes.includes(id);
        notify(has ? "已取消点赞" : "已点赞");
        setState((prev) => ({
          ...prev,
          shareLikes: prev.shareLikes.includes(id) ? prev.shareLikes.filter((item) => item !== id) : [id, ...prev.shareLikes],
        }));
      },
      toggleShareSave: (id) => {
        const has = state.shareSaves.includes(id);
        notify(has ? "已取消收藏" : "已收藏");
        setState((prev) => ({
          ...prev,
          shareSaves: prev.shareSaves.includes(id) ? prev.shareSaves.filter((item) => item !== id) : [id, ...prev.shareSaves],
        }));
      },
      removeShareSaves: (ids) => {
        const drop = new Set(ids);
        if (!state.shareSaves.some((id) => drop.has(id))) return;
        setState((prev) => ({ ...prev, shareSaves: prev.shareSaves.filter((id) => !drop.has(id)) }));
        notify("已取消收藏");
      },
      addShareComment: (postId, text) => {
        const body = text.trim();
        if (!body) return;
        const comment: ShareComment = { id: `sc-${Date.now()}`, postId, text: body, at: formatStamp() };
        setState((prev) => ({ ...prev, shareComments: [...prev.shareComments, comment] }));
        notify("已发表评论");
      },
      publishPost: (input) => {
        const message = postError(input);
        if (message) {
          notify(message);
          return false;
        }
        const post: CommunityPost = {
          id: `p-${Date.now()}`,
          title: input.title.trim(),
          category: input.category,
          body: input.body.trim(),
          at: formatStamp(),
        };
        setState((prev) => ({ ...prev, posts: [post, ...prev.posts] }));
        notify("已发布帖子");
        return true;
      },
      updatePost: (id, input) => {
        const message = postError(input);
        if (message || !state.posts.some((item) => item.id === id)) {
          notify(message || "没有找到这条帖子");
          return false;
        }
        setState((prev) => ({
          ...prev,
          posts: prev.posts.map((item) => item.id === id ? { ...item, title: input.title.trim(), category: input.category, body: input.body.trim(), updatedAt: formatStamp() } : item),
        }));
        notify("已保存帖子");
        return true;
      },
      deletePost: (id) => {
        if (!state.posts.some((item) => item.id === id)) return;
        setState((prev) => ({
          ...prev,
          posts: prev.posts.filter((item) => item.id !== id),
          postLikes: prev.postLikes.filter((item) => item !== id),
          postSaves: prev.postSaves.filter((item) => item !== id),
          postComments: prev.postComments.filter((item) => item.postId !== id),
        }));
        notify("已删除帖子");
      },
      togglePostLike: (id) => {
        const has = state.postLikes.includes(id);
        notify(has ? "已取消点赞" : "已点赞");
        setState((prev) => ({
          ...prev,
          postLikes: prev.postLikes.includes(id) ? prev.postLikes.filter((item) => item !== id) : [id, ...prev.postLikes],
        }));
      },
      togglePostSave: (id) => {
        const has = state.postSaves.includes(id);
        notify(has ? "已取消收藏" : "已收藏");
        setState((prev) => ({
          ...prev,
          postSaves: prev.postSaves.includes(id) ? prev.postSaves.filter((item) => item !== id) : [id, ...prev.postSaves],
        }));
      },
      addPostComment: (postId, text) => {
        const body = text.trim();
        if (!body) return;
        const comment: ShareComment = { id: `pc-${Date.now()}`, postId, text: body, at: formatStamp() };
        setState((prev) => ({ ...prev, postComments: [...prev.postComments, comment] }));
        notify("已发表评论");
      },
      newChat: () => {
        const id = `c-${Date.now()}`;
        const thread: ChatThread = { id, title: "新对话", messages: [{ ...welcome, id: `m-${id}` }] };
        setState((prev) => ({ ...prev, chats: [thread, ...prev.chats], currentChatId: id, messages: thread.messages }));
      },
      selectChat: (id) => {
        setState((prev) => {
          const chat = prev.chats.find((item) => item.id === id);
          if (!chat) return prev;
          return { ...prev, currentChatId: id, messages: chat.messages };
        });
      },
      pushMessage: (message) => setState((prev) => {
        const chats = prev.chats.length ? prev.chats : [{ id: "c0", title: "新对话", messages: prev.messages }];
        const currentChatId = chats.some((chat) => chat.id === prev.currentChatId) ? prev.currentChatId : chats[0].id;
        const next = chats.map((chat) => {
          if (chat.id !== currentChatId) return chat;
          const title = chat.title === "新对话" && message.role === "user" ? message.text.replace(/\s+/g, " ").slice(0, 12) : chat.title;
          return { ...chat, title, messages: [...chat.messages, message] };
        });
        const current = next.find((chat) => chat.id === currentChatId) ?? next[0];
        return { ...prev, chats: next, currentChatId, messages: current.messages };
      }),
      reset: async () => {
        let backedUp = false;
        let docsCleared = true;
        try {
          const raw = localStorage.getItem(KEY);
          if (raw) {
            localStorage.setItem(BACKUP_KEY, raw);
            backedUp = true;
          }
        } catch {
          // 备份失败不阻止重置，提示里会说明。
        }
        try {
          localStorage.removeItem(KEY);
        } catch {
          notify("没能清理本地文字数据，请检查浏览器存储权限");
        }
        try {
          await clearDraftDocs();
        } catch {
          docsCleared = false;
        }
        setState(seed());
        if (!docsCleared) notify("演示数据已重置，但部分 Word 文件清理失败");
        else if (backedUp) notify("演示数据已重置，原文字数据已备份到浏览器本地");
        else notify("演示数据已重置");
      },
    };
  }, [state, toast, notify, leaveGuard]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp 必须在 AppProvider 内使用");
  return ctx;
}
