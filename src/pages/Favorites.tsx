import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { JobCard } from "../components/JobCard";
import { browseJobs, emptyJobFilters, JobFilterBar, type JobFilters } from "../components/JobFilterBar";
import { savedPosts, savedShares, saveIdsForShare } from "../community";
import { jobById } from "../data";
import { useApp } from "../store";

type Tab = "职位" | "简历" | "帖子";

export function Favorites() {
  const { favorites, resumes, shares, shareSaves, posts, postSaves, removeShareSaves, togglePostSave } = useApp();
  const [tab, setTab] = useState<Tab>("职位");
  const [filters, setFilters] = useState<JobFilters>(emptyJobFilters);
  const [group, setGroup] = useState("全部");
  const [sub, setSub] = useState("全部");
  const [leaf, setLeaf] = useState("全部");
  const savedJobs = useMemo(() => favorites.flatMap((id) => {
    const job = jobById(id);
    return job ? [job] : [];
  }), [favorites]);
  const visibleJobs = useMemo(
    () => browseJobs(savedJobs, { group, sub, leaf }, filters),
    [savedJobs, group, sub, leaf, filters],
  );
  const savedResumeList = savedShares(shares, resumes, shareSaves);
  const savedPostList = savedPosts(posts, postSaves);
  const counts = { 职位: savedJobs.length, 简历: savedResumeList.length, 帖子: savedPostList.length };

  return (
    <div className="stack">
      <div className="soft-tabs" role="tablist" aria-label="收藏分类">
        {(["职位", "简历", "帖子"] as const).map((item) => (
          <button key={item} className={tab === item ? "on" : ""} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>
            {item} ({counts[item]})
          </button>
        ))}
      </div>

      {tab === "职位" ? (
        <>
          <section className="card glass-read filter-card">
            <JobFilterBar
              group={group}
              sub={sub}
              leaf={leaf}
              onPath={({ group: nextGroup, sub: nextSub, leaf: nextLeaf }) => { setGroup(nextGroup); setSub(nextSub); setLeaf(nextLeaf); }}
              filters={filters}
              onChange={setFilters}
            />
          </section>
          {savedJobs.length === 0 ? <Empty text="暂无收藏职位" /> : visibleJobs.length === 0 ? <Empty text="这些条件下还没有收藏的职位" /> : (
            <div className="job-list">
              {visibleJobs.map((job) => <JobCard key={job.id} job={job} showApply={false} />)}
            </div>
          )}
        </>
      ) : null}

      {tab === "简历" ? (
        savedResumeList.length === 0 ? <Empty text="暂无收藏简历" /> : (
          <div className="soft-list">
            {savedResumeList.map((item) => (
              <article key={item.id} className="soft-card fav-job">
                <div>
                  <p className="kind">简历</p>
                  <h3><Link to={`/community/${item.id}`}>{item.title}</Link></h3>
                  <p className="hint">{item.at}</p>
                </div>
                <button className="pill ghost" type="button" onClick={() => removeShareSaves(saveIdsForShare(item, resumes, shareSaves))}>取消收藏</button>
              </article>
            ))}
          </div>
        )
      ) : null}

      {tab === "帖子" ? (
        savedPostList.length === 0 ? <Empty text="暂无收藏帖子" /> : (
          <div className="soft-list">
            {savedPostList.map((item) => (
              <article key={item.id} className="soft-card fav-job">
                <div>
                  <p className="kind">帖子 · {item.category}</p>
                  <h3><Link to={`/community/${item.id}`}>{item.title}</Link></h3>
                  <p className="hint">{item.at}</p>
                </div>
                <button className="pill ghost" type="button" onClick={() => togglePostSave(item.id)}>取消收藏</button>
              </article>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="soft-empty">
      <Bookmark size={28} />
      <p>{text}</p>
    </div>
  );
}
