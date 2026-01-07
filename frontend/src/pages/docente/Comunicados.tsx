import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { 
  listTeacherConversations, 
  createTeacherConversation,
  searchTeacherStudents,
  type TeacherConversation,
  type StudentSearchResult
} from "../../services/communications";
import TeacherConversationList from "../../components/comm/TeacherConversationList";
import TeacherConversationPanel from "../../components/comm/TeacherConversationPanel";
import "../familia.css";

const Comunicados: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, initialized } = useAuth();
  const [conversations, setConversations] = useState<TeacherConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<TeacherConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasExternalId, setHasExternalId] = useState(true); // Track if teacher is linked

  // Búsqueda de estudiantes
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Obtener el curso seleccionado del localStorage
  const selectedCourseData = localStorage.getItem('selectedCourseData');
  const courseId = selectedCourseData ? JSON.parse(selectedCourseData).id_curso : null;
  const courseName = selectedCourseData ? JSON.parse(selectedCourseData).nombre : 'Todos los cursos';

  // Cargar conversaciones al iniciar (solo cuando auth esté inicializado)
  useEffect(() => {
    if (initialized && token) {
      loadConversations();
    } else if (initialized && !token) {
      navigate('/login');
    }
  }, [initialized, token, navigate]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await listTeacherConversations();
      // El backend puede devolver un objeto con { conversations, warning } o un array
      if (Array.isArray(response)) {
        setConversations(response);
        setHasExternalId(true);
      } else {
        setConversations(response.conversations || []);
        setHasExternalId(!response.warning); // Si hay warning, no tiene external_id
        // Mostrar advertencia si existe
        if (response.warning) {
          console.warn('⚠️', response.warning);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Si es error 403, la cuenta no está vinculada
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 403) {
        setHasExternalId(false);
      }
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda con debounce
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const results = await searchTeacherStudents(query.trim(), courseId);
        setSearchResults(results);
      } catch (error) {
        // Si es error 403, limpiar resultados silenciosamente (cuenta no vinculada)
        const axiosError = error as { response?: { status?: number } };
        if (axiosError?.response?.status === 403) {
          setSearchResults([]);
        } else {
          // Solo mostrar errores que no sean de validación
          console.error('Error searching students:', error);
        }
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleCreateConversation = async (student: StudentSearchResult) => {
    try {
      // Verificar si ya existe conversación con ese estudiante
      const existing = conversations.find(
        c => c.student_external_id === student.student_external_id
      );

      if (existing) {
        setSelectedConv(existing);
        setQuery("");
        setSearchResults([]);
        return;
      }

      // Crear nueva conversación
      await createTeacherConversation({
        student_external_id: student.student_external_id,
        subject: `Comunicación con ${student.student_name}`
      });

      // Recargar conversaciones
      await loadConversations();
      
      // Limpiar búsqueda
      setQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Manejar errores de validación de external_id
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError?.response?.status === 403) {
        const message = axiosError.response.data?.message || 
          'Tu cuenta no está vinculada con el sistema. Contacta al administrador.';
        alert(message);
      } else {
        alert('Error al crear conversación. Por favor intenta nuevamente.');
      }
    }
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
            💬
          </div>
          <div>
            <div style={{
              fontWeight: '600',
              fontSize: '1.1rem',
              color: '#fff'
            }}>
              Comunicados
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#d7e3ff',
              marginTop: '2px'
            }}>
              {courseId ? courseName : 'Comunicación con padres de familia'}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/docente/dashboard')}
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

      <nav className="fam-breadcrumb" style={{ margin: "8px" }}>
        <span className="crumb-link" onClick={() => navigate('/docente')}>Inicio</span>
        <span className="crumb-sep">›</span>
        <span className="crumb-current">Comunicados</span>
      </nav>

      {/* Encabezado de la sección */}
      <section className="student-info-card" style={{ margin: "16px" }}>
        <div className="sic-title">Comunicados</div>
        <div className="muted">
          {hasExternalId 
            ? "Comunícate con los padres de familia de tus estudiantes." 
            : "Tu cuenta necesita vinculación para usar mensajería."}
        </div>
      </section>

      {/* Layout tipo WhatsApp */}
      <div className="comm-layout" style={{ margin: "0 16px 16px" }}>
        {/* LADO IZQUIERDO: búsqueda + lista */}
        <aside className="comm-sidebar">
          {hasExternalId ? (
            <>
              <div className="comms-search-wrap">
                <input
                  type="search"
                  className="conv-search"
                  placeholder="Buscar estudiante por nombre o cédula..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                {searching && (
                  <div className="empty">Buscando...</div>
                )}

                {query && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((student) => (
                      <button
                        key={student.student_external_id}
                        type="button"
                        className="search-result-item"
                        onClick={() => handleCreateConversation(student)}
                      >
                        <div className="sr-title">{student.student_name}</div>
                        <div className="muted">
                          {student.curso} - Paralelo {student.paralelo} | Cédula: {student.cedula}
                          {!student.parent_id && ' (Sin padre vinculado)'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {query && !searching && searchResults.length === 0 && (
                  <div className="empty">No se encontraron estudiantes.</div>
                )}
              </div>

              {/* Lista de conversaciones */}
              {loading ? (
                <div className="empty">Cargando...</div>
              ) : (
                <TeacherConversationList
                  items={conversations}
                  selectedId={selectedConv?.id || null}
                  onSelect={setSelectedConv}
                />
              )}
            </>
          ) : (
            // Mensaje de cuenta no vinculada
            <div style={{
              textAlign: 'center',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#d97706' }}>Cuenta no vinculada</h3>
              <p style={{ margin: '0', color: '#666', lineHeight: '1.6', fontSize: '0.9rem' }}>
                Tu cuenta no está vinculada con un docente en el sistema del colegio.
                <br />
                Contacta al administrador para que vincule tu cuenta.
              </p>
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#fef3c7',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#92400e'
              }}>
                <strong>Nota:</strong> Tu correo debe estar registrado en la base de datos del colegio.
              </div>
            </div>
          )}
        </aside>

        {/* LADO DERECHO: panel de conversación */}
        <section className="comm-main">
          <TeacherConversationPanel 
            conversation={selectedConv} 
            currentUserId={user?.id || ''}
          />
        </section>
      </div>
    </div>
  );
};

export default Comunicados;