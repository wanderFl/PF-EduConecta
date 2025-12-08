import React, { useEffect, useMemo, useState } from "react";
import { useDirectivo } from "../contexts/useDirectivo";
import DirectivoHeader from "../components/directivo/DirectivoHeader";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { getSubjectStudentsPerformance } from "../services/directivo";
import "./directivo.css";
import type { SubjectStudentsPayload, SubjectStudentRow } from "../types";

const DirectivoSubjectPerformancePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedCourse } = useDirectivo();
  const navigate = useNavigate();
  const directorName = useMemo(
    () => user?.email?.split("@")[0] ?? "Directivo",
    [user]
  );

  // /directivo/grades/subject/:subjectId
  const params = useParams();
  const subjectId = Number(params.subjectId);

  const [payload, setPayload] = useState<SubjectStudentsPayload | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      if (!selectedCourse || !Number.isFinite(subjectId)) return;
      const data = await getSubjectStudentsPerformance(
        selectedCourse.id_curso,
        subjectId,
        q
      );
      setPayload(data);
    })();
  }, [selectedCourse?.id_curso, subjectId, q]);

  // ordenar por promedio desc, luego nombre
  const rows: SubjectStudentRow[] = useMemo(() => {
    return (payload?.items ?? []).slice().sort((a, b) => {
      const av = (b.avg ?? -1) - (a.avg ?? -1);
      return av !== 0 ? av : a.student_name.localeCompare(b.student_name);
    });
  }, [payload?.items]);

  // helper visual para badge del promedio
  const avgBadgeClass = (v: number | null | undefined) => {
    if (v == null) return "";
    if (v >= 9) return "badge ok";
    if (v >= 7) return "badge warn";
    return "badge dang";
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
          {/* breadcrumb */}
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
            <span className="crumb-current">Rendimiento por materia</span>
          </nav>

          {/* ===== Tabla en tarjeta blanca ===== */}
          <section className="dir-content" style={{ marginBottom: 16 }}>
            <div className="section-head">
              <div>
                <div className="section-title">
                  {payload ? `Materia: ${payload.subject_name}` : "Materia"}
                </div>
                <div className="section-sub">
                  Curso: {selectedCourse?.display_name ?? "—"}
                </div>
              </div>

              {/* Buscador */}
              <input
                className="table-search"
                placeholder="Buscar estudiante…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Tabla */}
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ minWidth: 260 }}>Estudiante</th>
                    <th className="td-right" style={{ width: 160 }}>
                      Promedio
                    </th>
                    <th className="td-right" style={{ width: 160 }}>
                      Entregadas
                    </th>
                    <th className="td-right" style={{ width: 160 }}>
                      Atrasadas
                    </th>
                  </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.student_id}
                        className="row-clickable"
                        onClick={() =>
                          navigate(
                            `/directivo/grades/subject/${subjectId}/student/${r.student_id}`
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <span className="link-like">{r.student_name}</span>
                        </td>
                        <td className="td-right">
                          {r.avg == null ? (
                            "—"
                          ) : (
                            <span
                              className={avgBadgeClass(r.avg)}
                              title={`${r.avg.toFixed(2)}`}
                            >
                              {r.avg.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="td-right">
                          <span
                            className="badge ok"
                            title={`${r.delivered_count} entregas`}
                          >
                            {r.delivered_count}
                          </span>
                        </td>
                        <td className="td-right">
                          <span
                            className="badge dang"
                            title={`${r.late_count} atrasadas`}
                          >
                            {r.late_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* resto igual */}
                  </tbody>

              </table>
            </div>
          </section>

          {/* ===== Resumen en tarjetas blancas ===== */}
          {payload && (
            <section className="dir-content">
              <div className="section-title" style={{ marginBottom: 10 }}>
                Resumen estadístico
              </div>
              <div className="stats-grid">
                <div className="stats-card">
                  <div className="stats-k">Estudiantes</div>
                  <div className="stats-v">{payload.summary.total_students}</div>
                </div>
                <div className="stats-card">
                  <div className="stats-k">Tareas en la materia</div>
                  <div className="stats-v">{payload.summary.total_tasks}</div>
                </div>
                <div className="stats-card">
                  <div className="stats-k">% Entregas (global)</div>
                  <div className="stats-v">
                    {payload.summary.overall_delivered_pct.toFixed(0)}%
                  </div>
                </div>
                <div className="stats-card">
                  <div className="stats-k">% Atrasos sobre vencidas</div>
                  <div className="stats-v">
                    {payload.summary.late_pct_over_past_due.toFixed(0)}%
                  </div>
                </div>
                <div className="stats-card">
                  <div className="stats-k">Bajo rendimiento (&lt; 7)</div>
                  <div className="stats-v">
                    {payload.summary.low_performance_count}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="dir-sidebar" />
      </div>
    </div>
  );
};

export default DirectivoSubjectPerformancePage;
