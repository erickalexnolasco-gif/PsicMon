import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { patientsApi, tasksApi, sessionsApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import Avatar from "../components/Avatar";
import { useToast } from "../components/Toast";
import { Modal } from "../components/Overlay";
import { ArrowLeft, Plus, Trash2, GripVertical, CalendarClock, Edit3, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { formatDate, formatDateTime, formatTime } from "../lib/helpers";
import { PatientForm } from "./Patients";

const TABS = [
  { key: "datos", label: "Datos" },
  { key: "motivo", label: "Motivo" },
  { key: "plan", label: "Plan de intervención" },
  { key: "historial", label: "Historial" },
];

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { psicologa } = useAuth();
  const toast = useToast();
  const [patient, setPatient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState("datos");
  const [editing, setEditing] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [editingSession, setEditingSession] = useState(null);

  const refresh = async () => {
    if (!psicologa) return;
    try {
      const [p, t, s] = await Promise.all([
        patientsApi.get(id),
        tasksApi.list(id),
        sessionsApi.list(psicologa.id, { patient_id: id }),
      ]);
      setPatient(p);
      setTasks(t);
      setSessions(s);
    } catch (e) {
      toast.push("No se pudo cargar el paciente", "error");
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id, psicologa]);

  const handleDeletePatient = async () => {
    if (!window.confirm("¿Eliminar este paciente y todos sus datos? Esta acción no se puede deshacer.")) return;
    await patientsApi.remove(id);
    toast.push("Paciente eliminado");
    navigate("/patients");
  };

  const handleUpdate = async (data) => {
    await patientsApi.update(id, data);
    toast.push("Datos actualizados 🌸", "success");
    setEditing(false);
    refresh();
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    await tasksApi.create(id, { titulo: newTaskTitle.trim() });
    setNewTaskTitle("");
    toast.push("Objetivo agregado");
    refresh();
  };

  const toggleTask = async (task) => {
    const next = task.estado === "pendiente" ? "visto" : "pendiente";
    await tasksApi.update(task.id, { estado: next });
    refresh();
  };

  const deleteTask = async (taskId) => {
    await tasksApi.remove(taskId);
    refresh();
  };

  const updateTaskField = async (taskId, field, value) => {
    await tasksApi.update(taskId, { [field]: value });
    refresh();
  };

  // Drag and drop
  const onDragStart = (i) => setDragIndex(i);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = async (i) => {
    if (dragIndex === null || dragIndex === i) return;
    const next = [...tasks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    setTasks(next);
    setDragIndex(null);
    await tasksApi.reorder(next.map((t, idx) => ({ id: t.id, orden: idx })));
  };

  const pendingCount = tasks.filter((t) => t.estado === "pendiente").length;
  const doneCount = tasks.filter((t) => t.estado === "visto").length;

  if (!patient) {
    return <Layout><div className="text-psi-soft" data-testid="patient-loading">Cargando paciente...</div></Layout>;
  }

  return (
    <Layout>
      <button onClick={() => navigate("/patients")} className="btn-ghost mb-4" data-testid="back-btn">
        <ArrowLeft size={16} /> Pacientes
      </button>

      <div className="card-soft p-7 mb-6 fade-up" data-testid="patient-header">
        <div className="flex items-start gap-5">
          <Avatar name={patient.nombre} color={patient.color} size={80} />
          <div className="flex-1">
            <h1 className="font-display text-4xl mb-1" style={{ color: "var(--psi-text)" }} data-testid="patient-name">{patient.nombre}</h1>
            <div className="flex items-center gap-3 flex-wrap text-sm text-psi-soft">
              {patient.edad && <span>{patient.edad} años</span>}
              <span>·</span>
              <span className="capitalize">{patient.modalidad}</span>
              <span>·</span>
              <span className={`badge ${patient.estado === "activo" ? "badge-success" : patient.estado === "pausa" ? "badge-pending" : "badge-info"} capitalize`}>{patient.estado}</span>
              <span>·</span>
              <span>Desde {formatDate(patient.fecha_inicio)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="btn-secondary" data-testid="edit-patient-btn"><Edit3 size={14} /> Editar</button>
            <button onClick={handleDeletePatient} className="btn-ghost" style={{ color: "var(--psi-alert)" }} data-testid="delete-patient-btn"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>

      <div className="tab-list mb-6 fade-up-delay-1" style={{ maxWidth: 500 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`tab-item ${tab === t.key ? "active" : ""}`} data-testid={`tab-${t.key}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="fade-up-delay-2">
        {tab === "datos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card-soft p-6">
              <h3 className="font-display text-2xl mb-4">Contacto</h3>
              <DetailRow label="Teléfono" value={patient.telefono} />
              <DetailRow label="Email" value={patient.email} />
              <DetailRow label="Dirección" value={patient.direccion} />
              <DetailRow label="Contacto de emergencia" value={patient.contacto_emergencia} />
            </div>
            <div className="card-soft p-6">
              <h3 className="font-display text-2xl mb-4">Datos generales</h3>
              <DetailRow label="Fecha de nacimiento" value={patient.fecha_nacimiento} />
              <DetailRow label="Inicio de tratamiento" value={formatDate(patient.fecha_inicio)} />
              <DetailRow label="Modalidad" value={patient.modalidad} />
              <DetailRow label="Sesiones totales" value={sessions.length} />
            </div>
            {patient.notas_generales && (
              <div className="card-soft p-6 md:col-span-2">
                <h3 className="font-display text-2xl mb-4">Notas generales</h3>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-psi">{patient.notas_generales}</p>
              </div>
            )}
          </div>
        )}

        {tab === "motivo" && (
          <div className="card-soft p-7" data-testid="motivo-content">
            <h3 className="font-display text-2xl mb-4">Motivo de consulta</h3>
            <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: "var(--psi-text)" }}>
              {patient.motivo_consulta || "Sin motivo de consulta registrado. Click en 'Editar' para agregarlo."}
            </p>
          </div>
        )}

        {tab === "plan" && (
          <div className="card-soft p-7" data-testid="plan-content">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-2xl">Plan de intervención</h3>
              <div className="flex gap-2 text-sm">
                <span className="badge badge-pending">{pendingCount} pendientes</span>
                <span className="badge badge-success">{doneCount} vistos</span>
              </div>
            </div>
            <p className="text-psi-soft text-sm mb-5">Objetivos terapéuticos. Marca cuando los hayas trabajado con el paciente.</p>

            <div className="space-y-2 mb-4">
              {tasks.map((t, i) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(i)}
                  className="flex items-start gap-3 p-4 rounded-2xl group transition-all"
                  style={{
                    background: t.estado === "visto" ? "rgba(168, 213, 162, 0.12)" : "rgba(255,255,255,0.6)",
                    border: `1px solid ${t.estado === "visto" ? "rgba(168, 213, 162, 0.3)" : "rgba(232, 160, 191, 0.18)"}`,
                  }}
                  data-testid={`task-${i}`}
                >
                  <GripVertical size={16} className="text-psi-soft opacity-30 group-hover:opacity-100 cursor-grab mt-1" />
                  <input type="checkbox" checked={t.estado === "visto"} onChange={() => toggleTask(t)} className="psi-checkbox mt-0.5" data-testid={`task-check-${i}`} />
                  <div className="flex-1 min-w-0">
                    <input
                      value={t.titulo}
                      onChange={(e) => setTasks(tasks.map(x => x.id === t.id ? { ...x, titulo: e.target.value } : x))}
                      onBlur={(e) => updateTaskField(t.id, "titulo", e.target.value)}
                      className="bg-transparent w-full font-medium outline-none"
                      style={{ color: "var(--psi-text)", textDecoration: t.estado === "visto" ? "line-through" : "none", opacity: t.estado === "visto" ? 0.6 : 1 }}
                    />
                    <textarea
                      value={t.notas || ""}
                      onChange={(e) => setTasks(tasks.map(x => x.id === t.id ? { ...x, notas: e.target.value } : x))}
                      onBlur={(e) => updateTaskField(t.id, "notas", e.target.value)}
                      placeholder="Notas, observaciones..."
                      rows={t.notas ? 2 : 1}
                      className="bg-transparent w-full text-sm text-psi-soft outline-none resize-none mt-1"
                    />
                  </div>
                  <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 btn-ghost p-1" data-testid={`task-delete-${i}`}>
                    <Trash2 size={14} style={{ color: "var(--psi-alert)" }} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Nuevo objetivo terapéutico..."
                className="input-field flex-1"
                data-testid="new-task-input"
              />
              <button onClick={addTask} className="btn-primary" data-testid="add-task-btn"><Plus size={14} /> Agregar</button>
            </div>
            {tasks.length === 0 && (
              <p className="text-center text-psi-soft text-sm mt-6">Sin objetivos aún. Agrega el primero ☝️</p>
            )}
          </div>
        )}

        {tab === "historial" && (
          <div className="card-soft p-7" data-testid="historial-content">
            <h3 className="font-display text-2xl mb-5">Historial de sesiones</h3>
            <div className="space-y-3">
              {sessions.length === 0 && <p className="text-psi-soft text-sm text-center py-8">Sin sesiones registradas.</p>}
              {sessions.map((s, i) => (
                <div key={s.id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(232, 160, 191, 0.15)" }} data-testid={`session-row-${i}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.estado === "completada" ? "rgba(168, 213, 162, 0.25)" : "rgba(232, 160, 191, 0.2)" }}>
                        {s.estado === "completada" ? <CheckCircle2 size={18} style={{ color: "#5a8a55" }} /> : <CalendarClock size={18} style={{ color: "var(--psi-rosa-deep)" }} />}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "var(--psi-text)" }}>{formatDateTime(s.fecha)}</p>
                        <p className="text-xs text-psi-soft">{s.duracion} min · {s.tipo} · <span className="capitalize">{s.estado}</span></p>
                      </div>
                    </div>
                    <button onClick={() => setEditingSession(s)} className="btn-ghost text-xs" data-testid={`session-edit-${i}`}>Notas</button>
                  </div>
                  {s.notas_sesion && (
                    <p className="text-sm mt-3 pl-14 text-psi-soft whitespace-pre-wrap">{s.notas_sesion.slice(0, 200)}{s.notas_sesion.length > 200 ? "..." : ""}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editing && <PatientForm patient={patient} onClose={() => setEditing(false)} onSave={handleUpdate} />}

      {editingSession && (
        <SessionNotesModal
          session={editingSession}
          tasks={tasks}
          onClose={() => setEditingSession(null)}
          onSave={async (payload) => {
            await sessionsApi.update(editingSession.id, payload);
            toast.push("Sesión guardada 🌸", "success");
            setEditingSession(null);
            refresh();
          }}
        />
      )}
    </Layout>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between py-2.5 text-sm border-b last:border-0" style={{ borderColor: "rgba(232, 160, 191, 0.15)" }}>
    <span className="text-psi-soft">{label}</span>
    <span className="font-medium text-psi text-right">{value || "—"}</span>
  </div>
);

const moodEmojis = [
  { v: 1, e: "😢", label: "Muy bajo" },
  { v: 2, e: "😟", label: "Bajo" },
  { v: 3, e: "😐", label: "Neutro" },
  { v: 4, e: "🙂", label: "Bien" },
  { v: 5, e: "😊", label: "Excelente" },
];

const SessionNotesModal = ({ session, tasks, onClose, onSave }) => {
  const [form, setForm] = useState({
    estado: session.estado,
    notas_sesion: session.notas_sesion || "",
    estado_animo: session.estado_animo || null,
    proxima_sesion: session.proxima_sesion || "",
    tareas_vistas: session.tareas_vistas || [],
  });

  const toggleTask = (taskId) => {
    setForm((f) => ({
      ...f,
      tareas_vistas: f.tareas_vistas.includes(taskId)
        ? f.tareas_vistas.filter((x) => x !== taskId)
        : [...f.tareas_vistas, taskId],
    }));
  };

  return (
    <Modal open={true} onClose={onClose} title="Notas de sesión" testid="session-notes-modal">
      <p className="text-psi-soft text-sm mb-4">{formatDateTime(session.fecha)} · {session.duracion} min</p>

      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-5" data-testid="session-notes-form">
        <div>
          <label className="text-sm font-medium block mb-2">Estado</label>
          <div className="flex gap-2">
            {["programada", "completada", "cancelada"].map((e) => (
              <button type="button" key={e} onClick={() => setForm({ ...form, estado: e })} className={`btn-secondary capitalize ${form.estado === e ? "" : "opacity-60"}`} style={{ background: form.estado === e ? "linear-gradient(135deg, #E8A0BF, #D88AAB)" : undefined, color: form.estado === e ? "white" : undefined }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Estado de ánimo del paciente</label>
          <div className="flex gap-2">
            {moodEmojis.map((m) => (
              <button
                type="button"
                key={m.v}
                onClick={() => setForm({ ...form, estado_animo: m.v })}
                className="flex-1 py-3 rounded-xl transition-all text-2xl"
                style={{
                  background: form.estado_animo === m.v ? "linear-gradient(135deg, rgba(232, 160, 191, 0.3), rgba(249, 212, 212, 0.3))" : "rgba(255,255,255,0.5)",
                  border: form.estado_animo === m.v ? "2px solid var(--psi-rosa-medio)" : "1px solid rgba(232, 160, 191, 0.15)",
                  transform: form.estado_animo === m.v ? "scale(1.08)" : "scale(1)",
                }}
                title={m.label}
                data-testid={`mood-${m.v}`}
              >
                {m.e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Notas de sesión</label>
          <textarea value={form.notas_sesion} onChange={(e) => setForm({ ...form, notas_sesion: e.target.value })} className="input-field" rows="6" placeholder="Observaciones, avances, temas trabajados..." data-testid="notes-textarea" />
        </div>

        {tasks.length > 0 && (
          <div>
            <label className="text-sm font-medium block mb-2 flex items-center gap-2"><Sparkles size={14} className="text-rosa-deep" /> Temas del plan vistos esta sesión</label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto p-2 rounded-xl" style={{ background: "rgba(253, 232, 240, 0.4)" }}>
              {tasks.map((t) => (
                <label key={t.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/60">
                  <input type="checkbox" checked={form.tareas_vistas.includes(t.id)} onChange={() => toggleTask(t.id)} className="psi-checkbox" style={{ width: 18, height: 18 }} />
                  <span className="text-sm">{t.titulo}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium block mb-2">Para la próxima sesión</label>
          <textarea value={form.proxima_sesion} onChange={(e) => setForm({ ...form, proxima_sesion: e.target.value })} className="input-field" rows="2" placeholder="Recordatorios, temas a continuar..." />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button type="submit" className="btn-primary flex-1 justify-center" data-testid="save-notes-btn">Guardar</button>
        </div>
      </form>
    </Modal>
  );
};

export default PatientProfile;
