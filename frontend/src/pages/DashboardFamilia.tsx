// src/pages/DashboardFamilia.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { CeiafStudent } from "../types";
import { getLinkedChildren } from "../services/familia";
import FamilyHeader from "../components/familia/FamilyHeader";
import StudentInfoCard from "../components/familia/StudentInfoCard";
import ActionGrid from "../components/familia/ActionGrid";
import PendingTasksPanel from "../components/familia/PendingTasksPanel";
import AddChildModal from "../components/familia/AddChildModal";
import { useFamily } from "../contexts/useFamily";
import { PerformanceReport } from "../components/AI/PerformanceReport";
import "./familia.css";

export const DashboardFamilia: React.FC = () => {
  const { user } = useAuth();
  const { selectedStudent, setSelectedStudent } = useFamily();

  const parentName = useMemo(
    () => user?.email?.split("@")[0] ?? "Familia",
    [user]
  );

  const [students, setStudents] = useState<CeiafStudent[]>([]);
  const [openAdd, setOpenAdd] = useState(false);

  const selected = useMemo(
    () => students.find(s => s.id_estudiante === selectedStudent?.id_estudiante) ?? null,
    [students, selectedStudent]
  );

  const load = async () => {
    const list = await getLinkedChildren();
    setStudents(list);
    if (!selectedStudent && list.length > 0) setSelectedStudent(list[0]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeStudent = (id: number) => {
    const found = students.find(s => s.id_estudiante === id) ?? null;
    setSelectedStudent(found);
  };

  return (
    <div className="fam-layout">
      {/* Header azul */}
      <FamilyHeader
        parentName={parentName}
        students={students}
        selected={selected}
        onChangeStudent={handleChangeStudent}
        onOpenAddChild={() => setOpenAdd(true)}
      />

      {/* Contenido */}
      <div className="fam-body">
        <div className="fam-main">
          {selected ? (
            <>
              <StudentInfoCard student={selected} />
              
              {/* Reporte de Rendimiento con IA */}
              <div style={{ marginTop: '20px' }}>
                <PerformanceReport 
                  studentExternalId={String(selected.id_estudiante)}
                />
              </div>
              
              <ActionGrid/>
            </>
          ) : (
            <div className="empty">
              Selecciona un estudiante o agrega uno nuevo.
            </div>
          )}
        </div>

        <div className="fam-sidebar">
          {selected && <PendingTasksPanel studentId={selected.id_estudiante} />}
        </div>
      </div>

      {/* Modal para agregar hijo */}
      <AddChildModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onLinked={() => { setOpenAdd(false); load(); }}
      />
    </div>
  );
};
