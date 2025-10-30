import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useFamily } from "../contexts/useFamily";
import FamilyHeader from "../components/familia/FamilyHeader";
import { getLinkedChildren } from "../services/familia";
import { getStudentGrades } from "../services/familia";
import type { CeiafStudent, GradeRow } from "../types";
import { useNavigate } from "react-router-dom";
import "./familia.css";

const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedStudent, setSelectedStudent } = useFamily();
  const [students, setStudents] = useState<CeiafStudent[]>([]);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const parentName = useMemo(() => user?.email?.split("@")[0] ?? "Familia", [user]);

  useEffect(() => {
    (async () => {
      const list = await getLinkedChildren();
      setStudents(list);
      if (!selectedStudent && list.length > 0) setSelectedStudent(list[0]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedStudent) return;
      setLoading(true);
      try {
        const rows = await getStudentGrades(selectedStudent.id_estudiante);
        setGrades(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedStudent?.id_estudiante]);

  const handleChangeStudent = (id: number) => {
    const s = students.find(st => st.id_estudiante === id) ?? null;
    setSelectedStudent(s);
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
            <span className="crumb-link" onClick={() => navigate("/familia")}>Inicio</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Calificaciones</span>
          </nav>

          <section className="student-info-card">
            <div className="sic-title">Calificaciones</div>
            <div className="muted">Revisa las notas de las tareas enviadas.</div>
          </section>

          <section className="student-info-card" style={{ padding: 0 }}>
            {loading ? (
              <div className="empty" style={{ padding: 14 }}>Cargando…</div>
            ) : grades.length === 0 ? (
              <div className="empty" style={{ padding: 14 }}>No hay calificaciones disponibles.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table table-clean" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eef2f7" }}>Nombre</th>
                      <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eef2f7" }}>Calificación</th>
                      <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eef2f7" }}>Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map(g => (
                      <tr key={g.id}>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>
                          {g.task_title}
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>
                          {g.grade ?? "—"}
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>
                          {g.comments || "" /* por ahora vacío */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        <div className="fam-sidebar" />
      </div>
    </div>
  );
};

export default GradesPage;
