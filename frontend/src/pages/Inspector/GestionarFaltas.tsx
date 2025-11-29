import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { studentsService, type Course } from "../../services/students";
import { DashboardNavbar } from "../../components/layout/DashboardNavbar";
import "./inspector.css";

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

  const handleUpdateStatus = async (id: string, action: "accept" | "reject") => {
    try {
      setProcessingId(id);
      setError("");
      setSuccess("");

      const response = await api.put(
        `/attendance/${id}/justify-status`,
        { action }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        // Recargar justificaciones
        if (selectedCourse) {
          loadJustifications(selectedCourse);
        } else {
          loadJustifications();
        }
        
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
    <div className="inspector-container">
      <DashboardNavbar
        title="EduConecta"
        subtitle="Gestionar Faltas"
        icon="📋"
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="inspector-header">
          <div className="inspector-header-content">
            <button
              onClick={() => navigate("/inspector/dashboard")}
              className="inspector-back-btn"
            >
              ← Volver al Dashboard
            </button>
            <div className="inspector-title-section">
              <div className="inspector-icon">📋</div>
              <div>
                <h1 className="inspector-title">Gestionar Faltas</h1>
                <p className="inspector-subtitle">
                  Revisar y aprobar justificaciones de ausencias
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Selector */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "1.5rem",
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: "#2c3e50",
            }}
          >
            Filtrar por Curso:
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => handleCourseChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
            disabled={loading}
          >
            <option value="">Todos los cursos</option>
            {courses.map((course) => (
              <option key={course.id_curso} value={course.id_curso}>
                {course.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Messages */}
        {error && (
          <div
            style={{
              backgroundColor: "#fee",
              color: "#c33",
              padding: "1rem",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: "#efe",
              color: "#383",
              padding: "1rem",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {success}
          </div>
        )}

        {/* Justifications Table */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p>Cargando justificaciones...</p>
            </div>
          ) : justifications.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#7f8c8d" }}>
              <p>No hay justificaciones pendientes</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>
                      Estudiante
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>
                      Curso
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>
                      Fecha
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>
                      Motivo
                    </th>
                    <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600" }}>
                      Archivo
                    </th>
                    <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {justifications.map((justification) => (
                    <tr
                      key={justification.id}
                      style={{ borderBottom: "1px solid #dee2e6" }}
                    >
                      <td style={{ padding: "1rem" }}>
                        {justification.student_name}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {getCourseName(justification.course_external_id)}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {formatDate(justification.date)}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {justification.justification_reason || "(Sin motivo especificado)"}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        {justification.justification_file_reference ? (
                          <button
                            onClick={() =>
                              handleDownloadFile(justification.justification_file_reference!)
                            }
                            style={{
                              backgroundColor: "#3498db",
                              color: "#fff",
                              border: "none",
                              padding: "0.5rem 1rem",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                            }}
                          >
                            📥 Descargar
                          </button>
                        ) : (
                          <span style={{ color: "#999" }}>Sin archivo</span>
                        )}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <button
                            onClick={() => handleUpdateStatus(justification.id, "accept")}
                            disabled={processingId === justification.id}
                            style={{
                              backgroundColor: "#27ae60",
                              color: "#fff",
                              border: "none",
                              padding: "0.5rem 1rem",
                              borderRadius: "4px",
                              cursor: processingId === justification.id ? "not-allowed" : "pointer",
                              fontSize: "0.875rem",
                              opacity: processingId === justification.id ? 0.6 : 1,
                            }}
                          >
                            ✓ Aceptar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(justification.id, "reject")}
                            disabled={processingId === justification.id}
                            style={{
                              backgroundColor: "#e74c3c",
                              color: "#fff",
                              border: "none",
                              padding: "0.5rem 1rem",
                              borderRadius: "4px",
                              cursor: processingId === justification.id ? "not-allowed" : "pointer",
                              fontSize: "0.875rem",
                              opacity: processingId === justification.id ? 0.6 : 1,
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

        {/* Summary */}
        {justifications.length > 0 && (
          <div
            style={{
              marginTop: "1rem",
              textAlign: "right",
              color: "#7f8c8d",
              fontSize: "0.875rem",
            }}
          >
            Total de justificaciones pendientes: {justifications.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionarFaltas;
