import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Calendar from "@/pages/Calendar";
import Patients from "@/pages/Patients";
import PatientProfile from "@/pages/PatientProfile";
import Stats from "@/pages/Stats";
import Settings from "@/pages/Settings";

const ProtectedRoute = ({ children }) => {
  const { psicologa, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-psi-soft">Cargando 🌸</div>;
  if (!psicologa) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { psicologa, loading } = useAuth();
  if (loading) return null;
  if (psicologa) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
              <Route path="/patients/:id" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
