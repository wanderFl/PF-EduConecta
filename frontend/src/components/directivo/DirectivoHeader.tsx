import React from "react";
import type { CeiafCourse } from "../../types";

type Props = {
  directorName: string;
  courses: CeiafCourse[];
  selected?: CeiafCourse | null;
  onChangeCourse: (id: number) => void;
  onLogout?: () => void;
};

const DirectivoHeader: React.FC<Props> = ({
  directorName, courses, selected, onChangeCourse, onLogout
}) => {
  const initials = directorName?.trim()?.slice(0,2).toUpperCase() || "DI";

  const displayCourse = (c: CeiafCourse) =>
    `${c.nombre}${c.paralelo ? ` - ${c.paralelo}` : ""}`;

  return (
    <header className="dir-header">
      <div className="dir-header-left">
        <div className="dir-avatar">{initials}</div>
        <div className="dir-name">{directorName}</div>
      </div>

      <div className="dir-header-center">
        <select
          className="dir-course-select"
          value={selected?.id_curso ?? ""}
          onChange={(e) => onChangeCourse(Number(e.target.value))}
        >
          <option value="" disabled>Selecciona otro curso…</option>
          {courses.map(c => (
            <option key={c.id_curso} value={c.id_curso}>
              {displayCourse(c)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <button className="dir-logout" onClick={onLogout}>⏻ Cerrar sesión</button>
      </div>
    </header>
  );
};

export default DirectivoHeader;
