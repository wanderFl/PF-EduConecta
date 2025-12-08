import React from "react";
import type { CeiafStudent } from "../../types";

const StudentInfoCard: React.FC<{ student: CeiafStudent }> = ({ student }) => {
  return (
    <section className="student-info-card">
      <div className="sic-title">👤 Perfil Estudiantil</div>
      <div className="sic-row"><span>Nombre</span><b>{student.nombres} {student.apellidos}</b></div>
      <div className="sic-row"><span>Cédula</span><b>{student.cedula}</b></div>
      <div className="sic-row">
        <span>Curso</span>
        <b>{student.curso_nombre ?? "—"} {student.curso_paralelo ? `(${student.curso_paralelo})` : ""}</b>
      </div>
      <div className="sic-row"><span>Año lectivo</span><b>{student.curso_ano_lectivo ?? "—"}</b></div>
    </section>
  );
};

export default StudentInfoCard;
