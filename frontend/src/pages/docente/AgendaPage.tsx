import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AgendaEscolar from '../../components/AgendaEscolar';
import './AgendaPage.css';

const AgendaPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleGoBack = () => {
    navigate('/docente/dashboard');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-left">
          <button onClick={handleGoBack} className="back-button">
            <i className="fas fa-arrow-left"></i>
            Volver al Dashboard
          </button>
        </div>
        <div className="header-right">
          <button onClick={logout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i>
            Cerrar sesión
          </button>
        </div>
      </div>
      
      <AgendaEscolar className="agenda-page-content" />
    </div>
  );
};

export default AgendaPage;