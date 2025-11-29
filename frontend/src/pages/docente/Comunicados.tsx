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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        borderRadius: '15px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#667eea',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            marginRight: '1rem'
          }}>
            💬
          </div>
          <div>
            <h1 style={{ margin: '0', color: '#333', fontSize: '1.8rem' }}>
              Comunicados
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
              Comunicación con padres de familia
              {courseId && (
                <span style={{ marginLeft: '0.5rem', color: '#667eea', fontWeight: 600 }}>
                  • {courseName}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/docente')}
          style={{
            padding: '0.5rem 1rem',
            border: '2px solid #667eea',
            borderRadius: '8px',
            backgroundColor: '#667eea',
            color: 'white',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ← Volver
        </button>
      </div>

      {/* Búsqueda o mensaje de advertencia */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem',
        marginBottom: '2rem',
        borderRadius: '15px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        {hasExternalId ? (
          // Si tiene external_id, mostrar búsqueda normal
          <>
            <h3 style={{ marginTop: '0', color: '#333' }}>Buscar Estudiante</h3>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por nombre o cédula del estudiante..."
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            
            {searching && (
              <div style={{ marginTop: '1rem', color: '#666' }}>Buscando...</div>
            )}

            {searchResults.length > 0 && (
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '1rem 0 0 0',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {searchResults.map((student) => (
                  <li
                    key={student.student_external_id}
                    onClick={() => handleCreateConversation(student)}
                    style={{
                      padding: '0.75rem',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f4ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <strong>{student.student_name}</strong>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {student.curso} - Paralelo {student.paralelo} | Cédula: {student.cedula}
                      {!student.parent_id && (
                        <span style={{ 
                          marginLeft: '0.5rem',
                          color: '#f59e0b',
                          fontStyle: 'italic'
                        }}>
                          (Sin padre vinculado)
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          // Si NO tiene external_id, mostrar mensaje informativo
          <div style={{
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>⚠️</div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#d97706' }}>Cuenta no vinculada</h3>
            <p style={{ margin: '0', color: '#666', lineHeight: '1.6' }}>
              Tu cuenta no está vinculada con un docente en el sistema del colegio.
              <br />
              Para poder usar el sistema de mensajería y buscar estudiantes,
              <br />
              contacta al administrador para que vincule tu cuenta.
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
      </div>

      {/* Layout de dos columnas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '350px 1fr',
        gap: '1rem',
        height: 'calc(100vh - 350px)',
        minHeight: '500px'
      }}>
        {/* Lista de conversaciones */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '2px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ margin: 0 }}>Conversaciones</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                Cargando...
              </div>
            ) : (
              <TeacherConversationList
                items={conversations}
                selectedId={selectedConv?.id || null}
                onSelect={setSelectedConv}
              />
            )}
          </div>
        </div>

        {/* Panel de conversación */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <TeacherConversationPanel 
            conversation={selectedConv} 
            currentUserId={user?.id || ''}
          />
        </div>
      </div>
    </div>
  );
};

export default Comunicados;