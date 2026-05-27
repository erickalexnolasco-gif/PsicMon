import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LayoutDashboard, Calendar, Users, Settings, LogOut, Sparkles, BarChart3 } from "lucide-react";

const Sidebar = () => {
  const { psicologa, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="glass-pink h-screen w-64 fixed left-0 top-0 flex flex-col p-5 z-30" data-testid="sidebar">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8A0BF, #D88AAB)", boxShadow: "0 6px 16px rgba(216, 138, 171, 0.35)" }}>
          <Sparkles className="text-white" size={20} />
        </div>
        <div>
          <h1 className="font-display text-2xl leading-none" style={{ color: "var(--psi-text)" }}>PsiCare</h1>
          <p className="text-[10px] tracking-widest uppercase text-psi-soft mt-0.5">consulta</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} data-testid="nav-dashboard">
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} data-testid="nav-calendar">
          <Calendar size={18} /> Calendario
        </NavLink>
        <NavLink to="/patients" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} data-testid="nav-patients">
          <Users size={18} /> Pacientes
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} data-testid="nav-stats">
          <BarChart3 size={18} /> Estadísticas
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} data-testid="nav-settings">
          <Settings size={18} /> Ajustes
        </NavLink>
      </nav>

      <div className="border-t pt-4 mt-2" style={{ borderColor: "rgba(232, 160, 191, 0.2)" }}>
        <div className="flex items-center gap-3 px-2 pb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #E8A0BF, #D88AAB)" }}>
            {psicologa?.nombre?.split(" ")[1]?.[0] || "P"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--psi-text)" }}>{psicologa?.nombre}</p>
            <p className="text-xs text-psi-soft truncate">{psicologa?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item w-full" data-testid="logout-btn">
          <LogOut size={18} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
