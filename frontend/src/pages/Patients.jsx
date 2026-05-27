import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Layout from "../components/Layout";
import { patientsApi } from "../lib/api";
import { Plus, Search } from "lucide-react";
import Avatar from "../components/Avatar";
import { Modal } from "../components/Overlay";
import { useToast } from "../components/Toast";

const colorOptions = ["#E8A0BF", "#F4C6A0", "#A8D5A2", "#C8A2E8", "#A2C8E8", "#E8C5A0", "#D5A8C5"];

const Patients = () => {
  const { psicologa } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [patients, setPatients] = useState([]);
  const [filter, setFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  const refresh = () => {
    if (!psicologa) return;
    patientsApi.list(psicologa.id).then(setPatients);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [psicologa]);

  const filtered = patients.filter((p) => {
    if (filter !== "todos" && p.estado !== filter) return false;
    if (query && !p.nombre.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async (data) => {
    try {
      await patientsApi.create(data, psicologa.id);
      toast.push("Paciente agregada 🌸", "success");
      setShowModal(false);
      refresh();
    } catch (e) {
      toast.push("Error al crear", "error");
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8 fade-up">
        <div>
          <h1 className="font-display text-5xl" style={{ color: "var(--psi-text)" }} data-testid="patients-title">Pacientes</h1>
          <p className="text-psi-soft mt-1">{patients.length} en total, {patients.filter(p => p.estado === "activo").length} activos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" data-testid="add-patient-btn">
          <Plus size={16} /> Agregar paciente
        </button>
      </div>

      <div className="card-soft p-5 mb-6 fade-up-delay-1 flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-psi-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="input-field pl-11"
            data-testid="patient-search"
          />
        </div>
        <div className="tab-list">
          {["todos", "activo", "pausa", "alta"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`tab-item capitalize ${filter === f ? "active" : ""}`} data-testid={`filter-${f}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p, i) => (
          <div
            key={p.id}
            className="card-soft p-6 cursor-pointer fade-up"
            style={{ animationDelay: `${i * 30}ms` }}
            onClick={() => navigate(`/patients/${p.id}`)}
            data-testid={`patient-card-${i}`}
          >
            <div className="flex items-start gap-4 mb-4">
              <Avatar name={p.nombre} color={p.color} size={56} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-lg leading-tight" style={{ color: "var(--psi-text)" }}>{p.nombre}</p>
                <p className="text-xs text-psi-soft mt-1">{p.edad ? `${p.edad} años · ` : ""}{p.modalidad}</p>
              </div>
              <span className={`badge ${p.estado === "activo" ? "badge-success" : p.estado === "pausa" ? "badge-pending" : "badge-info"} capitalize`}>{p.estado}</span>
            </div>
            <p className="text-sm text-psi-soft line-clamp-2 min-h-[2.5rem]">{p.motivo_consulta || "Sin motivo de consulta registrado."}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center" data-testid="empty-patients">
            <p className="font-display text-3xl mb-2" style={{ color: "var(--psi-text)" }}>Sin pacientes aún 🌷</p>
            <p className="text-psi-soft text-sm mb-6">Agrega tu primer paciente para comenzar.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto"><Plus size={16} /> Nuevo paciente</button>
          </div>
        )}
      </div>

      {showModal && <PatientForm onClose={() => setShowModal(false)} onSave={handleCreate} />}
    </Layout>
  );
};

const PatientForm = ({ patient, onClose, onSave }) => {
  const isEdit = !!patient;
  const [form, setForm] = useState({
    nombre: patient?.nombre || "",
    edad: patient?.edad || "",
    telefono: patient?.telefono || "",
    email: patient?.email || "",
    modalidad: patient?.modalidad || "presencial",
    motivo_consulta: patient?.motivo_consulta || "",
    estado: patient?.estado || "activo",
    color: patient?.color || colorOptions[0],
    fecha_nacimiento: patient?.fecha_nacimiento || "",
    direccion: patient?.direccion || "",
    contacto_emergencia: patient?.contacto_emergencia || "",
    notas_generales: patient?.notas_generales || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.edad === "") payload.edad = null;
    else payload.edad = parseInt(payload.edad);
    onSave(payload);
  };

  return (
    <Modal open={true} onClose={onClose} title={isEdit ? "Editar paciente" : "Nuevo paciente"} testid="patient-modal">
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="patient-form">
        <div>
          <label className="text-sm font-medium block mb-1.5">Nombre completo</label>
          <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" data-testid="patient-nombre" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">Edad</label>
            <input type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} className="input-field" data-testid="patient-edad" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Teléfono</label>
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="input-field" data-testid="patient-telefono" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">Modalidad</label>
            <select value={form.modalidad} onChange={(e) => setForm({ ...form, modalidad: e.target.value })} className="input-field">
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="mixta">Mixta</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Estado</label>
            <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="input-field">
              <option value="activo">Activo</option>
              <option value="pausa">En pausa</option>
              <option value="alta">Dado de alta</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Color identificador</label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                className="w-9 h-9 rounded-full transition-all"
                style={{
                  background: c,
                  border: form.color === c ? "3px solid white" : "3px solid transparent",
                  boxShadow: form.color === c ? `0 0 0 2px ${c}` : "0 2px 6px rgba(0,0,0,0.08)",
                  transform: form.color === c ? "scale(1.1)" : "scale(1)",
                }}
                aria-label={c}
                data-testid={`color-${c}`}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Motivo de consulta</label>
          <textarea value={form.motivo_consulta} onChange={(e) => setForm({ ...form, motivo_consulta: e.target.value })} className="input-field" rows="3" data-testid="patient-motivo" />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button type="submit" className="btn-primary flex-1 justify-center" data-testid="patient-save">{isEdit ? "Guardar" : "Crear paciente"}</button>
        </div>
      </form>
    </Modal>
  );
};

export { PatientForm };
export default Patients;
