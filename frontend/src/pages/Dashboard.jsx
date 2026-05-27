import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Layout from "../components/Layout";
import { dashboardApi } from "../lib/api";
import { Calendar, Users, CheckCircle2, Clock, ChevronRight, TrendingUp } from "lucide-react";
import Avatar from "../components/Avatar";
import { formatTime, relativeTime, dayLabel } from "../lib/helpers";

const StatCard = ({ icon: Icon, label, value, accent, testid }) => (
  <div className="card-soft p-6 fade-up" data-testid={testid}>
    <div className="flex items-start justify-between mb-3">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: accent, boxShadow: `0 6px 14px ${accent}40` }}>
        <Icon className="text-white" size={20} />
      </div>
      <TrendingUp size={14} className="text-psi-soft opacity-50" />
    </div>
    <p className="text-psi-soft text-sm mb-1">{label}</p>
    <p className="font-display text-4xl" style={{ color: "var(--psi-text)" }}>{value}</p>
  </div>
);

const Dashboard = () => {
  const { psicologa } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!psicologa) return;
    dashboardApi.stats(psicologa.id).then((s) => { setStats(s); setLoading(false); });
  }, [psicologa]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  const nombreCorto = psicologa?.nombre?.replace(/^Dra?\.?\s*/i, "").split(" ")[0] || "";

  return (
    <Layout>
      <div className="mb-10 fade-up">
        <p className="text-psi-soft text-sm mb-2">{dayLabel(new Date())}</p>
        <h1 className="font-display text-5xl" style={{ color: "var(--psi-text)" }} data-testid="dashboard-greeting">
          {greeting()}, {nombreCorto} <span className="inline-block animate-float">🌸</span>
        </h1>
        <p className="text-psi-soft mt-2">Aquí está el resumen de tu consulta de hoy.</p>
      </div>

      {loading ? (
        <div className="text-psi-soft" data-testid="dashboard-loading">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <StatCard testid="stat-sesiones-hoy" icon={Calendar} label="Sesiones de hoy" value={stats.sesiones_hoy} accent="linear-gradient(135deg, #E8A0BF, #D88AAB)" />
            <StatCard testid="stat-pacientes" icon={Users} label="Pacientes activos" value={stats.pacientes_activos} accent="linear-gradient(135deg, #F4C6A0, #e8a87a)" />
            <StatCard testid="stat-tareas" icon={CheckCircle2} label="Tareas pendientes" value={stats.tareas_pendientes} accent="linear-gradient(135deg, #A8D5A2, #8fc78a)" />
            <StatCard testid="stat-semana" icon={Clock} label="Esta semana" value={stats.sesiones_semana} accent="linear-gradient(135deg, #C8A2E8, #b08ad0)" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's sessions */}
            <div className="lg:col-span-2 card-soft p-7 fade-up-delay-2" data-testid="today-sessions-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-2xl" style={{ color: "var(--psi-text)" }}>Sesiones de hoy</h3>
                <button onClick={() => navigate("/calendar")} className="btn-ghost text-sm">Ver calendario <ChevronRight size={14} /></button>
              </div>
              {stats.sesiones_hoy_list.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-display text-2xl mb-2" style={{ color: "var(--psi-text)" }}>Un día tranquilo 🌷</p>
                  <p className="text-psi-soft text-sm">No tienes sesiones agendadas para hoy.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.sesiones_hoy_list.map((s, i) => (
                    <div
                      key={s.id}
                      onClick={() => navigate(`/patients/${s.patient_id}`)}
                      className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/60"
                      style={{ background: "rgba(255, 255, 255, 0.4)", border: "1px solid rgba(232, 160, 191, 0.12)" }}
                      data-testid={`today-session-${i}`}
                    >
                      <div className="text-center" style={{ minWidth: 60 }}>
                        <p className="font-display text-2xl" style={{ color: "var(--psi-text)" }}>{formatTime(s.fecha)}</p>
                        <p className="text-[10px] uppercase tracking-wider text-psi-soft">{s.duracion}min</p>
                      </div>
                      <div className="w-px self-stretch" style={{ background: "rgba(232, 160, 191, 0.2)" }} />
                      <Avatar name={s.patient?.nombre || "?"} color={s.patient?.color} size={42} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium" style={{ color: "var(--psi-text)" }}>{s.patient?.nombre}</p>
                        <p className="text-xs text-psi-soft">{s.patient?.motivo_consulta?.slice(0, 60)}...</p>
                      </div>
                      <span className={`badge ${s.tipo === "online" ? "badge-info" : "badge-pending"}`}>{s.tipo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next session widget */}
            <div className="card-soft p-7 fade-up-delay-3 flex flex-col" data-testid="next-session-card" style={{ background: "linear-gradient(135deg, rgba(253, 232, 240, 0.8), rgba(249, 212, 212, 0.5))" }}>
              <h3 className="font-display text-2xl mb-4" style={{ color: "var(--psi-text)" }}>Próxima sesión</h3>
              {stats.proxima_sesion ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-5">
                    <Avatar name={stats.proxima_sesion.patient?.nombre || "?"} color={stats.proxima_sesion.patient?.color} size={56} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-lg" style={{ color: "var(--psi-text)" }}>{stats.proxima_sesion.patient?.nombre}</p>
                      <p className="text-xs text-rosa-deep font-medium">{relativeTime(stats.proxima_sesion.fecha)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(232, 160, 191, 0.15)" }}>
                      <span className="text-psi-soft">Hora</span>
                      <span className="font-medium">{formatTime(stats.proxima_sesion.fecha)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(232, 160, 191, 0.15)" }}>
                      <span className="text-psi-soft">Duración</span>
                      <span className="font-medium">{stats.proxima_sesion.duracion} min</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-psi-soft">Modalidad</span>
                      <span className={`badge ${stats.proxima_sesion.tipo === "online" ? "badge-info" : "badge-pending"}`}>{stats.proxima_sesion.tipo}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/patients/${stats.proxima_sesion.patient_id}`)} className="btn-primary w-full justify-center mt-4">Ver expediente</button>
                </div>
              ) : (
                <p className="text-psi-soft text-sm">No tienes sesiones próximas agendadas.</p>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
