import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Download, FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { Highlight } from "../components/RichText";
import type { ResumeWordHandle } from "../components/ResumeWordEditor";
import { createId } from "../ids";
import { readUpload } from "../readFile";
import { deleteDraftDoc, loadDraftDoc, saveDraftDoc } from "../resumeDocs";
import { reviewResume } from "../resumeReview";
import { draftToDocx } from "../sectionsDoc";
import { draftLabel } from "../stamp";
import { useApp } from "../store";
import { directionLeaves, matchDirections } from "../taxonomy";
import type { ResumeDraft } from "../data";

const MAX_IMPORT_BYTES = 15 * 1024 * 1024;

const ResumeWordEditor = lazy(() => import("../components/ResumeWordEditor"));

function DraftMenu({ drafts, value, onChange, onCreate }: { drafts: { id: string; savedAt: string }[]; value: string; onChange: (id: string) => void; onCreate: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const current = drafts.find((item) => item.id === value);
  return (
    <div className={`draft-pick${open ? " open" : ""}`} ref={rootRef}>
      <button className="drop cascade-trigger" type="button" aria-label="编辑记录" aria-expanded={open} onClick={() => setOpen((prev) => !prev)}>
        <span>{current ? draftLabel(current.savedAt) : "编辑记录"}</span>
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="cascade menu">
          <div className="cascade-col">
            {drafts.map((draft) => (
              <button key={draft.id} type="button" className={draft.id === value ? "on" : ""} onClick={() => { onChange(draft.id); setOpen(false); }}>
                <span>{draftLabel(draft.savedAt)}</span>
              </button>
            ))}
            <button type="button" onClick={() => { onCreate(); setOpen(false); }}><span>+ 新记录</span></button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type PendingNav = { kind: "draft" | "resume" | "new" | "leave"; id?: string; run?: () => void };

export function Resumes() {
  const { resumes, currentResumeId, currentDraftId, setResume, setDraft, updateResume, createResume, deleteDraft, addDraft, saveDraft, shareResume, notify, setLeaveGuard } = useApp();
  const navigate = useNavigate();
  const current = resumes.find((item) => item.id === currentResumeId) ?? resumes[0];
  const drafts = current.drafts ?? [];
  const activeDraft = drafts.find((item) => item.id === currentDraftId);
  const wordRef = useRef<ResumeWordHandle>(null);
  const deleting = useRef(false);
  const savingRef = useRef(false);
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState<Blob | null>(null);
  const [docState, setDocState] = useState<"loading" | "ready" | "empty">("loading");
  const [editorText, setEditorText] = useState("");
  const [reviewDraftId, setReviewDraftId] = useState(activeDraft?.id ?? "");
  const found = matchDirections(query);
  const reviewedDraft = drafts.find((item) => item.id === reviewDraftId) ?? activeDraft;
  const reviewText = reviewedDraft && reviewedDraft.id === activeDraft?.id
    ? (editorText || reviewedDraft.body || reviewedDraft.sections.map((section) => section.after).join("\n"))
    : (reviewedDraft?.body || reviewedDraft?.sections.map((section) => `${section.title}\n${section.after}`).join("\n\n") || "");
  const review = reviewResume({ ...current, summary: current.summary, sections: [{ title: "工作经历", before: "", after: reviewText }] });

  useEffect(() => {
    let stop = false;
    setDocState(activeDraft ? "loading" : "empty");
    setDoc(null);
    setEditorText("");
    setDirty(false);
    if (!activeDraft) return;
    const draft = activeDraft;
    void (async () => {
      try {
        const stored = await loadDraftDoc(current.id, draft.id);
        const blob = stored ?? await draftToDocx(current.name, draft);
        if (!stop) {
          setDoc(blob);
          setDocState("ready");
        }
      } catch {
        if (!stop) {
          setDocState("empty");
          notify("没能打开这份简历");
        }
      }
    })();
    return () => { stop = true; };
    // 只在岗位或版本变化时重新打开文档，避免保存提示把未保存内容刷掉。
  }, [current.id, activeDraft?.id]);

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  useEffect(() => {
    const guard = (next: () => void) => {
      if (pendingNav) return;
      if (!dirty) {
        next();
        return;
      }
      setPendingNav({ kind: "leave", run: next });
    };
    setLeaveGuard(() => guard);
    return () => setLeaveGuard(null);
  }, [dirty, pendingNav, setLeaveGuard]);

  function markDirty() {
    setDirty(true);
  }

  async function saveCurrent() {
    if (!activeDraft) {
      notify("没有可保存的版本");
      return false;
    }
    if (!wordRef.current) {
      notify("编辑器还在加载，请稍后再保存");
      return false;
    }
    if (savingRef.current) {
      notify("正在保存，请稍候");
      return false;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const blob = await wordRef.current.exportDocx();
      const text = await wordRef.current.plainText();
      await saveDraftDoc(current.id, activeDraft.id, blob);
      saveDraft(text);
      setDirty(false);
      return true;
    } catch {
      notify("没能保存这份简历，请重试");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function shareCurrent() {
    if (!activeDraft) return;
    if (dirty) {
      const saved = await saveCurrent();
      if (!saved) return;
    }
    const text = await wordRef.current?.plainText() ?? activeDraft.body ?? activeDraft.sections.map((section) => `${section.title}\n${section.after}`).join("\n\n");
    shareResume(text, activeDraft.id);
    navigate("/community");
  }

  function requestNav(next: PendingNav, run: () => void) {
    if (!dirty) {
      run();
      return;
    }
    setPendingNav(next);
  }

  function requestImport(file: File) {
    if (!dirty) {
      void onFile(file);
      return;
    }
    setPendingNav({ kind: "leave", run: () => { void onFile(file); } });
  }

  async function finishNav(mode: "save" | "drop") {
    const next = pendingNav;
    if (!next) return;
    if (mode === "save") {
      const ok = await saveCurrent();
      if (!ok) return;
    } else {
      setDirty(false);
    }
    setPendingNav(null);
    if (next.kind === "leave") {
      next.run?.();
      return;
    }
    if (next.kind === "draft" && next.id) setDraft(next.id);
    if (next.kind === "resume" && next.id) setResume(next.id);
    if (next.kind === "new") void createVersion(mode === "save");
  }

  async function createVersion(fromEditor = true) {
    const id = createId("d");
    try {
      if (fromEditor && activeDraft && wordRef.current) {
        const blob = await wordRef.current.exportDocx();
        await saveDraftDoc(current.id, id, blob);
      } else if (activeDraft) {
        const stored = await loadDraftDoc(current.id, activeDraft.id);
        if (stored) await saveDraftDoc(current.id, id, stored);
      }
    } catch {
      notify("没能复制当前版本");
      return;
    }
    addDraft(id);
    setDirty(false);
  }

  async function onFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      notify("当前仅支持导入 .docx 格式的 Word 文档。");
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      notify("Word 文件不能超过 15MB");
      return;
    }
    if (importing) return;
    setImporting(true);
    try {
      const blob = new Blob([await file.arrayBuffer()], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      let text = "";
      try {
        text = (await readUpload(file)).trim();
      } catch {
        text = "";
      }
      const id = createId("d");
      await saveDraftDoc(current.id, id, blob);
      addDraft(id, { label: "导入 Word", body: text, sections: [] });
      setDirty(false);
      notify("已导入为新的简历版本，原版本未改动");
    } catch {
      notify("这份 Word 没能导入，请检查文件是否完整");
    } finally {
      setImporting(false);
    }
  }

  async function exportWord() {
    if (!activeDraft || !wordRef.current) return;
    try {
      const blob = await wordRef.current.exportDocx();
      const name = `${current.name} · ${draftLabel(activeDraft.savedAt)}.docx`.replace(/[\\/:*?"<>|]/g, " ");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      notify("没能导出这份 Word");
    }
  }

  function applySuggestion(id: string) {
    const item = review.suggestions.find((suggestion) => suggestion.id === id);
    if (!item || reviewedDraft?.id !== activeDraft?.id) return;
    if (item.target) updateResume(current.id, { target: item.target });
    const text = item.text || item.proposal;
    if (text) {
      if (!wordRef.current) {
        notify("编辑器还在加载，请稍后再写入");
        return;
      }
      wordRef.current.insertText(text);
    }
    notify("已写入当前简历");
  }

  async function confirmDelete() {
    if (!activeDraft || deleting.current) return;
    deleting.current = true;
    const draftId = activeDraft.id;
    try {
      if (!deleteDraft(draftId)) {
        setConfirmOpen(false);
        return;
      }
      setDirty(false);
      setConfirmOpen(false);
      try {
        await deleteDraftDoc(current.id, draftId);
      } catch {
        notify("版本已从列表删除，但 Word 文件清理失败");
      }
    } finally {
      deleting.current = false;
    }
  }

  function pickDirection(name: string) {
    if (!directionLeaves().includes(name)) return;
    createResume(name);
    setCreating(false);
    setQuery("");
  }

  function draftCopy(draft: ResumeDraft | undefined) {
    if (!draft) return "这个版本";
    return `${current.name.trim() || "当前岗位"} · ${draftLabel(draft.savedAt)}`;
  }

  return (
    <div className="resume-editor">
      <aside className="card glass-read">
        <div className="section-title">
          <h2 className="with-icon"><FileText size={16} /> 我的简历</h2>
          <button className="quiet" type="button" aria-label="创建简历" onClick={() => setCreating((value) => !value)}><Plus size={16} /></button>
        </div>
        {creating ? (
          <div className="stack mt">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索系统里的岗位" aria-label="搜索岗位方向" />
            <div className="suggest-list">
              {(query.trim() ? found.exact : directionLeaves().slice(0, 8)).map((item) => (
                <button key={item} className="quiet" type="button" onClick={() => pickDirection(item)}>{item}</button>
              ))}
              {query.trim() && found.exact.length === 0 ? <p className="hint">系统里没有「{query.trim()}」。可选：{found.suggest.join("、") || "换一个说法"}</p> : null}
            </div>
          </div>
        ) : <p className="hint mt">点开一份，再用下拉切换编辑记录。</p>}
        <div className="version-list mt">
          {resumes.map((item) => (
            <button key={item.id} type="button" className={`version${item.id === current.id ? " on" : ""}`} onClick={() => requestNav({ kind: "resume", id: item.id }, () => setResume(item.id))}>
              <strong>{item.name}</strong>
              <p className="hint">{item.target}</p>
            </button>
          ))}
        </div>
      </aside>

      <article className="resume-paper">
        <div className="section-title">
          <input className="name-input" value={current.name} aria-label="简历名称" onChange={(event) => updateResume(current.id, { name: event.target.value, target: event.target.value })} />
          <div className="text-row">
            <DraftMenu
              drafts={drafts}
              value={activeDraft?.id ?? ""}
              onChange={(id) => requestNav({ kind: "draft", id }, () => setDraft(id))}
              onCreate={() => requestNav({ kind: "new" }, () => { void createVersion(); })}
            />
            <button className="quiet" type="button" onClick={() => { setReviewDraftId(activeDraft?.id ?? ""); setReviewOpen(true); }}>AI评价</button>
            <label className="quiet">
              <Upload size={14} /> {importing ? "导入中" : "导入"}
              <input hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={importing} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) requestImport(file); }} />
            </label>
          </div>
        </div>
        {docState === "ready" && doc && activeDraft ? (
          <div className="resume-word">
            <p className="resume-word-note">复杂排版、文本框和部分编号可能无法与 Word 完全一致。</p>
            <Suspense fallback={<p className="hint">正在打开文档…</p>}>
              <ResumeWordEditor
                key={`${current.id}:${activeDraft.id}`}
                ref={wordRef}
                document={doc}
                onDirty={markDirty}
                onText={setEditorText}
                onError={(message) => notify(message)}
              />
            </Suspense>
          </div>
        ) : (
          <div className="resume-word-empty">
            <p>{docState === "loading" ? "正在打开文档…" : "这个岗位还没有简历版本。"}</p>
            {docState === "empty" ? <p className="hint">点右上角「导入」，选择一份 .docx 文件。</p> : null}
          </div>
        )}
        <div className="resume-actions">
          <button type="button" onClick={() => { void saveCurrent(); }} disabled={!activeDraft || saving}>{saving ? "保存中…" : "保存"}</button>
          <button className="resume-delete" type="button" onClick={() => { deleting.current = false; setConfirmOpen(true); }} disabled={!activeDraft || saving}><Trash2 size={14} /> 删除</button>
          <button type="button" onClick={() => { void exportWord(); }} disabled={!activeDraft}><Download size={14} /> 导出 Word</button>
          <button type="button" onClick={() => { void shareCurrent(); }} disabled={!activeDraft}>一键分享</button>
        </div>
      </article>

      {confirmOpen && activeDraft ? (
        <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="delete-resume-title" aria-describedby="delete-resume-note">
          <div className="version-dialog">
            <button className="apply-x" type="button" aria-label="关闭" onClick={() => setConfirmOpen(false)}><X size={16} /></button>
            <div className="version-dialog-row">
              <span className="version-dialog-mark" aria-hidden="true"><Trash2 size={18} /></span>
              <div>
                <h2 id="delete-resume-title">删除简历版本？</h2>
                <p id="delete-resume-note">确定删除当前选中的「{draftCopy(activeDraft)}」吗？</p>
                <p className="version-dialog-risk">只删除这一条版本记录，其他版本和所属岗位分类不受影响。删除后无法恢复。</p>
              </div>
            </div>
            <div className="version-dialog-actions">
              <button className="apply-cancel" type="button" onClick={() => setConfirmOpen(false)}>取消</button>
              <button className="version-dialog-danger" type="button" onClick={() => { void confirmDelete(); }}>删除</button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingNav ? (
        <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
          <div className="version-dialog">
            <button className="apply-x" type="button" aria-label="关闭" onClick={() => setPendingNav(null)}><X size={16} /></button>
            <div>
              <h2 id="unsaved-title">还有未保存的修改</h2>
              <p>切换前要先保存当前版本，或放弃这些修改。</p>
            </div>
            <div className="version-dialog-actions">
              <button className="apply-cancel" type="button" onClick={() => setPendingNav(null)}>取消</button>
              <button className="apply-cancel" type="button" onClick={() => { void finishNav("drop"); }}>放弃修改</button>
              <button className="apply-go" type="button" onClick={() => { void finishNav("save"); }}>保存</button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewOpen ? (
        <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <div className="modal glass-read">
            <div className="between">
              <h2 id="review-title">AI 评价</h2>
              <button className="confirm-x" type="button" aria-label="关闭" onClick={() => setReviewOpen(false)}><X size={16} /></button>
            </div>
            <label className="drop-field mt">
              <span>记录</span>
              <select className="drop" value={reviewedDraft?.id ?? ""} onChange={(event) => setReviewDraftId(event.target.value)}>
                {drafts.map((draft) => <option key={draft.id} value={draft.id}>{draftLabel(draft.savedAt)}</option>)}
              </select>
            </label>
            <p className="hint mt">{reviewedDraft?.id === activeDraft?.id ? "当前记录" : "历史记录"} · {review.passed} / {review.total} 项通过。</p>
            <ul className="review-list">
              {review.checks.map((item) => (
                <li key={item.label}>
                  <span className={`badge ${item.pass ? "tone-green" : "tone-rose"}`}>{item.pass ? "已有" : "还缺"} {item.label}</span>
                  <p><Highlight text={item.note} /></p>
                </li>
              ))}
            </ul>
            {review.suggestions.map((item) => (
              <article key={item.id} className="review-card">
                <strong>{item.title}</strong>
                <p><Highlight text={item.problem} /></p>
                <p className="after"><Highlight text={item.proposal} /></p>
                {reviewedDraft?.id === activeDraft?.id ? <button className="quiet" type="button" onClick={() => applySuggestion(item.id)}>写入简历</button> : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
