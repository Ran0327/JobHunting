import { useRef, useState } from "react";
import { Camera, GraduationCap, Sparkles, UserRound, X } from "lucide-react";
import type { Profile } from "../data";
import { useApp } from "../store";
import { directionLeaves, matchDirections } from "../taxonomy";

function cropAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      const scale = Math.max(size / img.width, size / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      ctx.drawImage(img, (size - width) / 2, (size - height) / 2, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

function Field({ label, value, onChange, area }: { label: string; value: string; onChange: (value: string) => void; area?: boolean }) {
  return (
    <label className="field">
      <span>{label}</span>
      {area ? <textarea value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

export function ProfilePage() {
  const { profile, updateProfile, notify } = useApp();
  const [direction, setDirection] = useState("");
  const found = matchDirections(direction);
  const fileRef = useRef<HTMLInputElement>(null);
  const initial = profile.name.trim().slice(0, 1) || "人";
  const line = [profile.cohort, profile.city, profile.school].filter(Boolean).join(" · ");

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    updateProfile({ [key]: value });
  }

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("请选择一张图片");
      return;
    }
    try {
      updateProfile({ avatar: await cropAvatar(file) });
      notify("头像已更新");
    } catch {
      notify("这张图打不开，换一张试试");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addDirection(name: string) {
    if (!directionLeaves().includes(name) || profile.directions.includes(name)) {
      setDirection("");
      return;
    }
    updateProfile({ directions: [...profile.directions, name] });
    setDirection("");
  }

  return (
    <div className="profile-page">
      <section className="profile-hero card glass-read">
        <div className="profile-avatar-col">
          <div className="profile-avatar-wrap">
            <button className="profile-avatar" type="button" aria-label="换头像" onClick={() => fileRef.current?.click()}>
              {profile.avatar ? <img src={profile.avatar} alt="" /> : initial}
            </button>
            <span className="profile-avatar-badge" aria-hidden="true"><Camera size={14} /></span>
          </div>
          {profile.avatar ? <button className="btn btn-ghost profile-clear" type="button" onClick={() => updateProfile({ avatar: "" })}>去掉照片</button> : null}
          <input ref={fileRef} className="profile-file" type="file" accept="image/*" aria-label="选择头像图片" onChange={(event) => void onAvatar(event.target.files?.[0])} />
        </div>
        <div className="grow">
          <h2>{profile.name.trim() || "还没写姓名"}</h2>
          <p className="profile-line">{line || "届别、城市和学校会显示在这里"}</p>
          <div className="tags">
            {profile.directions.map((item) => <span key={item} className="badge tone-indigo">{item}</span>)}
            {profile.salaryExpect ? <span className="badge tone-slate">{profile.salaryExpect}</span> : null}
          </div>
        </div>
      </section>

      <div className="profile-layout">
        <section className="profile-card person">
          <h3><UserRound size={15} /> 基本信息</h3>
          <div className="profile-body">
            <Field label="姓名" value={profile.name} onChange={(value) => set("name", value)} />
            <Field label="手机" value={profile.phone} onChange={(value) => set("phone", value)} />
            <Field label="邮箱" value={profile.email} onChange={(value) => set("email", value)} />
            <Field label="城市" value={profile.city} onChange={(value) => set("city", value)} />
          </div>
        </section>

        <section className="profile-card study">
          <h3><GraduationCap size={15} /> 学业</h3>
          <div className="profile-body">
            <Field label="学校" value={profile.school} onChange={(value) => set("school", value)} />
            <Field label="专业与学历" value={profile.major} onChange={(value) => set("major", value)} />
            <Field label="毕业届别" value={profile.cohort} onChange={(value) => set("cohort", value)} />
            <Field label="当前状态" value={profile.status} onChange={(value) => set("status", value)} area />
          </div>
        </section>

        <section className="profile-card aim">
          <h3><Sparkles size={15} /> 求职意向</h3>
          <div className="profile-body">
            <div className="field">
              <span>方向</span>
              <div className="profile-dirs">
                {profile.directions.map((item) => (
                  <button key={item} type="button" className="badge tone-indigo profile-dir" onClick={() => updateProfile({ directions: profile.directions.filter((dir) => dir !== item) })}>
                    {item} <X size={12} />
                  </button>
                ))}
              </div>
              <input
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
                placeholder="搜索系统里的方向"
                aria-label="搜索求职方向"
              />
              <div className="suggest-list">
                {found.exact.map((item) => (
                  <button key={item} type="button" className="quiet" onClick={() => addDirection(item)}>{item}</button>
                ))}
                {direction.trim() && found.exact.length === 0 ? (
                  <p className="hint">系统里没有「{direction.trim()}」。{found.suggest.length ? `可以改选：${found.suggest.join("、")}` : "换一个说法。"}</p>
                ) : null}
                {direction.trim() && found.exact.length === 0 ? found.suggest.map((item) => (
                  <button key={item} type="button" className="quiet" onClick={() => addDirection(item)}>{item}</button>
                )) : null}
              </div>
            </div>
            <Field label="期望薪资" value={profile.salaryExpect} onChange={(value) => set("salaryExpect", value)} />
            <Field label="一段背景" value={profile.background} onChange={(value) => set("background", value)} area />
          </div>
        </section>
      </div>
    </div>
  );
}
