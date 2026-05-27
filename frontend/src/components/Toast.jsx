import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "info") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const bg = (type) => {
    if (type === "success") return "linear-gradient(135deg, #A8D5A2, #8fc78a)";
    if (type === "error") return "linear-gradient(135deg, #EF9A9A, #d97c7c)";
    return "linear-gradient(135deg, #E8A0BF, #D88AAB)";
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, display: "flex", flexDirection: "column", gap: 10 }} data-testid="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="fade-up"
            data-testid={`toast-${t.type}`}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              background: bg(t.type),
              boxShadow: "0 10px 30px rgba(150, 80, 100, 0.25)",
              backdropFilter: "blur(20px)",
              maxWidth: 360,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
};
