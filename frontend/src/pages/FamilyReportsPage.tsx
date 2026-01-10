import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useFamily } from "../contexts/useFamily";
import { getLinkedChildren, getStudentReports } from "../services/familia";
import type { CeiafStudent, DisciplinaryReport } from "../types";
import FamilyHeader from "../components/familia/FamilyHeader";
import "./familia.css";

const FamilyReportsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedStudent, setSelectedStudent } = useFamily();

  const [students, setStudents] = useState<CeiafStudent[]>([]);
  const [reports, setReports] = useState<DisciplinaryReport[]>([]);
  const [loading, setLoading] = useState(true);

  const parentName = useMemo(
    () => user?.email?.split("@")[0] ?? "Familia",
    [user]
  );

  // 1. Cargar hijos vinculados
  useEffect(() => {
    (async () => {
      const list = await getLinkedChildren();
      setStudents(list);
      // Si no existe uno seleccionado y hay lista, preseleccionar el primero
      if (!selectedStudent && list.length > 0) {
        setSelectedStudent(list[0]);
      }
    })();
  }, []);

  // 2. Cargar reportes cuando cambia el estudiante seleccionado
  useEffect(() => {
    const fetchReports = async () => {
      if (!selectedStudent) {
        setReports([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getStudentReports(selectedStudent.id_estudiante);
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports", error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedStudent?.id_estudiante]);

  const handleChangeStudent = (id: number) => {
    const s = students.find((st) => st.id_estudiante === id) ?? null;
    setSelectedStudent(s);
  };

  // Helper para etiquetas de severidad
  const getSeverityClass = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "LEVE": return "bg-green-100 text-green-800 border-green-200";
      case "MODERADA": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "GRAVE": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (isoProp: string) => {
    if (!isoProp) return "";
    return new Date(isoProp).toLocaleDateString("es-EC", {
      year: "numeric", month: "short", day: "numeric", timeZone: "UTC"
    });
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
            <span className="crumb-current">Reportes Disciplinarios</span>
          </nav>

          <section className="student-info-card">
            <div className="sic-title">Reportes y Novedades</div>
            <div className="muted">
              Historial de incidencias disciplinarias registradas por inspección.
            </div>
          </section>

          {/* Lista de Reportes */}
          <section className="student-info-card" style={{ padding: 0, overflow: "hidden" }}>
             {!selectedStudent ? (
               <div className="empty">Selecciona un estudiante para ver sus reportes.</div>
             ) : loading ? (
               <div className="empty">Cargando reportes...</div>
             ) : reports.length === 0 ? (
               <div className="empty">
                 ✅ No hay reportes disciplinarios registrados para {selectedStudent.nombres}.
               </div>
             ) : (
              <div className="report-list" style={{display: 'flex', flexDirection: 'column'}}>
                  {reports.map(report => (
                    <div key={report.id} style={{
                      padding: "16px",
                      borderBottom: "1px solid #eef2f7",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}>
                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
                          <div>
                            <span style={{ 
                                display: "inline-block", 
                                padding: "2px 8px", 
                                borderRadius: "4px", 
                                fontSize: "11px", 
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                marginRight: "8px",
                                border: "1px solid transparent"
                            }} className={getSeverityClass(report.severity)}>
                              {report.severity}
                            </span>
                            <span style={{ 
                                fontSize: "12px", 
                                color: "#6b7280", 
                                fontWeight: "600",
                                textTransform: "uppercase" 
                            }}>
                              {report.category}
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#4a4b4d" }}>
                             {formatDate(report.incident_date)}
                          </div>
                       </div>
                       
                       <h3 style={{ margin: "4px 0 2px 0", fontSize: "16px", color: "#1f2937" }}>
                         {report.title}
                       </h3>
                       
                       <p style={{ margin: 0, fontSize: "14px", color: "#4b5563", whiteSpace: "pre-line" }}>
                         {report.description}
                       </p>
                    </div>
                  ))}
              </div>
             )}
          </section>

        </div>
        <div className="fam-sidebar">
           {/* Sidebar vacío o con widgets futuros */}
        </div>
      </div>
    </div>
  );
};

export default FamilyReportsPage;
