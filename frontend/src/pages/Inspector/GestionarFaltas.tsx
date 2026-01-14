import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { studentsService, type Course } from "../../services/students";

interface PendingJustification {
  id: string;
  student_external_id: number;
  student_name: string;
  date: string;
  justification_reason: string | null;
  justification_file_reference: string | null;
  course_external_id: number;
}

const GestionarFaltas: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [justifications, setJustifications] = useState<PendingJustification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [currentAction, setCurrentAction] = useState<{ id: string; action: "accept" | "reject" } | null>(null);
  const [inspectorComment, setInspectorComment] = useState<string>("");

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const coursesData = await studentsService.getAllCourses();
      setCourses(coursesData);
    } catch (err) {
      setError("Error al cargar los cursos");
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJustifications = useCallback(async (courseId?: string) => {
    try {
      setLoading(true);
      setError("");
      
      const url = courseId 
        ? `/attendance/pending-justifications?courseId=${courseId}`
        : "/attendance/pending-justifications";

      const response = await api.get(url);

      if (response.data.success) {
        setJustifications(response.data.data);
      } else {
        setError("Error al cargar justificaciones");
      }
    } catch (err: unknown) {
      console.error("Error loading justifications:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Error al cargar justificaciones pendientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
    loadJustifications();
  }, [loadCourses, loadJustifications]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    if (courseId) {
      loadJustifications(courseId);
    } else {
      loadJustifications();
    }
  };

  const handleDownloadFile = async (fileReference: string) => {
    try {
      // Usar el endpoint de descarga de archivos de tarea (similar al de entregas)
      const response = await api.get(
        `/uploads/task-download-url?fileRef=${encodeURIComponent(fileReference)}`
      );

      if (response.data.url) {
        // Abrir URL firmada en nueva pestaña
        window.open(response.data.url, "_blank");
      } else {
        setError("No se pudo generar la URL de descarga");
      }
    } catch (err: unknown) {
      console.error("Error downloading file:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Error al descargar el archivo");
    }
  };

  const openCommentModal = (id: string, action: "accept" | "reject") => {
    setCurrentAction({ id, action });
    setInspectorComment("");
    setShowCommentModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!currentAction) return;

    try {
      setProcessingId(currentAction.id);
      setError("");
      setSuccess("");

      const response = await api.put(
        `/attendance/${currentAction.id}/justify-status`,
        { 
          action: currentAction.action,
          inspectorComment: inspectorComment.trim() || null
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        // Recargar justificaciones
        if (selectedCourse) {
          loadJustifications(selectedCourse);
        } else {
          loadJustifications();
        }
        
        // Cerrar modal y limpiar
        setShowCommentModal(false);
        setCurrentAction(null);
        setInspectorComment("");
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Error al actualizar estado de justificación");
      }
    } catch (err: unknown) {
      console.error("Error updating status:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Error al actualizar estado");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getCourseName = (courseId: number) => {
    const course = courses.find((c) => c.id_curso === courseId);
    return course ? course.nombre : `Curso ${courseId}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f8fb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header estilo familia */}
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
            📋
          </div>
          <div>
            <div style={{
              fontWeight: '600',
              fontSize: '1.1rem',
              color: '#fff'
            }}>
              Gestionar Faltas
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#d7e3ff',
              marginTop: '2px'
            }}>
              Revisar y aprobar justificaciones de ausencias
            </div>
          </div>
        </div>
        
        <button
          onClick={() => navigate("/inspector/dashboard")}
          style={{
            background: '#fff',
            color: '#1e4db7',
            border: '1px solid #d7e3ff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f7ff';
            e.currentTarget.style.borderColor = '#1e4db7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#d7e3ff';
          }}
        >
          ← Volver al Dashboard
        </button>
      </div>

      {/* Contenedor principal */}
      <div style={{
        flex: 1,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '24px'
      }}>

        {/* Selector de curso */}
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '20px'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontWeight: '600',
            color: '#111827',
            fontSize: '1rem'
          }}>
            Filtrar por Curso:
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => handleCourseChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d7e3ff',
              borderRadius: '8px',
              fontSize: '0.95rem',
              background: 'white',
              color: '#111827',
              cursor: 'pointer'
            }}
            disabled={loading}
          >
            <option value="">Todos los cursos</option>
            {courses.map((course) => (
              <option key={course.id_curso} value={course.id_curso}>
                {course.nombre} - Paralelo {course.paralelo} ({course.nivel})
              </option>
            ))}
          </select>
        </div>

        {/* Mensajes */}
        {error && (
          <div style={{
            background: '#fff',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.95rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#fff',
            border: '1px solid #10b981',
            color: '#10b981',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.95rem'
          }}>
            {success}
          </div>
        )}

        {/* Tabla de justificaciones */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #1e4db7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p style={{ color: '#6b7280', margin: 0 }}>Cargando justificaciones...</p>
            </div>
          ) : justifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              <p style={{ margin: 0 }}>No hay justificaciones pendientes</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>
                      Estudiante
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>
                      Curso
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>
                      Fecha
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>
                      Motivo
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>
                      Archivo
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {justifications.map((justification) => (
                    <tr
                      key={justification.id}
                      style={{ borderBottom: '1px solid #e5e7eb' }}
                    >
                      <td style={{ padding: '14px 16px', color: '#111827', fontSize: '0.9rem' }}>
                        {justification.student_name}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.9rem' }}>
                        {getCourseName(justification.course_external_id)}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.9rem' }}>
                        {formatDate(justification.date)}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.9rem' }}>
                        {justification.justification_reason || "(Sin motivo especificado)"}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {justification.justification_file_reference ? (
                          <button
                            onClick={() =>
                              handleDownloadFile(justification.justification_file_reference!)
                            }
                            style={{
                              background: '#1e4db7',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1a3d8f'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#1e4db7'}
                          >
                            📥 Descargar
                          </button>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Sin archivo</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => openCommentModal(justification.id, "accept")}
                            disabled={processingId === justification.id}
                            style={{
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: processingId === justification.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              opacity: processingId === justification.id ? 0.6 : 1,
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (processingId !== justification.id) e.currentTarget.style.background = '#059669';
                            }}
                            onMouseLeave={(e) => {
                              if (processingId !== justification.id) e.currentTarget.style.background = '#10b981';
                            }}
                          >
                            ✓ Aceptar
                          </button>
                          <button
                            onClick={() => openCommentModal(justification.id, "reject")}
                            disabled={processingId === justification.id}
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: processingId === justification.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              opacity: processingId === justification.id ? 0.6 : 1,
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (processingId !== justification.id) e.currentTarget.style.background = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                              if (processingId !== justification.id) e.currentTarget.style.background = '#ef4444';
                            }}
                          >
                            ✗ Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumen */}
        {justifications.length > 0 && (
          <div style={{
            marginTop: '16px',
            textAlign: 'right',
            color: '#6b7280',
            fontSize: '0.9rem'
          }}>
            Total de justificaciones pendientes: {justifications.length}
          </div>
        )}

        {/* Animación de spinner */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>

      {/* Comment Modal */}
      {showCommentModal && currentAction && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowCommentModal(false);
            setCurrentAction(null);
            setInspectorComment("");
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, color: "#2c3e50", marginBottom: "1rem" }}>
              {currentAction.action === "accept" ? "Aceptar" : "Rechazar"} Justificación
            </h3>
            <p style={{ color: "#7f8c8d", marginBottom: "1rem" }}>
              {currentAction.action === "accept"
                ? "¿Desea agregar algún comentario al aceptar esta justificación?"
                : "Por favor, agregue un comentario explicando el motivo del rechazo:"}
            </p>
            <textarea
              value={inspectorComment}
              onChange={(e) => setInspectorComment(e.target.value)}
              placeholder={currentAction.action === "reject" ? "Comentario (obligatorio)" : "Comentario (opcional)"}
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "0.875rem",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setCurrentAction(null);
                  setInspectorComment("");
                }}
                style={{
                  backgroundColor: "#95a5a6",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={currentAction.action === "reject" && !inspectorComment.trim()}
                style={{
                  backgroundColor: currentAction.action === "accept" ? "#27ae60" : "#e74c3c",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "4px",
                  cursor:
                    currentAction.action === "reject" && !inspectorComment.trim()
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "0.875rem",
                  opacity: currentAction.action === "reject" && !inspectorComment.trim() ? 0.5 : 1,
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionarFaltas;
