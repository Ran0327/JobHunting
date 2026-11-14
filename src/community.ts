import type { ResumeVersion } from "./data";
import type { CommunityPost, SharePost } from "./store";

export function createdAt(id: string) {
  const value = Number(id.slice(id.indexOf("-") + 1));
  return Number.isFinite(value) ? value : 0;
}

export function resumeOfShare(resumes: ResumeVersion[], share: SharePost) {
  return resumes.find((item) => item.name === share.title);
}

export function saveIdsForShare(share: SharePost, resumes: ResumeVersion[], shareSaves: string[]) {
  const resume = resumeOfShare(resumes, share);
  return shareSaves.filter((id) => id === share.id || (resume ? id === `resume:${resume.id}` : false));
}

export function savedShares(shares: SharePost[], resumes: ResumeVersion[], shareSaves: string[]) {
  const seen = new Set<string>();
  const list: SharePost[] = [];
  for (const saveId of shareSaves) {
    const direct = shares.find((item) => item.id === saveId);
    const resume = saveId.startsWith("resume:") ? resumes.find((item) => item.id === saveId.slice(7)) : undefined;
    const viaResume = resume ? shares.find((item) => item.title === resume.name) : undefined;
    const share = direct ?? viaResume;
    if (!share || seen.has(share.id)) continue;
    seen.add(share.id);
    list.push(share);
  }
  return list;
}

export function savedPosts(posts: CommunityPost[], postSaves: string[]) {
  return postSaves.flatMap((id) => {
    const post = posts.find((item) => item.id === id);
    return post ? [post] : [];
  });
}
