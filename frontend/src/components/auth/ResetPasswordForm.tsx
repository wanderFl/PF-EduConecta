import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { performPasswordReset } from '../../services/auth';

const ResetPasswordForm: React.FC = () => {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const email = useMemo(()=> (sp.get('email') || ''), [sp]);
  const token = useMemo(()=> (sp.get('token') || ''), [sp]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    if (password !== confirmPassword) {
      setErr('Las contraseñas no coinciden'); setLoading(false); return;
    }
    try {
      const res = await performPasswordReset(token, password);
      setMsg(res.message);
      setTimeout(()=> navigate('/login', { replace: true }), 1200);
    } catch  {
      setErr('No se pudo resetear la contraseña (token inválido o expirado)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={submit} className="login-form">
        <h2>Restablecer contraseña</h2>
        <p style={{marginBottom: 8}}>Correo: <b>{email}</b></p>
        <div className="form-group">
          <div className="password-input">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />
            <button type="button" className="password-toggle" onClick={()=>setShowPwd(s=>!s)}>
              {showPwd ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e)=>setConfirm(e.target.value)}
            required
          />
        </div>
        {msg && <div className="success-message">{msg}</div>}
        {err && <div className="error-message">{err}</div>}
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
