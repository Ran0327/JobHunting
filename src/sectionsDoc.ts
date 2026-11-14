import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { ResumeDraft, ResumeSection } from "./data";

function buildDoc(title: string, blocks: Paragraph[]) {
  const doc = new Document({
    sections: [{ children: blocks.length ? blocks : [new Paragraph({ text: title || "简历" })] }],
  });
  return Packer.toBlob(doc);
}

export function sectionsToDocx(title: string, sections: ResumeSection[]) {
  const blocks = sections.flatMap((section) => {
    const lines = section.after.split(/\n/);
    return [
      ...(section.title.trim() ? [new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 })] : []),
      ...(lines.length ? lines : [""]).map((line) => new Paragraph({ children: [new TextRun(line)] })),
    ];
  });
  return buildDoc(title, blocks);
}

export function draftToDocx(title: string, draft: ResumeDraft) {
  const body = draft.body?.trim();
  if (!body) return sectionsToDocx(title, draft.sections);
  const blocks = body.split(/\n/).map((line) => new Paragraph({ children: [new TextRun(line)] }));
  return buildDoc(title, blocks);
}
