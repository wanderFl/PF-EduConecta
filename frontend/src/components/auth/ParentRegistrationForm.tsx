import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ParentRegistration } from '../../types';
import './LoginForm.css'; // Reusing login form styles

const ParentRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<ParentRegistration>({
    full_name: '',
    email: '',
    cedula: '',
    home_address: '',
    work_place: '',
    security_pin: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await register(formData);
      navigate('/dashboard/familia');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Error en el registro');
      } else {
        setError('Error en el registro');
      }
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Registro de Familia</h2>
        
        <div className="form-group">
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Nombre completo"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Correo electrónico"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            name="cedula"
            value={formData.cedula}
            onChange={handleChange}
            placeholder="Cédula"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            name="home_address"
            value={formData.home_address}
            onChange={handleChange}
            placeholder="Dirección de residencia (opcional)"
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            name="work_place"
            value={formData.work_place}
            onChange={handleChange}
            placeholder="Lugar de trabajo (opcional)"
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="security_pin"
            value={formData.security_pin}
            onChange={handleChange}
            placeholder="PIN de seguridad"
            required
            maxLength={4}
            pattern="[0-9]{4}"
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Contraseña"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirmar contraseña"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="login-button">
          Registrarse
        </button>
      </form>
    </div>
  );
};

export default ParentRegistrationForm;