import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Bookmark, FileText, MoreHorizontal, UserRound } from "lucide-react";
import { useApp } from "../store";

const items = [
  { to: "/community/notices", label: "消息通知", icon: Bell },
  { to: "/favorites", label: "我的收藏", icon: Bookmark },
  { to: "/mine", label: "我的发布", icon: FileText },
  { to: "/profile", label: "个人信息", icon: UserRound },
];

export function UserMenu() {
  const { profile, leaveGuard } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const name = profile.name.trim() || "未填写姓名";

  function go(to: string) {
    if (!leaveGuard) {
      navigate(to);
      return;
    }
    leaveGuard(() => navigate(to));
  }

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-user-menu]")) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" data-user-menu>
      <button className="user-menu-trigger" type="button" aria-label="个人菜单" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="hub-avatar">{profile.avatar ? <img src={profile.avatar} alt="" /> : name.slice(0, 1)}</span>
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div className="user-menu-pop" role="menu">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} role="menuitem" onClick={(event) => { event.preventDefault(); setOpen(false); go(item.to); }}>
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
