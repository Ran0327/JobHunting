import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, ImagePlus, Mic, Paperclip, Send } from "lucide-react";
import { RichText } from "../components/RichText";
import { readUpload } from "../readFile";
import { answerQuestion, promptGroups, prompts } from "../replies";
import { jobs, jobById } from "../data";
import { useApp } from "../store";

const MAX_IMAGE_BYTES = 1024 * 1024;

type SpeechRec = {
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
};

export function Assistant() {
  const [params] = useSearchParams();
  const { messages, chats, currentChatId, pushMessage, resumes, currentResumeId, newChat, selectChat, notify } = useApp();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const job = jobById(params.get("job") ?? "") ?? jobs[0];
  const resume = resumes.find((item) => item.id === currentResumeId) ?? resumes[0];
  const grouped = useMemo(() => promptGroups.map((group) => ({ group, items: prompts.filter((item) => item.group === group) })), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, currentChatId]);

  function ask(text: string, image?: string) {
    const content = text.trim();
    if (!content && !image) return;
    const body = content || "（发来一张图片）";
    const resumeText = resume.sections.map((section) => `${section.title}：${section.after}`).join("\n");
    const reply = body.startsWith("请读取我的当前简历")
      ? `已读取「${resume.name}」，目标是${resume.target}。\n${resumeText.slice(0, 900)}`
      : image
        ? `图片已留下。我按文字回答；图片里的字需要你再打一行。\n${answerQuestion(body, job.id)}`
        : answerQuestion(body, job.id);
    const stamp = Date.now();
    pushMessage({ id: `u-${stamp}`, role: "user", text: body, image });
    pushMessage({ id: `a-${stamp + 1}`, role: "assistant", text: reply });
    setDraft("");
  }

  function listen() {
    const host = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = host.SpeechRecognition || host.webkitSpeechRecognition;
    if (!Ctor) {
      notify("这台浏览器没有语音转文字");
      return;
    }
    const rec = new Ctor();
    rec.lang = "zh-CN";
    rec.onresult = (event) => {
      const said = event.results[0]?.[0]?.transcript ?? "";
      if (said) setDraft((prev) => (prev ? `${prev}${said}` : said));
    };
    rec.onerror = () => notify("没有听清，可以再试一次或直接打字");
    rec.start();
  }

  async function onDoc(file: File) {
    const text = await readUpload(file);
    if (!text.trim()) {
      notify("没有读出这份文件的正文");
      return;
    }
    ask(`【文档 ${file.name}】\n${text.slice(0, 1500)}`);
  }

  function onImage(file: File) {
    if (!file.type.startsWith("image/")) {
      notify("请选择图片");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      notify("图片不能超过 1MB，避免本地存储空间不足");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = typeof reader.result === "string" ? reader.result : "";
      if (image) ask(draft || `【图片】${file.name}`, image);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="assist-page">
      <div className="assist-layout">
        <aside className="card glass prompt-scroll">
          <div className="text-row">
            <button className="quiet" type="button" onClick={newChat}>新对话</button>
          </div>
          <div className="prompt-list">
            {chats.map((chat) => (
              <button key={chat.id} className={`quiet${chat.id === currentChatId ? " on" : ""}`} type="button" onClick={() => selectChat(chat.id)}>{chat.title}</button>
            ))}
          </div>
          {grouped.map((group) => (
            <div key={group.group}>
              <span className="group-label">{group.group}</span>
              <div className="prompt-list">
                {group.items.map((item) => (
                  <button key={item.id} className="prompt-btn" type="button" onClick={() => ask(item.label)}>{item.label}</button>
                ))}
              </div>
            </div>
          ))}
        </aside>
        <section className="card glass-read assist-main">
          <div className="text-row">
            <button className="quiet" type="button" onClick={() => ask(`请读取我的当前简历「${resume.name}」。\n${resume.sections.map((section) => section.title).join("、")}`)}>
              <FileText size={14} /> 读取简历
            </button>
          </div>
          <div className="thread">
            {messages.map((item) => (
              <div key={item.id} className={`bubble ${item.role}`}>
                {item.image ? <img className="chat-image" src={item.image} alt="" /> : null}
                <RichText text={item.text} />
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form className="chat-form" onSubmit={(event) => { event.preventDefault(); ask(draft); }}>
            <button className="quiet" type="button" aria-label="发图片" onClick={() => imageRef.current?.click()}><ImagePlus size={16} /></button>
            <button className="quiet" type="button" aria-label="发文档" onClick={() => fileRef.current?.click()}><Paperclip size={16} /></button>
            <button className="quiet" type="button" aria-label="语音转文字" onClick={listen}><Mic size={16} /></button>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="直接问，或发图片、文档、语音" aria-label="提问" />
            <button className="plane-mark tip" type="submit" data-tip="发送" aria-label="发送"><Send size={16} /></button>
            <input ref={imageRef} hidden type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onImage(file); }} />
            <input ref={fileRef} hidden type="file" accept=".txt,.md,.pdf,.docx,.doc" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void onDoc(file); }} />
          </form>
        </section>
      </div>
    </div>
  );
}
