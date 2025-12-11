// src/pages/DirectivoStudentSubjectPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useDirectivo } from "../contexts/useDirectivo";
import { useNavigate, useParams } from "react-router-dom";
import DirectivoHeader from "../components/directivo/DirectivoHeader";
import { getStudentSubjectTasks } from "../services/directivo";
import type { StudentSubjectTasksPayload, StudentTaskRow } from "../types";
import "./directivo.css";
import DirectivoTaskDetailModal from "../components/directivo/DirectivoTaskDetailModal";

const DirectivoStudentSubjectPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedCourse } = useDirectivo();
  const navigate = useNavigate();

  const directorName = useMemo(
    () => user?.email?.split("@")[0] ?? "Directivo",
    [user]
  );

  const params = useParams();
  const subjectId = Number(params.subjectId);
  const studentId = Number(params.studentId);

  const [payload, setPayload] = useState<StudentSubjectTasksPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!selectedCourse || !Number.isFinite(subjectId) || !Number.isFinite(studentId)) {
        return;
      }
      setLoading(true);
      try {
        const data = await getStudentSubjectTasks(
          selectedCourse.id_curso,
          subjectId,
          studentId
        );
        setPayload(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCourse?.id_curso, subjectId, studentId]);

  const rows: StudentTaskRow[] = useMemo(() => {
    if (!payload) return [];
    return payload.items.slice().sort((a, b) => {
      // aseguramos orden consistente en front también (por si acaso)
      const tA = (a.trimestre ?? 99) - (b.trimestre ?? 99);
      if (tA !== 0) return tA;
      const aA = (a.aporte ?? 99) - (b.aporte ?? 99);
      if (aA !== 0) return aA;
      return a.due_date.localeCompare(b.due_date);
    });
  }, [payload]);

  const formatDate = (iso: string | null, forceUtc = false) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-EC", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: forceUtc ? "UTC" : undefined,
    });
  };

  const [selectedTask, setSelectedTask] = useState<StudentTaskRow | null>(null);
  const trimestres = [1, 2, 3];
  const aportes = [1, 2];

  const statusBadgeClass = (status: StudentTaskRow["status"]) => {
    if (status === "ENTREGADA") return "badge ok";
    if (status === "ENTREGADA_TARDE") return "badge warn";
    return "badge dang"; // NO_ENTREGADA
  };

  return (
    
    <div className="dir-layout">
      <DirectivoHeader
        directorName={directorName}
        courses={[]}
        selected={null}
        onChangeCourse={() => {}}
        onLogout={logout}
      />

      <div className="dir-body">
        <div className="dir-main">
          {/* Breadcrumb */}
          <nav className="fam-breadcrumb" style={{ marginBottom: 8 }}>
            <span
              className="crumb-link"
              onClick={() => navigate("/directivo/dashboard")}
            >
              Inicio
            </span>
            <span className="crumb-sep">›</span>
            <span
              className="crumb-link"
              onClick={() => navigate("/directivo/rendimiento")}
            >
              Rendimiento Académico
            </span>
            <span className="crumb-sep">›</span>
            <span
              className="crumb-link"
              onClick={() =>
                navigate(`/directivo/grades/subject/${subjectId}`)
              }
            >
              Rendimiento por materia
            </span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Detalle estudiante</span>
          </nav>

          <section className="dir-content" style={{ marginBottom: 16 }}>
            <div className="section-head">
              <div>
                <div className="section-title">
                  {payload
                    ? `Estudiante: ${payload.student_name}`
                    : "Estudiante"}
                </div>
                <div className="section-sub">
                  Curso: {selectedCourse?.display_name ?? "—"}
                  {" · "}
                  Materia: {payload?.subject_name ?? "—"}
                </div>
              </div>
            </div>

            {loading && (
              <div style={{ padding: 16 }} className="muted">
                Cargando tareas…
              </div>
            )}

            {!loading && (
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 140 }}>Periodo</th>
                      <th style={{ minWidth: 260 }}>Tarea</th>
                      <th className="td-right" style={{ width: 140 }}>
                        Fecha entrega
                      </th>
                      <th className="td-right" style={{ width: 140 }}>
                        Fecha envío
                      </th>
                      <th className="td-right" style={{ width: 120 }}>
                        Calificación
                      </th>
                      <th className="td-right" style={{ width: 160 }}>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                        {trimestres.map((tri) => (
                          <React.Fragment key={`tri-${tri}`}>
                            {/* Título de trimestre */}
                            <tr className="tri-header-row">
                              <td colSpan={6}>
                                <strong>{tri}º Trimestre</strong>
                              </td>
                            </tr>

                            {aportes.map((ap) => {
                              const tareasAporte = rows.filter(
                                (r) => r.trimestre === tri && r.aporte === ap
                              );

                              return (
                                <React.Fragment key={`tri-${tri}-ap-${ap}`}>
                                  {/* Mini encabezado de aporte */}
                                  <tr className="ap-header-row">
                                    <td colSpan={6}>
                                      <span className="ap-badge">Aporte {ap}</span>
                                    </td>
                                  </tr>

                                  {tareasAporte.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={6}
                                        className="muted"
                                        style={{ padding: 8, fontSize: "0.85rem" }}
                                      >
                                        No hay tareas registradas en este aporte.
                                      </td>
                                    </tr>
                                  ) : (
                                    tareasAporte.map((r) => (
                                      <tr
                                        key={r.task_id}
                                        className="row-clickable"
                                        onClick={() => setSelectedTask(r)}
                                        style={{ cursor: "pointer" }}
                                      >
                                        <td>{/* Periodo ya se ve arriba; aquí solo mostramos Aporte */}
                                          {/* O puedes dejar vacío o repetir el aporte si quieres */}
                                        </td>
                                        <td>{r.title}</td>
                                        <td className="td-right">{formatDate(r.due_date, true)}</td>
                                        <td className="td-right">
                                          {r.submitted_at ? formatDate(r.submitted_at) : "—"}
                                        </td>
                                        <td className="td-right">
                                          {r.grade != null ? r.grade.toFixed(2) : "—"}
                                        </td>
                                        <td className="td-right">
                                          <span
                                            className={statusBadgeClass(r.status)}
                                            title={r.status.replace("_", " ")}
                                          >
                                            {r.status === "ENTREGADA"
                                              ? "Entregada"
                                              : r.status === "ENTREGADA_TARDE"
                                              ? "Entregada tarde"
                                              : "No entregada"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="dir-sidebar" />
      </div>
      {selectedTask && (
        <DirectivoTaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default DirectivoStudentSubjectPage;
