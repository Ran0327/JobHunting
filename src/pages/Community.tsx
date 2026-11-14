import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, BadgeCheck, Bookmark, MessageSquare, ThumbsUp } from "lucide-react";
import { DeleteConfirm, PostDialog } from "../components/PostDialog";
import { createdAt, resumeOfShare } from "../community";
import { jobs } from "../data";
import { useApp } from "../store";

function tagsOf(target?: string) {
  return (target ?? "").split(/[/·]/).map((item) => item.trim()).filter(Boolean).slice(0, 2);
}

function plain(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function ResumeThumb() {
  return (
    <svg className="hub-thumb" viewBox="0 0 112 80" aria-hidden="true">
      <rect width="112" height="80" rx="10" fill="#e8f0ff" />
      <rect x="18" y="10" width="76" height="60" rx="6" fill="#fff" />
      <rect x="26" y="18" width="30" height="6" rx="3" fill="#c7d2fe" />
      <rect x="26" y="30" width="60" height="4" rx="2" fill="#e2e8f0" />
      <rect x="26" y="38" width="48" height="4" rx="2" fill="#e2e8f0" />
      <rect x="26" y="46" width="54" height="4" rx="2" fill="#e2e8f0" />
    </svg>
  );
}

type FeedCard = {
  key: string;
  kind: "简历" | "帖子";
  id: string;
  title: string;
  excerpt: string;
  at: string;
  tags: string[];
  meta: string;
};

export function Community() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const noticesPage = pathname === "/community/notices";
  const {
    profile, resumes, shares, shareLikes, shareSaves, shareComments,
    posts, postLikes, postSaves, postComments,
    toggleShareLike, toggleShareSave, addShareComment, setResume,
    publishPost, updatePost, deletePost, togglePostLike, togglePostSave, addPostComment,
  } = useApp();
  const [draft, setDraft] = useState("");
  const [chooser, setChooser] = useState(false);
  const [composer, setComposer] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const name = profile.name.trim() || "未填写姓名";

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-pop]")) setChooser(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const shareCards: FeedCard[] = shares.map((item) => {
    const resume = resumeOfShare(resumes, item);
    return {
      key: item.id,
      kind: "简历",
      id: item.id,
      title: item.title,
      excerpt: plain(resume?.summary || item.excerpt),
      at: item.at,
      tags: tagsOf(resume?.target).length ? tagsOf(resume?.target) : ["简历分享"],
      meta: resume?.target || profile.cohort,
    };
  });
  const postCards: FeedCard[] = posts.map((item) => ({
    key: item.id,
    kind: "帖子",
    id: item.id,
    title: item.title,
    excerpt: plain(item.body),
    at: item.updatedAt ? `${item.at} · 编辑于${item.updatedAt}` : item.at,
    tags: [item.category],
    meta: "帖子",
  }));
  let cards = [...shareCards, ...postCards].sort((a, b) => createdAt(b.id) - createdAt(a.id));

  function pieceTitle(saveId: string) {
    if (saveId.startsWith("resume:")) return resumes.find((item) => item.id === saveId.slice(7))?.name || "这份简历";
    return shares.find((item) => item.id === saveId)?.title || posts.find((item) => item.id === saveId)?.title || "这条内容";
  }
  function piecePath(saveId: string) {
    if (saveId.startsWith("resume:")) return `/community/r-${saveId.slice(7)}`;
    if (saveId.startsWith("p-")) return `/community/${saveId}`;
    return `/community/${saveId}`;
  }
  const notices = [
    ...shareSaves.map((saveId) => ({ id: `save:${saveId}`, text: `你收藏了「${pieceTitle(saveId)}」`, to: piecePath(saveId) })),
    ...postSaves.flatMap((saveId) => {
      const post = posts.find((item) => item.id === saveId);
      return post ? [{ id: `psave:${saveId}`, text: `你收藏了「${post.title}」`, to: `/community/${post.id}` }] : [];
    }),
    ...shareLikes.map((saveId) => ({ id: `like:${saveId}`, text: `你点赞了「${pieceTitle(saveId)}」`, to: piecePath(saveId) })),
    ...postLikes.flatMap((saveId) => {
      const post = posts.find((item) => item.id === saveId);
      return post ? [{ id: `plike:${saveId}`, text: `你点赞了「${post.title}」`, to: `/community/${post.id}` }] : [];
    }),
    ...shareComments.map((item) => ({ id: item.id, text: `你评论了「${pieceTitle(item.postId)}」：${item.text}`, to: piecePath(item.postId) })),
    ...postComments.map((item) => ({ id: item.id, text: `你评论了「${pieceTitle(item.postId)}」：${item.text}`, to: `/community/${item.postId}` })),
  ];

  const hot = [
    ...shares.map((item) => ({ title: item.title, meta: resumeOfShare(resumes, item)?.target || "已分享" })),
    ...posts.slice(0, 2).map((item) => ({ title: item.title, meta: item.category })),
    ...jobs.slice(0, 2).map((item) => ({ title: item.title, meta: item.company.split("·")[0].trim() })),
  ].slice(0, 5);

  const postDetail = id?.startsWith("p-") ? posts.find((item) => item.id === id) : undefined;
  const shareDetail = id && !id.startsWith("r-") && !id.startsWith("p-") ? shares.find((item) => item.id === id) : undefined;
  const resumeDetail = id?.startsWith("r-") ? resumes.find((item) => item.id === id.slice(2)) : undefined;
  const detailMissing = Boolean(id) && !noticesPage && !shareDetail && !resumeDetail && !postDetail;
  const linkedResume = shareDetail ? resumeOfShare(resumes, shareDetail) : resumeDetail;
  const detailTitle = postDetail?.title ?? shareDetail?.title ?? resumeDetail?.name ?? "";
  const detailBody = postDetail?.body ?? (shareDetail?.draftId ? shareDetail.excerpt : linkedResume ? linkedResume.sections.map((section) => `${section.title}\n${section.after}`).join("\n\n") : shareDetail?.excerpt ?? "");
  const detailSaveId = shareDetail ? shareDetail.id : resumeDetail ? `resume:${resumeDetail.id}` : "";
  const detailComments = postDetail
    ? postComments.filter((item) => item.postId === postDetail.id)
    : shareDetail ? shareComments.filter((item) => item.postId === shareDetail.id) : [];
  const detailTags = postDetail ? [postDetail.category] : tagsOf(linkedResume?.target);
  const detailMeta = postDetail ? "帖子" : linkedResume?.target ?? profile.cohort;
  const detailWhen = postDetail
    ? `${postDetail.at}${postDetail.updatedAt ? ` · 编辑于${postDetail.updatedAt}` : ""}`
    : shareDetail?.at || (resumeDetail?.drafts?.[0]?.savedAt ?? "").replace(/编辑$/, "");

  return (
    <div className="hub">
      <div className="hub-main">
        <div className={noticesPage ? "hub-grid saved" : "hub-grid"}>
          {noticesPage ? <h2 className="hub-page-title">消息通知</h2> : (
            <section className="hub-banner">
              <div>
                <h2>职途简历分享社区</h2>
                <p>发现优秀简历，交流求职经验，一起成长进步</p>
                <PublishButton open={chooser} onToggle={() => setChooser((value) => !value)} onResume={() => { setChooser(false); navigate("/resumes"); }} onPost={() => { setChooser(false); setComposer(true); }} />
              </div>
              <div className="hub-art" aria-hidden="true">
                <span className="hub-blob" />
                <span className="hub-sheet"><i /><i /><i /></span>
                <span className="hub-case" />
                <span className="hub-star">★</span>
              </div>
            </section>
          )}

          {noticesPage ? (
            notices.length === 0 ? <div className="soft-empty">暂无新消息。</div> : (
              <div className="hub-feed">
                {notices.map((item) => <Link key={item.id} className="hub-post" to={item.to}>{item.text}</Link>)}
              </div>
            )
          ) : id ? (
            <article className="hub-post hub-detail">
              <button className="hub-back" type="button" onClick={() => navigate("/community")}>返回社区</button>
              {detailMissing ? <p>没有找到这条内容。</p> : (
                <>
                  <div className="hub-who">
                    <span className="hub-avatar">{profile.avatar ? <img src={profile.avatar} alt="" /> : name.slice(0, 1)}</span>
                    <div>
                      <strong>{name} <BadgeCheck size={14} /></strong>
                      <p>{detailWhen}{detailMeta ? ` · ${detailMeta}` : ""}</p>
                    </div>
                  </div>
                  <h3>{detailTitle}</h3>
                  <p className="hub-body">{detailBody}</p>
                  {detailTags.length ? <div className="hub-tags">{detailTags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
                  <div className="hub-actions">
                    {postDetail ? (
                      <button className={postLikes.includes(postDetail.id) ? "on" : ""} type="button" onClick={() => togglePostLike(postDetail.id)}><ThumbsUp size={16} /> {postLikes.includes(postDetail.id) ? 1 : 0}</button>
                    ) : (
                      <button className={shareLikes.includes(detailSaveId) ? "on" : ""} type="button" onClick={() => toggleShareLike(detailSaveId)}><ThumbsUp size={16} /> {shareLikes.includes(detailSaveId) ? 1 : 0}</button>
                    )}
                    <span><MessageSquare size={16} /> {detailComments.length}</span>
                    {postDetail ? (
                      <button className={postSaves.includes(postDetail.id) ? "on" : ""} type="button" onClick={() => togglePostSave(postDetail.id)}><Bookmark size={16} /> {postSaves.includes(postDetail.id) ? "已收藏" : "收藏"}</button>
                    ) : (
                      <button className={shareSaves.includes(detailSaveId) ? "on" : ""} type="button" onClick={() => toggleShareSave(detailSaveId)}><Bookmark size={16} /> {shareSaves.includes(detailSaveId) ? "已收藏" : "收藏"}</button>
                    )}
                    {linkedResume ? <button type="button" onClick={() => { setResume(linkedResume.id); navigate("/resumes"); }}>打开简历</button> : null}
                    {postDetail ? <button className="pill edit" type="button" onClick={() => setEditing(true)}>编辑</button> : null}
                    {postDetail ? <button className="pill danger" type="button" onClick={() => setConfirmDelete(true)}>删除</button> : null}
                  </div>
                  {postDetail || shareDetail ? (
                    <form className="hub-comment" onSubmit={(event) => { event.preventDefault(); if (postDetail) addPostComment(postDetail.id, draft); else if (shareDetail) addShareComment(shareDetail.id, draft); setDraft(""); }}>
                      {detailComments.map((item) => <p key={item.id}><b>{name}</b> {item.text}<small>{item.at}</small></p>)}
                      <div className="hub-compose">
                        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="写下评论" aria-label="评论" />
                        <button type="submit">发表</button>
                      </div>
                    </form>
                  ) : null}
                </>
              )}
            </article>
          ) : (
            <div className="hub-feed">
              {cards.length === 0 ? <div className="soft-empty">还没有内容。分享一份简历，或发布一条帖子。</div> : null}
              {cards.map((item) => (
                <FeedArticle
                  key={item.key}
                  item={item}
                  liked={item.kind === "帖子" ? postLikes.includes(item.id) : shareLikes.includes(item.id)}
                  saved={item.kind === "帖子" ? postSaves.includes(item.id) : shareSaves.includes(item.id)}
                  comments={item.kind === "帖子" ? postComments.filter((row) => row.postId === item.id).length : shareComments.filter((row) => row.postId === item.id).length}
                  onLike={() => item.kind === "帖子" ? togglePostLike(item.id) : toggleShareLike(item.id)}
                  onSave={() => item.kind === "帖子" ? togglePostSave(item.id) : toggleShareSave(item.id)}
                  onOpen={() => navigate(`/community/${item.id}`)}
                  thumb={item.kind === "简历"}
                  name={name}
                  avatar={profile.avatar}
                />
              ))}
            </div>
          )}

          <aside className="hub-rail">
            <section className="hub-card">
              <h3>热门推荐</h3>
              <ol>
                {hot.map((item, index) => (
                  <li key={`${item.title}-${index}`}>
                    <span className={`rank r${index + 1}`}>{index + 1}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.meta}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <section className="hub-join">
              <h3>加入职途社区</h3>
              <p>与更多优秀的求职者一起成长</p>
              <button className="hub-btn light" type="button" onClick={() => navigate("/profile")}>立即加入 <ArrowRight size={14} /></button>
              <span className="hub-people" aria-hidden="true" />
            </section>
          </aside>
        </div>
      </div>
      {composer ? <PostDialog heading="发布帖子" submitLabel="发布" onClose={() => setComposer(false)} onSubmit={publishPost} /> : null}
      {editing && postDetail ? (
        <PostDialog
          heading="编辑帖子"
          submitLabel="保存"
          initial={{ title: postDetail.title, category: postDetail.category, body: postDetail.body }}
          onClose={() => setEditing(false)}
          onSubmit={(value) => updatePost(postDetail.id, value)}
        />
      ) : null}
      {confirmDelete && postDetail ? (
        <DeleteConfirm name={postDetail.title} onCancel={() => setConfirmDelete(false)} onConfirm={() => { deletePost(postDetail.id); setConfirmDelete(false); navigate("/community"); }} />
      ) : null}
    </div>
  );
}

function PublishButton({
  open,
  onToggle,
  onResume,
  onPost,
}: {
  open: boolean;
  onToggle: () => void;
  onResume: () => void;
  onPost: () => void;
}) {
  return (
    <div className="hub-pop" data-pop>
      <button className="pill primary" type="button" aria-expanded={open} onClick={onToggle}>发布</button>
      {open ? (
        <div className="hub-menu">
          <button type="button" onClick={onResume}>发布简历</button>
          <button type="button" onClick={onPost}>发布帖子</button>
        </div>
      ) : null}
    </div>
  );
}

function FeedArticle({
  item,
  liked,
  saved,
  comments,
  onLike,
  onSave,
  onOpen,
  thumb,
  name,
  avatar,
}: {
  item: FeedCard;
  liked: boolean;
  saved: boolean;
  comments: number;
  onLike: () => void;
  onSave: () => void;
  onOpen: () => void;
  thumb: boolean;
  name: string;
  avatar: string;
}) {
  return (
    <article className="hub-post">
      <header>
        <div className="hub-who">
          <span className="hub-avatar">{avatar ? <img src={avatar} alt="" /> : name.slice(0, 1)}</span>
          <div>
            <strong>{name} <BadgeCheck size={14} /></strong>
            <p>{[item.at, item.meta].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className="hub-tags">
          <span className={item.kind === "帖子" ? "kind-post" : "kind-resume"}>{item.kind}</span>
          {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </header>
      <div className={thumb ? "hub-copy" : "hub-copy solo"}>
        <div>
          <h3>{item.title}</h3>
          <p>{item.excerpt}</p>
        </div>
        {thumb ? <ResumeThumb /> : null}
      </div>
      <footer>
        <div className="hub-actions">
          <button className={liked ? "on" : ""} type="button" onClick={onLike}><ThumbsUp size={16} /> {liked ? 1 : 0}</button>
          <button type="button" onClick={onOpen}><MessageSquare size={16} /> {comments}</button>
          <button className={saved ? "on" : ""} type="button" onClick={onSave}><Bookmark size={16} /> {saved ? "已收藏" : "收藏"}</button>
        </div>
        <button className="hub-more" type="button" onClick={onOpen}>查看详情 <ArrowRight size={14} /></button>
      </footer>
    </article>
  );
}
