// src/pages/DirectivoStudentBehaviorPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useDirectivo } from "../contexts/useDirectivo";
import { useNavigate, useParams } from "react-router-dom";
import DirectivoHeader from "../components/directivo/DirectivoHeader";
import { getStudentBehavior } from "../services/directivo";
import type { StudentBehaviorPayload, StudentBehaviorReportRow } from "../types";
import "./directivo.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DirectivoStudentBehaviorPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedCourse } = useDirectivo();
  const navigate = useNavigate();

  const directorName = useMemo(
    () => user?.email?.split("@")[0] ?? "Directivo",
    [user]
  );

  const params = useParams();
  const studentId = Number(params.studentId);

  const [data, setData] = useState<StudentBehaviorPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!selectedCourse || !Number.isFinite(studentId)) return;
      setLoading(true);
      try {
        const payload = await getStudentBehavior(
          selectedCourse.id_curso,
          studentId
        );
        setData(payload);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCourse?.id_curso, studentId]);

  const riskBadgeClass = (risk: string | undefined) => {
    if (!risk) return "badge";
    const r = risk.toUpperCase();
    if (r === "ALTO") return "badge dang";
    if (r === "MEDIO") return "badge warn";
    return "badge ok";
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-EC", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    });
  };

  // Ordenar reportes por fecha desc (por si acaso)
  const reports: StudentBehaviorReportRow[] = useMemo(() => {
    if (!data) return [];
    return data.reports.slice().sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [data]);

  // Formatear mes para el gráfico (ej: 2025-01 → Ene 2025)
  const chartData = useMemo(() => {
    if (!data) return [];
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    return data.monthly_absences.map((p) => {
      // p.month formato "YYYY-MM"
      const [yStr, mStr] = p.month.split("-");
      const monthIdx = Number(mStr) - 1;
      const label =
        !Number.isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12
          ? `${monthNames[monthIdx]} ${yStr}`
          : p.month;

      return {
        ...p,
        label,
      };
    });
  }, [data]);

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
              onClick={() => navigate("/directivo/comportamiento")}
            >
              Indicador de comportamiento
            </span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Detalle estudiante</span>
          </nav>

          {/* Tarjeta resumen */}
          <section className="dir-content" style={{ marginBottom: 16 }}>
            {loading && !data ? (
              <div className="muted" style={{ padding: 16 }}>
                Cargando información del estudiante…
              </div>
            ) : !data ? (
              <div className="muted" style={{ padding: 16 }}>
                No se encontró información del estudiante.
              </div>
            ) : (
              <>
                <div className="section-head">
                  <div>
                    <div className="section-title">
                      Comportamiento: {data.student_name}
                    </div>
                    <div className="section-sub">
                      Curso: {selectedCourse?.display_name ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="stats-grid" style={{ marginTop: 12 }}>
                  <div className="stats-card">
                    <div className="stats-k">Novedades</div>
                    <div className="stats-v">{data.total_reports}</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-k">Porcentaje de faltas</div>
                    <div className="stats-v">
                      {data.absence_pct.toFixed(1)}%
                    </div>
                    <div className="stats-sub">
                      {data.total_absences} faltas de {data.total_days} días
                    </div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-k">Nivel de riesgo</div>
                    <div className="stats-v">
                      <span className={riskBadgeClass(data.risk_level)}>
                        {data.risk_level}
                      </span>
                    </div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-k">Tipo de novedad más común</div>
                    <div className="stats-v">
                      {data.most_common_category ?? "—"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Gráfico de faltas en el tiempo */}
          <section className="dir-content" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 8 }}>
              Tendencia de faltas
            </div>
            {(!data || chartData.length === 0) ? (
              <div className="muted" style={{ padding: 16 }}>
                No hay datos de asistencia suficientes para mostrar una
                tendencia.
              </div>
            ) : (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                    formatter={(value: number) => [`${value} faltas`, "Faltas"]}
                    labelFormatter={(label: string) => `Mes: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="absences"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Tabla de novedades disciplinarias */}
          <section className="dir-content">
            <div className="section-title" style={{ marginBottom: 8 }}>
              Novedades registradas
            </div>

            {!data ? (
              <div className="muted" style={{ padding: 16 }}>
                No hay datos para mostrar.
              </div>
            ) : reports.length === 0 ? (
              <div className="muted" style={{ padding: 16 }}>
                Este estudiante no tiene novedades registradas.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 120 }}>Fecha</th>
                      <th style={{ minWidth: 140 }}>Tipo</th>
                      <th style={{ minWidth: 120 }}>Severidad</th>
                      <th style={{ minWidth: 220 }}>Título</th>
                      <th style={{ minWidth: 280 }}>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td>{formatDate(r.date)}</td>
                        <td>{r.category}</td>
                        <td>{r.severity}</td>
                        <td>{r.title}</td>
                        <td>{r.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="dir-sidebar" />
      </div>
    </div>
  );
};

export default DirectivoStudentBehaviorPage;
