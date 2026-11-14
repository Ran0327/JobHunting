import { useState } from "react";
import { postCategories, postError, postLimits, type PostCategory } from "../store";

export type PostDraft = { title: string; category: PostCategory; body: string };

export function PostDialog({
  heading,
  submitLabel,
  initial,
  onClose,
  onSubmit,
}: {
  heading: string;
  submitLabel: string;
  initial?: PostDraft;
  onClose: () => void;
  onSubmit: (value: PostDraft) => boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<PostCategory | "">(initial?.category ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState("");

  return (
    <div className="modal-back" onClick={onClose}>
      <form
        className="soft-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          const message = postError({ title, category, body });
          if (message || !category) {
            setError(message || "请选择帖子分类");
            return;
          }
          if (onSubmit({ title: title.trim(), category, body: body.trim() })) onClose();
        }}
      >
        <h2>{heading}</h2>
        <label className="soft-field">
          <span>帖子标题</span>
          <input value={title} maxLength={postLimits.title} onChange={(event) => setTitle(event.target.value)} placeholder="用一句话写出你想讨论的问题" aria-label="帖子标题" />
        </label>
        <div className="soft-field">
          <span>帖子分类</span>
          <div className="soft-choices">
            {postCategories.map((item) => (
              <button key={item} className={category === item ? "on" : ""} type="button" onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
        </div>
        <label className="soft-field">
          <span>帖子正文</span>
          <textarea value={body} maxLength={postLimits.body} onChange={(event) => setBody(event.target.value)} placeholder="写下经历、问题和你希望别人补充的部分" aria-label="帖子正文" />
        </label>
        {error ? <p className="soft-error">{error}</p> : null}
        <div className="soft-actions">
          <button className="pill ghost" type="button" onClick={onClose}>取消</button>
          <button className="pill primary" type="submit">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}

export function DeleteConfirm({ name, onCancel, onConfirm }: { name: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="soft-modal narrow" onClick={(event) => event.stopPropagation()}>
        <h2>删除这条帖子？</h2>
        <p>「{name}」会从社区和我的发布里一起去掉。</p>
        <div className="soft-actions">
          <button className="pill ghost" type="button" onClick={onCancel}>取消</button>
          <button className="pill danger" type="button" onClick={onConfirm}>删除</button>
        </div>
      </div>
    </div>
  );
}
