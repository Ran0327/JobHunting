import { Briefcase, GraduationCap, School, UserRound, Wrench } from "lucide-react";

export const resumeSections = {
  个人信息: { icon: UserRound, tone: "person" },
  专业技能: { icon: Wrench, tone: "skill" },
  工作经历: { icon: Briefcase, tone: "work" },
  教育背景: { icon: GraduationCap, tone: "edu" },
  校园经历: { icon: School, tone: "campus" },
} as const;

const split = /(\d{4}\.\d{2}\s*[–—-]\s*(?:\d{4}\.\d{2}|至今)|\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*(?:秒|万|人|次|名|届|个月))/;
const mark = /^(?:\d{4}\.\d{2}\s*[–—-]\s*(?:\d{4}\.\d{2}|至今)|\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*(?:秒|万|人|次|名|届|个月))$/;

export function Highlight({ text }: { text: string }) {
  const parts = text.split(split);
  return (
    <>
      {parts.map((part, index) => (mark.test(part) ? <em key={index}>{part}</em> : <span key={index}>{part}</span>))}
    </>
  );
}

export function RichText({ text, empty }: { text: string; empty?: string }) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return empty ? <p className="resume-line">{empty}</p> : null;
  return (
    <div className="rich-text">
      {lines.map((line, index) => {
        if (line.includes("｜")) {
          return (
            <div key={index} className="resume-chips">
              {line.split("｜").map((part) => part.trim()).filter(Boolean).map((part, partIndex) => <span key={partIndex}>{part}</span>)}
            </div>
          );
        }
        if (line.startsWith("求职意向")) {
          const body = line.replace(/^求职意向[:：]\s*/, "");
          return <p key={index} className="resume-line"><strong>求职意向</strong><Highlight text={body} /></p>;
        }
        const bullet = /^[·•]\s*/.test(line);
        return (
          <p key={index} className={bullet ? "resume-line bullet" : "resume-line"}>
            <Highlight text={bullet ? line.replace(/^[·•]\s*/, "") : line} />
          </p>
        );
      })}
    </div>
  );
}
