import React from 'react';
import { useNavigate } from 'react-router-dom';
import AgendaEscolar from '../../components/AgendaEscolar';
import '../familia.css';

const AgendaPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/docente/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f8fb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#1e4db7',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: '#fff',
            color: '#1e4db7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '1.2rem'
          }}>
            📅
          </div>
          <div>
            <div style={{
              fontWeight: '600',
              fontSize: '1.1rem',
              color: '#fff'
            }}>
              Agenda Escolar
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#d7e3ff',
              marginTop: '2px'
            }}>
              Dashboard de estadísticas y tareas
            </div>
          </div>
        </div>
        
        <button
          onClick={handleGoBack}
          style={{
            background: '#fff',
            color: '#1e4db7',
            border: '1px solid #d7e3ff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4ff'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
        >
          ← Volver al Dashboard
        </button>
      </div>

      <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        <AgendaEscolar className="agenda-page-content" />
      </div>
    </div>
  );
};

export default AgendaPage;