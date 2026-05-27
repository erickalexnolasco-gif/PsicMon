import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Layout from "../components/Layout";
import { sessionsApi, patientsApi } from "../lib/api";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { startOfMonth, endOfMonth, startOfWeek, addDays, sameDay, monthName, formatTime } from "../lib/helpers";
import { Modal, Drawer } from "../components/Overlay";
import Avatar from "../components/Avatar";
import { useToast } from "../components/Toast";

const Calendar = () => {
  const { psicologa } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  });
  const [view, setView] = useState("month"); // month | week | day
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const refresh = async () => {
    if (!psicologa) return;
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    // expand range to fill calendar grid
    const gridStart = startOfWeek(start);
    const gridEnd = addDays(gridStart, 41);
    const [s, p] = await Promise.all([
      sessionsApi.list(psicologa.id, { start: gridStart.toISOString(), end: gridEnd.toISOString() }),
      patientsApi.list(psicologa.id),
    ]);
    setSessions(s);
    setPatients(p);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [psicologa, currentMonth]);

  // Build month grid (6 weeks x 7 days)
  const grid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [currentMonth]);

  const sessionsByDay = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      const d = new Date(s.fecha);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [sessions]);

  const patientById = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p])), [patients]);

  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const handleSave = async (formData) => {
    try {
      if (editingSession) {
        await sessionsApi.update(editingSession.id, formData);
        toast.push("Sesión actualizada", "success");
      } else {
        await sessionsApi.create(formData, psicologa.id);
        toast.push("Sesión agendada 🌸", "success");
      }
      setShowModal(false);
      setEditingSession(null);
      refresh();
    } catch (e) {
      toast.push("Error al guardar", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta sesión?")) return;
    await sessionsApi.remove(id);
    toast.push("Sesión eliminada");
    setSelectedDay(null);
    refresh();
  };

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8 fade-up">
        <div>
          <h1 className="font-display text-5xl capitalize" style={{ color: "var(--psi-text)" }} data-testid="calendar-title">{monthName(currentMonth)}</h1>
          <p className="text-psi-soft mt-1">{sessions.length} sesiones este periodo</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="tab-list" style={{ width: "auto" }}>
            <button onClick={() => setView("month")} className={`tab-item ${view === "month" ? "active" : ""}`} data-testid="view-month">Mes</button>
            <button onClick={() => setView("week")} className={`tab-item ${view === "week" ? "active" : ""}`} data-testid="view-week">Semana</button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))} className="btn-secondary p-2" data-testid="cal-prev"><ChevronLeft size={16} /></button>
            <button onClick={() => { const d = new Date(); d.setDate(1); setCurrentMonth(d); }} className="btn-secondary" data-testid="cal-today">Hoy</button>
            <button onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))} className="btn-secondary p-2" data-testid="cal-next"><ChevronRight size={16} /></button>
          </div>
          <button onClick={() => { setEditingSession(null); setShowModal(true); }} className="btn-primary" data-testid="new-session-btn">
            <Plus size={16} /> Nueva sesión
          </button>
        </div>
      </div>

      {view === "month" && (
        <div className="card-soft p-6 fade-up-delay-1" data-testid="calendar-month">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs uppercase tracking-wider text-psi-soft font-medium py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {grid.map((d, i) => {
              const isOther = d.getMonth() !== currentMonth.getMonth();
              const isToday = sameDay(d, new Date());
              const daySessions = sessionsByDay[dayKey(d)] || [];
              return (
                <div
                  key={i}
                  className={`cal-cell ${isOther ? "other-month" : ""} ${isToday ? "today" : ""}`}
                  onClick={() => setSelectedDay(d)}
                  data-testid={`cal-cell-${d.getDate()}`}
                >
                  <span className="text-sm font-medium" style={{ color: isToday ? "var(--psi-rosa-deep)" : "var(--psi-text)" }}>{d.getDate()}</span>
                  <div className="flex-1 mt-1 overflow-hidden">
                    {daySessions.slice(0, 3).map((s) => {
                      const p = patientById[s.patient_id];
                      return (
                        <div key={s.id} className="cal-session-pill" style={{ background: p?.color || "#E8A0BF" }}>
                          {formatTime(s.fecha)} {p?.nombre?.split(" ")[0]}
                        </div>
                      );
                    })}
                    {daySessions.length > 3 && (
                      <div className="text-[10px] text-psi-soft mt-1">+{daySessions.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && (
        <WeekView currentMonth={currentMonth} sessions={sessions} patientById={patientById} onClickDay={setSelectedDay} />
      )}

      {/* Day drawer */}
      <Drawer
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? selectedDay.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }) : ""}
        testid="day-drawer"
      >
        <div className="space-y-3">
          {selectedDay && (sessionsByDay[dayKey(selectedDay)] || []).length === 0 && (
            <p className="text-psi-soft text-sm py-6 text-center">No hay sesiones este día.</p>
          )}
          {selectedDay && (sessionsByDay[dayKey(selectedDay)] || []).map((s) => {
            const p = patientById[s.patient_id];
            return (
              <div key={s.id} className="p-4 rounded-2xl border" style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(232, 160, 191, 0.18)" }} data-testid="day-session-item">
                <div className="flex items-start gap-3">
                  <Avatar name={p?.nombre || "?"} color={p?.color} size={44} />
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: "var(--psi-text)" }}>{p?.nombre}</p>
                    <p className="text-sm text-psi-soft">{formatTime(s.fecha)} · {s.duracion}min · {s.tipo}</p>
                    {s.notas_previas && <p className="text-xs text-psi-soft mt-2">{s.notas_previas}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigate(`/patients/${p?.id}`)} className="btn-ghost text-xs">Ver paciente</button>
                  <button onClick={() => { setEditingSession(s); setSelectedDay(null); setShowModal(true); }} className="btn-ghost text-xs">Editar</button>
                  <button onClick={() => handleDelete(s.id)} className="btn-ghost text-xs" style={{ color: "var(--psi-alert)" }}>Eliminar</button>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => { setEditingSession({ fecha: selectedDay?.toISOString() }); setSelectedDay(null); setShowModal(true); }}
            className="btn-secondary w-full justify-center" data-testid="add-session-from-day"
          >
            <Plus size={14} /> Agendar este día
          </button>
        </div>
      </Drawer>

      {showModal && (
        <SessionFormModal
          patients={patients}
          defaultPsicologa={psicologa}
          session={editingSession}
          onClose={() => { setShowModal(false); setEditingSession(null); }}
          onSave={handleSave}
        />
      )}
    </Layout>
  );
};

const WeekView = ({ currentMonth, sessions, patientById, onClickDay }) => {
  const weekStart = startOfWeek(currentMonth);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 to 19

  return (
    <div className="card-soft p-6 fade-up-delay-1" data-testid="calendar-week">
      <div className="grid gap-2" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
        <div />
        {days.map((d) => (
          <div key={d} className="text-center pb-3">
            <p className="text-xs uppercase tracking-wider text-psi-soft">{d.toLocaleDateString("es-MX", { weekday: "short" })}</p>
            <p className={`font-display text-2xl ${sameDay(d, new Date()) ? "text-rosa-deep" : ""}`} style={{ color: sameDay(d, new Date()) ? "var(--psi-rosa-deep)" : "var(--psi-text)" }}>{d.getDate()}</p>
          </div>
        ))}
        {hours.map((h) => (
          <React.Fragment key={h}>
            <div className="text-xs text-psi-soft text-right pr-2 pt-1">{h}:00</div>
            {days.map((d) => {
              const daySessions = sessions.filter((s) => {
                const sd = new Date(s.fecha);
                return sameDay(sd, d) && sd.getHours() === h;
              });
              return (
                <div
                  key={d.toISOString() + h}
                  className="rounded-xl p-1 min-h-[44px] cursor-pointer transition-all"
                  style={{ background: "rgba(255, 255, 255, 0.4)", border: "1px solid rgba(232, 160, 191, 0.08)" }}
                  onClick={() => onClickDay(d)}
                >
                  {daySessions.map((s) => {
                    const p = patientById[s.patient_id];
                    return (
                      <div key={s.id} className="text-[10px] px-2 py-1 rounded-md text-white font-medium truncate" style={{ background: p?.color || "#E8A0BF" }}>
                        {p?.nombre}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const SessionFormModal = ({ patients, defaultPsicologa, session, onClose, onSave }) => {
  const isEdit = session && session.id;
  const initialDate = session?.fecha ? new Date(session.fecha) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const initialDateStr = `${initialDate.getFullYear()}-${pad(initialDate.getMonth() + 1)}-${pad(initialDate.getDate())}`;
  const initialTimeStr = `${pad(initialDate.getHours())}:${pad(initialDate.getMinutes())}`;

  const [form, setForm] = useState({
    patient_id: session?.patient_id || patients[0]?.id || "",
    fecha: initialDateStr,
    hora: initialTimeStr === "00:00" ? "10:00" : initialTimeStr,
    duracion: session?.duracion || defaultPsicologa?.duracion_default || 50,
    tipo: session?.tipo || "presencial",
    estado: session?.estado || "programada",
    notas_previas: session?.notas_previas || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const [year, month, day] = form.fecha.split("-").map(Number);
    const [hour, min] = form.hora.split(":").map(Number);
    const dt = new Date(year, month - 1, day, hour, min);
    const payload = {
      patient_id: form.patient_id,
      fecha: dt.toISOString(),
      duracion: parseInt(form.duracion),
      tipo: form.tipo,
      estado: form.estado,
      notas_previas: form.notas_previas,
    };
    onSave(payload);
  };

  return (
    <Modal open={true} onClose={onClose} title={isEdit ? "Editar sesión" : "Nueva sesión"} testid="session-modal">
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="session-form">
        <div>
          <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--psi-text)" }}>Paciente</label>
          <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="input-field" required data-testid="session-patient">
            {patients.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--psi-text)" }}>Fecha</label>
            <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="input-field" required data-testid="session-date" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--psi-text)" }}>Hora</label>
            <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="input-field" required data-testid="session-time" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--psi-text)" }}>Duración (min)</label>
            <input type="number" value={form.duracion} onChange={(e) => setForm({ ...form, duracion: e.target.value })} className="input-field" min="15" max="180" data-testid="session-duration" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--psi-text)" }}>Modalidad</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="input-field" data-testid="session-type">
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>
        {isEdit && (
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--psi-text)" }}>Estado</label>
            <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="input-field" data-testid="session-estado">
              <option value="programada">Programada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        )}
        <div>
          <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--psi-text)" }}>Notas previas</label>
          <textarea value={form.notas_previas} onChange={(e) => setForm({ ...form, notas_previas: e.target.value })} className="input-field" rows="3" placeholder="Temas a revisar, recordatorios..." data-testid="session-notes" />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button type="submit" className="btn-primary flex-1 justify-center" data-testid="session-save">{isEdit ? "Guardar cambios" : "Agendar sesión"}</button>
        </div>
      </form>
    </Modal>
  );
};

export default Calendar;
