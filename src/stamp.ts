export function formatStamp(date = new Date()) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatDraftStamp(date = new Date(), peers: { savedAt: string }[] = []) {
  const day = formatStamp(date);
  const clock = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const timed = `${day} ${clock}`;
  const collides = peers.some((item) => {
    const raw = item.savedAt.replace(/编辑$/, "").trim();
    return raw === day || raw.startsWith(`${day} `);
  });
  return collides ? timed : day;
}

export function draftLabel(savedAt: string) {
  const raw = savedAt.endsWith("编辑") ? savedAt.slice(0, -2).trim() : savedAt.trim();
  if (!raw) return "编辑记录";
  return raw.includes(" ") ? `${raw} 编辑` : `${raw}编辑`;
}
