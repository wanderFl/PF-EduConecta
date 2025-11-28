// src/pages/DirectivoBehaviorPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useDirectivo } from "../contexts/useDirectivo";
import { useNavigate } from "react-router-dom";
import DirectivoHeader from "../components/directivo/DirectivoHeader";
import { getCourseBehavior } from "../services/directivo";
import type { CourseBehaviorPayload, BehaviorItem } from "../types";
import "./directivo.css";

const DirectivoBehaviorPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedCourse } = useDirectivo();
  const navigate = useNavigate();
    const [q, setQ] = useState("");

  const directorName = useMemo(
    () => user?.email?.split("@")[0] ?? "Directivo",
    [user]
  );

  const [payload, setPayload] = useState<CourseBehaviorPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar indicador cuando cambie el curso
  useEffect(() => {
    (async () => {
      if (!selectedCourse) {
        setPayload(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getCourseBehavior(selectedCourse.id_curso);
        setPayload(data);
      } catch (e) {
        console.error("Error cargando indicador de comportamiento", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCourse?.id_curso]);

  const avgAbsencePct = useMemo(() => {
    if (!payload || payload.items.length === 0) return 0;
    const sum = payload.items.reduce(
      (acc, it) => acc + (it.absence_pct ?? 0),
      0
    );
    return sum / payload.items.length;
  }, [payload]);

  const highRiskCount = useMemo(() => {
    if (!payload) return 0;
    return payload.items.filter((i) => i.risk_level === "ALTO").length;
  }, [payload]);

  // Ordenar por riesgo, luego por % de faltas, luego por nombre
  const sortedItems: BehaviorItem[] = useMemo(() => {
    if (!payload) return [];
    const riskOrder: Record<string, number> = { ALTO: 0, MEDIO: 1, BAJO: 2 };
    return payload.items.slice().sort((a, b) => {
      const ra = riskOrder[a.risk_level] ?? 99;
      const rb = riskOrder[b.risk_level] ?? 99;
      if (ra !== rb) return ra - rb;

      const pa = a.absence_pct ?? 0;
      const pb = b.absence_pct ?? 0;
      if (pb !== pa) return pb - pa;

      return a.name.localeCompare(b.name);
    });
  }, [payload]);

  const filteredItems = useMemo(() => {
  if (!q.trim()) return sortedItems;
  const query = q.toLowerCase();
  return sortedItems.filter((s) =>
    s.name.toLowerCase().includes(query)
  );
}, [q, sortedItems]);


  const riskBadgeClass = (risk: BehaviorItem["risk_level"]) => {
    if (risk === "ALTO") return "badge dang";
    if (risk === "MEDIO") return "badge warn";
    return "badge ok";
  };

  if (!selectedCourse) {
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
            <section className="dir-content">
              <div className="section-title">Indicador de comportamiento</div>
              <div className="muted">
                Selecciona un curso en la vista principal para ver este
                indicador.
              </div>
            </section>
          </div>
          <div className="dir-sidebar" />
        </div>
      </div>
    );
  }

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
            <span className="crumb-current">Indicador de comportamiento</span>
          </nav>

          {/* Encabezado */}
          <section className="dir-content" style={{ marginBottom: 16 }}>
            <div className="section-head">
              <div>
                <div className="section-title">Indicador de comportamiento</div>
                <div className="section-sub">
                  Curso: {selectedCourse.display_name ?? "—"}
                </div>
              </div>
            </div>

            {loading && (
              <div className="muted" style={{ padding: 16 }}>
                Cargando indicador de comportamiento…
              </div>
            )}

            {!loading && !payload && (
              <div className="muted" style={{ padding: 16 }}>
                No se pudo cargar el indicador.
              </div>
            )}

            {/* Tarjetas resumen */}
            {!loading && payload && (
              <div className="stats-grid" style={{ marginTop: 8 }}>
                <div className="stats-card">
                  <div className="stats-k">Novedades totales</div>
                  <div className="stats-v">
                    {payload.totalCourseReports ?? 0}
                  </div>
                </div>
                <div className="stats-card">
                  <div className="stats-k">Días con asistencia tomada</div>
                  <div className="stats-v">
                    {payload.totalAttendanceDays ?? 0}
                  </div>
                </div>
                <div className="stats-card">
                  <div className="stats-k">
                    Promedio % de faltas del curso
                  </div>
                  <div className="stats-v">
                    {avgAbsencePct.toFixed(1)}%
                  </div>
                </div>
                <div className="stats-card">
                  <div className="stats-k">Estudiantes en riesgo alto</div>
                  <div className="stats-v">{highRiskCount}</div>
                </div>
              </div>
            )}
          </section>
            <div className="section-head" style={{ marginTop: 12 }}>
            <input
                className="table-search"
                placeholder="Buscar estudiante…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ width: 260 }}
            />
            </div>

          {/* Tabla de estudiantes */}
          {!loading && payload && (
            <section className="dir-content">
              <div className="section-title" style={{ marginBottom: 10 }}>
                Detalle por estudiante
              </div>

              {sortedItems.length === 0 ? (
                <div className="muted" style={{ padding: 16 }}>
                  No hay datos de comportamiento registrados para este curso.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 220 }}>Estudiante</th>
                        <th className="td-right" style={{ width: 120 }}>
                          Novedades
                        </th>
                        <th className="td-right" style={{ width: 120 }}>
                          Faltas (%) 
                        </th>
                        <th className="td-right" style={{ width: 180 }}>
                          Faltas (número)
                        </th>
                        <th className="td-right" style={{ minWidth: 180 }}>
                          Tipo de novedad más común
                        </th>
                        <th className="td-right" style={{ width: 140 }}>
                          Riesgo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((s) => (
                        <tr
                            key={s.student_id}
                            className="row-clickable"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              navigate(`/directivo/behavior/student/${s.student_id}`)
                            }
                          >
                          <td>{s.name}</td>
                          <td className="td-right">{s.reports}</td>
                          <td className="td-right">
                            {s.absence_pct.toFixed(1)}%
                          </td>
                          <td className="td-right">{s.absences}</td>
                          <td className="td-right">
                            {s.most_common_category || "—"}
                          </td>
                          <td className="td-right">
                            <span className={riskBadgeClass(s.risk_level)}>
                              {s.risk_level === "ALTO"
                                ? "ALTO"
                                : s.risk_level === "MEDIO"
                                ? "MEDIO"
                                : "BAJO"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="dir-sidebar" />
      </div>
    </div>
  );
};

export default DirectivoBehaviorPage;
