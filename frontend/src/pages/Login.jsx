import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Sparkles, Mail, Lock, Heart } from "lucide-react";
import { useToast } from "../components/Toast";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("demo@psicare.com");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.push("Bienvenida 🌸", "success");
      navigate("/dashboard");
    } catch (err) {
      toast.push(err.response?.data?.detail || "No se pudo iniciar sesión", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md fade-up">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8A0BF, #D88AAB)", boxShadow: "0 8px 24px rgba(216, 138, 171, 0.4)" }}>
              <Sparkles className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-display text-3xl leading-none" style={{ color: "var(--psi-text)" }}>PsiCare</h1>
              <p className="text-xs tracking-widest uppercase text-psi-soft mt-1">tu consulta, en calma</p>
            </div>
          </div>

          <h2 className="font-display text-5xl mb-3" style={{ color: "var(--psi-text)" }}>Buenos días.</h2>
          <p className="text-psi-soft mb-10">Inicia sesión para continuar acompañando a tus pacientes.</p>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: "var(--psi-text)" }}>Correo</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-psi-soft" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="tu@correo.com"
                  data-testid="login-email"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: "var(--psi-text)" }}>Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-psi-soft" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="••••••••"
                  data-testid="login-password"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 text-psi-soft">
                <input type="checkbox" className="psi-checkbox" style={{ width: 16, height: 16 }} />
                Recordarme
              </label>
              <button type="button" className="text-rosa-deep hover:underline">¿Olvidaste tu contraseña?</button>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-6 py-3" data-testid="login-submit">
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>

            <div className="text-center text-xs text-psi-soft mt-4 p-3 rounded-xl" style={{ background: "rgba(232, 160, 191, 0.08)" }}>
              <strong>Demo:</strong> usa <code style={{ color: "var(--psi-rosa-deep)" }}>demo@psicare.com</code> con cualquier contraseña
            </div>
          </form>
        </div>
      </div>

      {/* Right decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FDE8F0 0%, #F9D4D4 100%)" }}>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, rgba(232, 160, 191, 0.5), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.6), transparent 50%)",
        }} />
        <div className="relative z-10 max-w-lg">
          <div className="animate-float mb-8">
            <div className="glass-deep p-8 rounded-3xl">
              <div className="traffic-lights" style={{ padding: 0, marginBottom: 16 }}>
                <span /><span /><span />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Heart size={20} className="text-rosa-deep" />
                <span className="font-medium text-psi">Próxima sesión</span>
              </div>
              <p className="font-display text-3xl mb-2" style={{ color: "var(--psi-text)" }}>Valentina Ruiz</p>
              <p className="text-psi-soft text-sm">Hoy · 16:00 · Presencial</p>
              <div className="mt-5 flex gap-2">
                <span className="badge badge-info">Ansiedad</span>
                <span className="badge badge-success">3 tareas vistas</span>
              </div>
            </div>
          </div>
          <h3 className="font-display text-4xl mb-3" style={{ color: "var(--psi-text)" }}>Cuidar, también es cuidarte.</h3>
          <p className="text-psi-soft text-lg leading-relaxed">Una herramienta hecha para psicólogas que valoran la presencia, los detalles y el espacio terapéutico.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
