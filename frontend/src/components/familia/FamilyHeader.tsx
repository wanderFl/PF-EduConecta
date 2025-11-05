import React from "react";
import { useAuth } from "../../hooks/useAuth";
import type { CeiafStudent } from "../../types";
type Props = {
  parentName: string;
  students: CeiafStudent[];
  selected?: CeiafStudent | null;
  onChangeStudent: (id_estudiante: number) => void;
  onOpenAddChild?: () => void;
};

const FamilyHeader: React.FC<Props> = ({
  parentName,
  students,
  selected,
  onChangeStudent,
  onOpenAddChild,
}) => {
  const { logout } = useAuth(); // ✅ usamos tu hook de autenticación

  return (
    <header className="fam-header">
      <div className="fam-header-left">
        <div className="avatar-initials">{parentName?.slice(0, 2).toUpperCase()}</div>
        <div className="parent-name" title={parentName}>{parentName}</div>
      </div>

      <div className="fam-header-center">
        <select
          className="student-select"
          value={selected?.id_estudiante ?? ""}
          onChange={(e) => onChangeStudent(Number(e.target.value))}
        >
          {students.map((s) => (
            <option key={s.id_estudiante} value={s.id_estudiante}>
              {`${s.nombres} ${s.apellidos}`}{" "}
              {s.curso_nombre ? `- ${s.curso_nombre}${s.curso_paralelo ? ` ${s.curso_paralelo}` : ""}` : ""}
            </option>
          ))}
        </select>
        {onOpenAddChild && (
          <button className="add-child-btn" onClick={onOpenAddChild} title="Agregar hijo">＋</button>
        )}
      </div>

      <div className="fam-header-right">
        <button className="logout-btn" onClick={logout}>⏻ Cerrar sesión</button>
      </div>
    </header>
  );
};

export default FamilyHeader;
