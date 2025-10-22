import React, { useState } from 'react';
import { requestPasswordReset } from '../../services/auth';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    try {
      const res = await requestPasswordReset(email.trim().toLowerCase());
      setMsg(res.message + (res.dev_token ? ` (DEV token: ${res.dev_token})` : ''));
    } catch  {
      setErr('No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={submit} className="login-form">
        <h2>Recuperar contraseña</h2>
        <div className="form-group">
          <input
            type="email"
            placeholder="Tu correo"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
        </div>
        {msg && <div className="success-message">{msg}</div>}
        {err && <div className="error-message">{err}</div>}
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar instrucciones'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
