// Helpers
export const initials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const formatDate = (iso, opts = {}) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", ...opts });
};

export const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
};

export const formatDateTime = (iso) => {
  if (!iso) return "";
  return `${formatDate(iso)} · ${formatTime(iso)}`;
};

export const relativeTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d - now;
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 60) return diffMin === 0 ? "ahora" : (diffMin > 0 ? `en ${diffMin} min` : `hace ${-diffMin} min`);
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return diffH > 0 ? `en ${diffH} h` : `hace ${-diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (Math.abs(diffD) < 30) return diffD > 0 ? `en ${diffD} días` : `hace ${-diffD} días`;
  return formatDate(iso);
};

export const cx = (...args) => args.filter(Boolean).join(" ");

export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
export const startOfWeek = (d) => {
  const x = new Date(d);
  const day = x.getDay(); // 0 sun
  const diff = (day === 0 ? -6 : 1) - day; // make Monday = 0
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const monthName = (d) => d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
export const dayLabel = (d) => d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
