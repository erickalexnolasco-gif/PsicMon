import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { authApi } from "../lib/api";
import { useToast } from "../components/Toast";

const Settings = () => {
  const { psicologa, updatePsicologa } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(psicologa);

  useEffect(() => { setForm(psicologa); }, [psicologa]);

  if (!form) return <Layout><div /></Layout>;

  const handleSave = async (e) => {
    e.preventDefault();
    const updated = await authApi.updateMe(form.id, form);
    updatePsicologa(updated);
    toast.push("Ajustes guardados 🌸", "success");
  };

  return (
    <Layout>
      <div className="mb-8 fade-up">
        <h1 className="font-display text-5xl" style={{ color: "var(--psi-text)" }} data-testid="settings-title">Ajustes</h1>
        <p className="text-psi-soft mt-1">Configura tu perfil y preferencias</p>
      </div>

      <form onSubmit={handleSave} className="max-w-3xl space-y-6 fade-up-delay-1" data-testid="settings-form">
        <div className="card-soft p-7">
          <h3 className="font-display text-2xl mb-5">Perfil</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Nombre completo</label>
              <input value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" data-testid="set-nombre" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Email</label>
              <input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Cédula profesional</label>
              <input value={form.cedula || ""} onChange={(e) => setForm({ ...form, cedula: e.target.value })} className="input-field" data-testid="set-cedula" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Duración por defecto (min)</label>
              <input type="number" value={form.duracion_default || 50} onChange={(e) => setForm({ ...form, duracion_default: parseInt(e.target.value) })} className="input-field" />
            </div>
          </div>
        </div>

        <div className="card-soft p-7">
          <h3 className="font-display text-2xl mb-5">Horario de atención</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Desde</label>
              <input type="time" value={form.horario_inicio || "09:00"} onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Hasta</label>
              <input type="time" value={form.horario_fin || "19:00"} onChange={(e) => setForm({ ...form, horario_fin: e.target.value })} className="input-field" />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" data-testid="save-settings">Guardar cambios</button>
      </form>
    </Layout>
  );
};

export default Settings;
