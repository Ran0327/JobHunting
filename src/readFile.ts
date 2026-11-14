export async function readUpload(file: File) {
  const name = file.name.toLowerCase();
  if (/\.(txt|md)$/.test(name) || file.type.startsWith("text/")) return (await file.text()).trim();
  const buf = await file.arrayBuffer();
  if (name.endsWith(".docx")) return (await docxText(buf)).trim();
  if (name.endsWith(".pdf")) return pdfText(buf).trim();
  return "";
}

function xmlToText(xml: string) {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function inflate(bytes: ArrayBuffer) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}

async function docxText(buf: ArrayBuffer) {
  const view = new DataView(buf);
  let offset = 0;
  while (offset + 30 < view.byteLength) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;
    const method = view.getUint16(offset + 8, true);
    const compSize = view.getUint32(offset + 18, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(buf.slice(offset + 30, offset + 30 + nameLen));
    const dataStart = offset + 30 + nameLen + extraLen;
    if (!compSize) break;
    if (name === "word/document.xml") {
      const bytes = buf.slice(dataStart, dataStart + compSize);
      const xml = method === 0 ? new TextDecoder().decode(bytes) : method === 8 ? await inflate(bytes) : "";
      return xmlToText(xml);
    }
    offset = dataStart + compSize;
  }
  return "";
}

function pdfText(buf: ArrayBuffer) {
  const raw = new TextDecoder("latin1").decode(buf);
  const parts: string[] = [];
  const re = /\((?:\\\)|[^)]){2,}\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const text = match[0].slice(1, -1).replace(/\\n/g, "\n").replace(/\\(.)/g, "$1");
    if (/[\u4e00-\u9fffA-Za-z]{4,}/.test(text)) parts.push(text);
  }
  return parts.join("\n").slice(0, 4000);
}
