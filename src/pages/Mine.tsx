import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { DeleteConfirm, PostDialog } from "../components/PostDialog";
import { resumeOfShare } from "../community";
import { useApp } from "../store";

type Tab = "简历" | "帖子";

export function Mine() {
  const navigate = useNavigate();
  const { resumes, shares, posts, updatePost, deletePost, setResume } = useApp();
  const [tab, setTab] = useState<Tab>("简历");
  const [editId, setEditId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const editing = posts.find((item) => item.id === editId);
  const dropping = posts.find((item) => item.id === dropId);

  return (
    <div className="stack">
      <div className="soft-tabs" role="tablist" aria-label="发布分类">
        <button className={tab === "简历" ? "on" : ""} type="button" role="tab" aria-selected={tab === "简历"} onClick={() => setTab("简历")}>简历 ({shares.length})</button>
        <button className={tab === "帖子" ? "on" : ""} type="button" role="tab" aria-selected={tab === "帖子"} onClick={() => setTab("帖子")}>帖子 ({posts.length})</button>
      </div>

      {tab === "简历" ? (
        shares.length === 0 ? <Empty text="还没有分享到社区的简历。在简历页点「一键分享」。" /> : (
          <div className="soft-list">
            {shares.map((item) => {
              const resume = resumeOfShare(resumes, item);
              return (
                <article key={item.id} className="soft-card fav-job">
                  <div>
                    <p className="kind">简历</p>
                    <h3>{item.title}</h3>
                    <p className="hint">{item.at}{resume?.target ? ` · ${resume.target}` : ""}</p>
                  </div>
                  <div className="soft-actions">
                    <Link className="pill edit" to={`/community/${item.id}`}>查看完整简历</Link>
                    {resume ? <button className="pill ghost" type="button" onClick={() => { setResume(resume.id); navigate("/resumes"); }}>打开编辑</button> : null}
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : posts.length === 0 ? <Empty text="还没有发布帖子。" /> : (
        <div className="soft-list">
          {posts.map((item) => (
            <article key={item.id} className="soft-card fav-job">
              <div>
                <p className="kind">帖子 · {item.category}</p>
                <h3>{item.title}</h3>
                <p className="hint">{item.at}{item.updatedAt ? ` · 编辑于${item.updatedAt}` : ""}</p>
              </div>
              <div className="soft-actions">
                <Link className="pill edit" to={`/community/${item.id}`}>查看</Link>
                <button className="pill edit" type="button" onClick={() => setEditId(item.id)}>编辑</button>
                <button className="pill danger" type="button" onClick={() => setDropId(item.id)}>删除</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing ? (
        <PostDialog
          heading="编辑帖子"
          submitLabel="保存"
          initial={{ title: editing.title, category: editing.category, body: editing.body }}
          onClose={() => setEditId(null)}
          onSubmit={(value) => updatePost(editing.id, value)}
        />
      ) : null}
      {dropping ? (
        <DeleteConfirm
          name={dropping.title}
          onCancel={() => setDropId(null)}
          onConfirm={() => { deletePost(dropping.id); setDropId(null); }}
        />
      ) : null}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="soft-empty">
      <FileText size={28} />
      <p>{text}</p>
    </div>
  );
}
