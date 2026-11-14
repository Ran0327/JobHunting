import { useEffect, useRef, useState } from "react";
import { Mic, Send } from "lucide-react";
import { RichText } from "../components/RichText";
import interviewer from "../assets/interviewer.jpg";
import { interviewCatalog } from "../interviewCatalog";
import { reviewAnswer } from "../replies";
import { useApp } from "../store";

type SpeechRec = {
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type Turn = { id: string; role: "user" | "interviewer"; text: string };

function InterviewerFace({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  return (
    <div className={`sim-person${speaking ? " speaking" : ""}${listening ? " listening" : ""}`}>
      <img src={interviewer} alt="模拟面试官" />
    </div>
  );
}

export function Interview() {
  const { notify } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ category: string; direction: string } | null>(null);
  const [questionId, setQuestionId] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const category = interviewCatalog.find((item) => item.name === picked?.category);
  const direction = category?.directions.find((item) => item.name === picked?.direction);
  const questions = direction?.questions ?? [];
  const question = questions.find((item) => item.id === questionId) ?? questions[0];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns.length]);

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    return () => window.speechSynthesis?.cancel();
  }, []);

  function speak(text: string) {
    const host = window.speechSynthesis;
    if (!host) return;
    const run = () => {
      host.cancel();
      const utter = new SpeechSynthesisUtterance(text.replace(/\s*\n+\s*/g, "。").replace(/[；;]/g, "，"));
      utter.lang = "zh-CN";
      const voices = host.getVoices().filter((item) => item.lang.toLowerCase().startsWith("zh"));
      utter.voice = ["晓伊", "Xiaoyi", "晓晓", "Xiaoxiao"].map((name) => voices.find((item) => item.name.includes(name))).find(Boolean) ?? voices.find((item) => /Natural|Online/i.test(item.name)) ?? voices[0] ?? null;
      utter.rate = 1.08;
      utter.pitch = 1.05;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.setTimeout(() => {
        host.resume();
        host.speak(utter);
      }, 40);
    };
    if (host.getVoices().length) run();
    else host.addEventListener("voiceschanged", run, { once: true });
  }

  function openQuestion(categoryName: string, directionName: string, id: string, text: string) {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setPicked({ category: categoryName, direction: directionName });
    setQuestionId(id);
    setTurns([{ id: `q-${id}-${Date.now()}`, role: "interviewer", text }]);
    setDraft("");
    speak(text);
  }

  function send(text: string) {
    const content = text.trim();
    if (!question) {
      notify("先在左侧选一个方向");
      return;
    }
    if (!content) return;
    const review = reviewAnswer(question.id, content);
    const stamp = Date.now();
    setTurns((prev) => [
      ...prev,
      { id: `u-${stamp}`, role: "user", text: content },
      { id: `a-${stamp}`, role: "interviewer", text: review },
    ]);
    setDraft("");
    speak(review);
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
    setListening(true);
    rec.onresult = (event) => {
      const said = event.results[0]?.[0]?.transcript ?? "";
      if (said) setDraft((prev) => (prev ? `${prev}${said}` : said));
    };
    rec.onerror = () => {
      setListening(false);
      notify("没有听清，可以再试一次或直接打字");
    };
    rec.onend = () => setListening(false);
    rec.start();
  }

  const status = speaking ? "正在说" : listening ? "正在听" : "面试官";

  return (
    <div className="assist-page">
      <div className="assist-layout interview-board">
        <aside className="card glass prompt-scroll interview-nav">
          {interviewCatalog.map((item) => (
            <div key={item.name}>
              <button
                className={`cat-name${open === item.name ? " on" : ""}`}
                type="button"
                aria-expanded={open === item.name}
                onClick={() => setOpen((prev) => (prev === item.name ? null : item.name))}
              >
                {item.name}
              </button>
              {open === item.name ? (
                <div className="dir-list">
                  {item.directions.map((dir) => (
                    <button
                      key={dir.name}
                      className={`dir-name${picked?.category === item.name && picked.direction === dir.name ? " on" : ""}`}
                      type="button"
                      onClick={() => {
                        const first = dir.questions[0];
                        if (first) openQuestion(item.name, dir.name, first.id, first.text);
                      }}
                    >
                      {dir.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </aside>
        <section className="card glass-read assist-main">
          <div className="sim-stage">
            <InterviewerFace speaking={speaking} listening={listening} />
            <div>
              <strong>{picked?.direction ?? "模拟面试官"}</strong>
              <p className="hint">{status}。打字、语音和在线对话都在这一屏。</p>
            </div>
          </div>
          {questions.length > 1 ? (
            <div className="text-row">
              {questions.map((item) => (
                <button
                  key={item.id}
                  className={`quiet${item.id === question?.id ? " on" : ""}`}
                  type="button"
                  onClick={() => openQuestion(picked?.category ?? "", picked?.direction ?? "", item.id, item.text)}
                >
                  {item.topic}
                </button>
              ))}
            </div>
          ) : null}
          <div className="thread">
            {turns.length === 0 ? <p className="hint">先点左侧的大类，再选一个方向。面试官会在这里提问。</p> : null}
            {turns.map((item) => (
              <div key={item.id} className={`bubble ${item.role === "user" ? "user" : "assistant"}`}>
                <RichText text={item.text} />
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form className="chat-form" onSubmit={(event) => { event.preventDefault(); send(draft); }}>
            <button className={`quiet${listening ? " on" : ""}`} type="button" aria-label="发语音" onClick={listen}><Mic size={16} /></button>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="打字回答，或点麦克风说话" aria-label="回答" />
            <button className="plane-mark tip" type="submit" data-tip="发送" aria-label="发送"><Send size={16} /></button>
          </form>
        </section>
      </div>
    </div>
  );
}
