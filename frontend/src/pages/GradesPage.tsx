// src/pages/GradesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useFamily } from "../contexts/useFamily";
import FamilyHeader from "../components/familia/FamilyHeader";
import {
  getLinkedChildren,
  getStudentSubjects,
  getStudentGrades,
} from "../services/familia";
import type { CeiafStudent, GradeRow } from "../types";
import { useNavigate } from "react-router-dom";
import "./familia.css";
import FamilyTaskDetailModal from "../components/familia/FamilyTaskDetailModal";

const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedStudent, setSelectedStudent } = useFamily();

  const [students, setStudents] = useState<CeiafStudent[]>([]);
  const [subjects, setSubjects] = useState<{ id_materia: number; nombre: string }[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<GradeRow | null>(null);

  const parentName = useMemo(
    () => user?.email?.split("@")[0] ?? "Familia",
    [user]
  );

  // Cargar hijos vinculados
  useEffect(() => {
    (async () => {
      const list = await getLinkedChildren();
      setStudents(list);
      if (!selectedStudent && list.length > 0) {
        setSelectedStudent(list[0]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar materias del estudiante seleccionado
  useEffect(() => {
    (async () => {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        const subs = await getStudentSubjects(selectedStudent.id_estudiante);
        setSubjects(subs);

        if (subs.length > 0) {
          setSelectedSubjectId(subs[0].id_materia);
        } else {
          setSelectedSubjectId(null);
          setGrades([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedStudent?.id_estudiante]);

  // Cargar calificaciones de la materia seleccionada
  useEffect(() => {
    (async () => {
      if (!selectedStudent || !selectedSubjectId) {
        setGrades([]);
        return;
      }
      setLoading(true);
      try {
        const rows = await getStudentGrades(
          selectedStudent.id_estudiante,
          selectedSubjectId
        );
        setGrades(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedStudent?.id_estudiante, selectedSubjectId]);

  const handleChangeStudent = (id: number) => {
    const s = students.find((st) => st.id_estudiante === id) ?? null;
    setSelectedStudent(s);
  };

  // Nombre legible de la materia seleccionada
  const selectedSubjectName = useMemo(() => {
    if (!selectedSubjectId) return null;
    const sub = subjects.find((s) => s.id_materia === selectedSubjectId);
    return sub?.nombre ?? null;
  }, [subjects, selectedSubjectId]);

  // Agrupar por Trimestre -> Aporte (para UNA sola materia)
  const groupedByPeriod = useMemo(() => {
    const triMap = new Map<number, Map<number, GradeRow[]>>(); // trimestre -> (aporte -> tareas)

    for (const g of grades) {
      const tri = g.trimestre ?? 0; // 0 = sin trimestre
      const ap = g.aporte ?? 0; // 0 = sin aporte

      let apMap = triMap.get(tri);
      if (!apMap) {
        apMap = new Map<number, GradeRow[]>();
        triMap.set(tri, apMap);
      }

      let list = apMap.get(ap);
      if (!list) {
        list = [];
        apMap.set(ap, list);
      }

      list.push(g);
    }

    return triMap;
  }, [grades]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-EC", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const computeStatus = (g: GradeRow): string => {
    const due = g.due_date ? new Date(g.due_date) : null;
    const sub = g.submitted_at ? new Date(g.submitted_at) : null;

    if (!sub) {
      if (due && due < new Date()) return "No entregada (atrasada)";
      return "No entregada";
    }

    if (due && sub > due) return "Entregada tarde";
    return "Entregada";
  };

  return (
    <div className="fam-layout">
      <FamilyHeader
        parentName={parentName}
        students={students}
        selected={selectedStudent}
        onChangeStudent={handleChangeStudent}
        onOpenAddChild={() => navigate("/familia")}
      />

      <div className="fam-body">
        <div className="fam-main">
          {/* Breadcrumb */}
          <nav className="fam-breadcrumb">
            <span
              className="crumb-link"
              onClick={() => navigate("/familia")}
            >
              Inicio
            </span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Calificaciones</span>
          </nav>

          <section className="student-info-card">
            <div className="sic-title">Calificaciones</div>
            <div className="muted">
              Revisa las notas de las tareas enviadas por materia.
            </div>
          </section>

          <div className="grades-layout">
            {/* Sidebar de materias (igual que antes) */}
            <aside className="grades-sidebar">
              {subjects.length === 0 ? (
                <div className="muted">
                  No hay materias con calificaciones registradas.
                </div>
              ) : (
                subjects.map((sub) => (
                  <button
                    key={sub.id_materia}
                    className={
                      sub.id_materia === selectedSubjectId
                        ? "subj-btn subj-btn-active"
                        : "subj-btn"
                    }
                    onClick={() => setSelectedSubjectId(sub.id_materia)}
                  >
                    {sub.nombre}
                  </button>
                ))
              )}
            </aside>

            {/* Panel principal con estilo de DIRECTIVO */}
            <section className="student-info-card grades-main-card" style={{ padding: 16 }}>
              {loading ? (
                <div className="empty" style={{ padding: 14 }}>
                  Cargando…
                </div>
              ) : !selectedSubjectId ? (
                <div className="empty" style={{ padding: 14 }}>
                  Selecciona una materia para ver las calificaciones.
                </div>
              ) : grades.length === 0 ? (
                <div className="empty" style={{ padding: 14 }}>
                  No hay calificaciones disponibles en esta materia.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  {/* Cabecera similar a DirectivoSubject */}
                  <div className="section-head" style={{ marginBottom: 8 }}>
                    <div>
                      <div className="section-title">
                        {selectedSubjectName ?? "Materia"}
                      </div>
                      {selectedStudent && (
                        <div className="section-sub">
                          Estudiante: {selectedStudent.nombres}{" "}
                          {selectedStudent.apellidos}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabla estilo DIRECTIVO */}
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
                      {Array.from(groupedByPeriod.entries())
                        .sort(([a], [b]) => a - b)
                        .map(([tri, aportes]) => (
                          <React.Fragment key={tri}>
                            {/* Fila de TRIMESTRE (igual que Directivo) */}
                            <tr className="tri-header-row">
                              <td colSpan={6}>
                                {tri === 0
                                  ? "Sin trimestre"
                                  : `${tri}º Trimestre`}
                              </td>
                            </tr>

                            {Array.from(aportes.entries())
                              .sort(([a], [b]) => a - b)
                              .map(([ap, list]) => (
                                <React.Fragment key={ap}>
                                  {/* Mini encabezado de APORTE */}
                                  <tr className="ap-header-row">
                                    <td colSpan={6}>
                                      <span className="ap-badge">
                                        Aporte {ap}
                                      </span>
                                    </td>
                                  </tr>

                                  {list.length === 0 ? (
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
                                    list.map((g) => (
                                      <tr
                                        key={g.id}
                                        className="row-clickable"
                                        onClick={() => setSelectedTask(g)}
                                      >
                                        <td>
                                         
                                        </td>
                                        <td>{g.task_title}</td>
                                        <td className="td-right">
                                          {formatDate(g.due_date)}
                                        </td>
                                        <td className="td-right">
                                          {formatDate(g.submitted_at)}
                                        </td>
                                        <td className="td-right">
                                          {g.grade != null
                                            ? g.grade.toFixed(2)
                                            : "—"}
                                        </td>
                                        <td className="td-right">
                                          {computeStatus(g)}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </React.Fragment>
                              ))}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="fam-sidebar" />
      </div>

      {selectedTask && (
        <FamilyTaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default GradesPage;
