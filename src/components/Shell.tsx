import { useState, type CSSProperties } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bookmark, Briefcase, FileText, Flag, LayoutDashboard, MessageSquare, Mic, RotateCcw, Search, Sparkles, UserRound, Users, X } from "lucide-react";
import { ApplyDialogs } from "./ApplyDialogs";
import { UserMenu } from "./UserMenu";
import { useApp } from "../store";

const nav = [
  { to: "/", label: "工作台", icon: LayoutDashboard, end: true },
  { to: "/jobs", label: "职位", icon: Briefcase, end: false },
  { to: "/resumes", label: "简历", icon: FileText, end: false },
  { to: "/assistant", label: "AI 助手", icon: Sparkles, end: false },
  { to: "/progress", label: "进度", icon: Flag, end: false },
  { to: "/favorites", label: "收藏", icon: Bookmark, end: false },
  { to: "/community", label: "社区", icon: Users, end: false },
];

const petals = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 37 + 7) % 100}%`,
  dx: `${((index * 29) % 160) - 80}px`,
  duration: `${9 + ((index * 7) % 9)}s`,
  delay: `${-((index * 11) % 15)}s`,
  scale: 0.6 + ((index * 13) % 8) / 10,
}));

function heading(pathname: string) {
  if (pathname.startsWith("/jobs/")) return ["职位详情", "薪资、门槛、入口和风险放在同一页"];
  if (pathname.startsWith("/jobs")) return ["职位管理", "岗位、学历和薪资都在下拉里"];
  if (pathname.startsWith("/resumes")) return ["简历管理", "新建简历，用下拉切换每一次编辑"];
  if (pathname.startsWith("/assistant")) return ["AI 求职助手", "可以发图片、文档和语音，也能新开一段对话"];
  if (pathname.startsWith("/interview")) return ["模拟面试", "打字、语音，屏幕上是模拟面试官。题目按行业放在左侧"];
  if (pathname.startsWith("/favorites")) return ["我的收藏", "职位、简历和帖子放在一起"];
  if (pathname.startsWith("/mine")) return ["我的发布", "已分享的简历，和你发过的帖子"];
  if (pathname.startsWith("/community")) return ["简历社区", "从简历页分享出来的内容"];
  if (pathname.startsWith("/progress")) return ["求职进度", "已投递、笔试、面试、Offer、未通过"];
  if (pathname.startsWith("/profile")) return ["个人信息", "侧边栏、工作台和网申预填用的是这里"];
  return ["工作台", "数字来自你确认过的投递和勾选的进度"];
}

export function Shell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { reset, toast, profile, leaveGuard } = useApp();
  const [q, setQ] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [title, sub] = heading(pathname);

  function go(to: string, event?: { preventDefault: () => void }) {
    if (!leaveGuard) {
      if (event) return;
      navigate(to);
      return;
    }
    event?.preventDefault();
    leaveGuard(() => navigate(to));
  }

  async function doReset() {
    setResetting(true);
    try {
      await reset();
      setResetOpen(false);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="shell">
      <div className="cloud-bg" aria-hidden="true" />
      <div className="petal-field" aria-hidden="true">
        {petals.map((petal, index) => (
          <span
            key={index}
            className="petal"
            style={{
              left: petal.left,
              "--dx": petal.dx,
              animationDuration: petal.duration,
              animationDelay: petal.delay,
              scale: petal.scale,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <aside className="sidebar glass">
        <div className="brand">
          <div className="logo-mark">职</div>
          <div>
            <strong>职途</strong>
            <p>求职助手</p>
          </div>
        </div>
        <nav className="side-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                onClick={(event) => go(item.to, event)}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <NavLink to="/profile" className={({ isActive }) => `side-user${isActive ? " on" : ""}`} aria-label="编辑个人信息" onClick={(event) => go("/profile", event)}>
          <div className="avatar">{profile.avatar ? <img src={profile.avatar} alt="" /> : (profile.name.trim().slice(0, 1) || "人")}</div>
          <div>
            <strong>{profile.name.trim() || "未填写姓名"}</strong>
            <p>{[profile.cohort, profile.city].filter(Boolean).join(" · ") || "去填写届别和城市"}</p>
          </div>
        </NavLink>
        <button className="text-btn" type="button" onClick={() => setResetOpen(true)}>
          <RotateCcw size={14} /> 重置演示
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar glass-read">
          <div>
            <h1 className="with-icon">{pathname.startsWith("/profile") ? <UserRound size={18} /> : pathname.startsWith("/favorites") ? <Bookmark size={18} /> : pathname.startsWith("/mine") ? <FileText size={18} /> : pathname.startsWith("/interview") ? <Mic size={18} /> : pathname.startsWith("/community") ? <Users size={18} /> : pathname.startsWith("/assistant") ? <MessageSquare size={18} /> : pathname.startsWith("/jobs") ? <Briefcase size={18} /> : pathname.startsWith("/resumes") ? <FileText size={18} /> : pathname.startsWith("/progress") ? <Flag size={18} /> : <LayoutDashboard size={18} />} {title}</h1>
            <p>{sub}</p>
          </div>
          <div className="top-tools">
            <form
              className="top-search"
              onSubmit={(event) => {
                event.preventDefault();
                go(q.trim() ? `/jobs?q=${encodeURIComponent(q.trim())}` : "/jobs");
              }}
            >
              <Search size={16} />
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="搜索岗位、公司或别名，例如前端" aria-label="搜索岗位" />
            </form>
            <UserMenu />
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
      {resetOpen ? (
        <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="version-dialog">
            <button className="apply-x" type="button" aria-label="关闭" onClick={() => { if (!resetting) setResetOpen(false); }}><X size={16} /></button>
            <div className="version-dialog-row">
              <span className="version-dialog-mark" aria-hidden="true"><RotateCcw size={18} /></span>
              <div>
                <h2 id="reset-title">重置演示数据？</h2>
                <p>会清空当前浏览器里的投递、简历版本、聊天和社区数据，并清理 IndexedDB 中的 Word 文件。</p>
                <p className="version-dialog-risk">重置前会把文字数据备份到浏览器本地；重置后页面会回到初始演示状态。</p>
              </div>
            </div>
            <div className="version-dialog-actions">
              <button className="apply-cancel" type="button" disabled={resetting} onClick={() => setResetOpen(false)}>取消</button>
              <button className="version-dialog-danger" type="button" disabled={resetting} onClick={() => { void doReset(); }}>{resetting ? "重置中…" : "确认重置"}</button>
            </div>
          </div>
        </div>
      ) : null}
      <ApplyDialogs />
    </div>
  );
}
