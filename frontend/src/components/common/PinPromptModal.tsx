// src/components/common/PinPromptModal.tsx
import React, { useState } from "react";
import { verifyParentPin } from "../../services/familia";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
};

const PinPromptModal: React.FC<Props> = ({ open, onClose, onSuccess, title }) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const ok = await verifyParentPin(pin);
      if (!ok) { setErr("PIN incorrecto"); return; }
      // ⚠️ No guardamos nada en storage para forzar pedir PIN siempre
      onSuccess();
    } catch {
      setErr("No se pudo verificar el PIN");
    } finally {
      setLoading(false);
    }
  };

  const close = () => { setPin(""); setErr(null); onClose(); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 6); // ← hasta 6
    setPin(onlyDigits);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card pin-modal">
        <div className="modal-header">
          <div className="sic-title">{title ?? "Validación PIN Parental"}</div>
          <button className="ts-close" onClick={close} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={submit} className="modal-body">
          <label className="ts-label" htmlFor="pin">PIN parental</label>
          <div className="pin-field">
            <input
              id="pin"
              className="pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{4,6}"          // ← 4 a 6 dígitos
              maxLength={6}              // ← hasta 6
              placeholder="••••••"
              value={pin}
              onChange={handleChange}
              required
              autoFocus
              aria-label="PIN parental de 4 a 6 dígitos"
            />
          </div>

          {err && <div className="error-message" role="alert">{err}</div>}

          <div className="ts-modal-footer" style={{ marginTop: 12 }}>
            <button type="button" className="ts-btn light" onClick={close}>Cancelar</button>
            <button
              type="submit"
              className="ts-btn primary"
              disabled={loading || pin.length < 4 || pin.length > 6}  // ← habilita 4–6
            >
              {loading ? "Validando..." : "Continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinPromptModal;
