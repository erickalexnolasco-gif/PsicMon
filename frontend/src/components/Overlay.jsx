import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ open, onClose, title, children, testid = "modal" }) => {
  useEffect(() => {
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose} data-testid={`${testid}-overlay`}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid={testid}>
        <div className="traffic-lights">
          <span /><span /><span />
        </div>
        <div className="px-8 pb-2 flex items-center justify-between">
          <h2 className="font-display text-3xl" style={{ color: "var(--psi-text)" }}>{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2" data-testid={`${testid}-close`}>
            <X size={18} />
          </button>
        </div>
        <div className="px-8 pb-8 pt-2">{children}</div>
      </div>
    </div>
  );
};

export const Drawer = ({ open, onClose, title, children, testid = "drawer" }) => {
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} data-testid={`${testid}-overlay`} />
      <aside className="drawer-content fade-up" data-testid={testid}>
        <div className="traffic-lights"><span /><span /><span /></div>
        <div className="px-7 pb-3 flex items-center justify-between">
          <h2 className="font-display text-3xl" style={{ color: "var(--psi-text)" }}>{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2" data-testid={`${testid}-close`}>
            <X size={18} />
          </button>
        </div>
        <div className="px-7 pb-8 pt-2">{children}</div>
      </aside>
    </>
  );
};
