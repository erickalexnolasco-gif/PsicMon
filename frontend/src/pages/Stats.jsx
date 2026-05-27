import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { dashboardApi, patientsApi, sessionsApi } from "../lib/api";
import { TrendingUp, Users, CheckCircle2, Calendar as CalIcon } from "lucide-react";

const Stats = () => {
  const { psicologa } = useAuth();
  const [monthly, setMonthly] = useState([]);
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!psicologa) return;
    Promise.all([
      dashboardApi.monthly(psicologa.id),
      patientsApi.list(psicologa.id),
      sessionsApi.list(psicologa.id),
    ]).then(([m, p, s]) => {
      setMonthly(m.meses);
      setPatients(p);
      setSessions(s);
    });
  }, [psicologa]);

  const max = Math.max(...monthly.map((m) => m.sesiones), 1);
  const totalCompletadas = sessions.filter((s) => s.estado === "completada").length;
  const totalProgramadas = sessions.filter((s) => s.estado === "programada").length;
  const totalCanceladas = sessions.filter((s) => s.estado === "cancelada").length;
  const modalidadCounts = patients.reduce((acc, p) => {
    acc[p.modalidad] = (acc[p.modalidad] || 0) + 1;
    return acc;
  }, {});

  return (
    <Layout>
      <div className="mb-8 fade-up">
        <h1 className="font-display text-5xl" style={{ color: "var(--psi-text)" }} data-testid="stats-title">Estadísticas</h1>
        <p className="text-psi-soft mt-1">Tu consulta en números</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard icon={Users} label="Total pacientes" value={patients.length} color="#E8A0BF" testid="stat-total-patients" />
        <MetricCard icon={CheckCircle2} label="Sesiones completadas" value={totalCompletadas} color="#A8D5A2" testid="stat-completed" />
        <MetricCard icon={CalIcon} label="Programadas" value={totalProgramadas} color="#F4C6A0" testid="stat-scheduled" />
        <MetricCard icon={TrendingUp} label="Canceladas" value={totalCanceladas} color="#EF9A9A" testid="stat-cancelled" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-soft p-7 fade-up-delay-1" data-testid="monthly-chart">
          <h3 className="font-display text-2xl mb-5">Sesiones por mes</h3>
          <div className="flex items-end gap-4 h-56">
            {monthly.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "var(--psi-text)" }}>{m.sesiones}</span>
                <div className="w-full rounded-t-xl transition-all" style={{
                  height: `${(m.sesiones / max) * 100}%`,
                  minHeight: 4,
                  background: `linear-gradient(180deg, #E8A0BF, #D88AAB)`,
                  boxShadow: "0 4px 12px rgba(216, 138, 171, 0.25)",
                }} />
                <span className="text-xs text-psi-soft capitalize">{m.mes}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-soft p-7 fade-up-delay-2" data-testid="modality-chart">
          <h3 className="font-display text-2xl mb-5">Pacientes por modalidad</h3>
          <div className="space-y-3">
            {Object.entries({ presencial: 0, online: 0, mixta: 0, ...modalidadCounts }).map(([k, v]) => {
              const pct = patients.length > 0 ? (v / patients.length) * 100 : 0;
              const color = k === "presencial" ? "#E8A0BF" : k === "online" ? "#A2C8E8" : "#C8A2E8";
              return (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="capitalize" style={{ color: "var(--psi-text)" }}>{k}</span>
                    <span className="text-psi-soft">{v}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(232, 160, 191, 0.12)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const MetricCard = ({ icon: Icon, label, value, color, testid }) => (
  <div className="card-soft p-6 fade-up" data-testid={testid}>
    <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 6px 14px ${color}40` }}>
      <Icon className="text-white" size={20} />
    </div>
    <p className="text-psi-soft text-sm">{label}</p>
    <p className="font-display text-4xl mt-1" style={{ color: "var(--psi-text)" }}>{value}</p>
  </div>
);

export default Stats;
