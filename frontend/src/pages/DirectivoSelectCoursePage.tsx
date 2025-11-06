import React, { useEffect, useMemo, useState } from "react";
import "./directivo.css";
import { useAuth } from "../hooks/useAuth";
import { useDirectivo } from "../contexts/useDirectivo";
import DirectivoHeader from "../components/directivo/DirectivoHeader";
import type { CeiafCourse } from "../types";
import { listCoursesForDirector } from "../services/directivo"; // implementado por ti
import { useNavigate } from "react-router-dom";

const DirectivoSelectCoursePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { selectedCourse, setSelectedCourse } = useDirectivo();
  const [courses, setCourses] = useState<CeiafCourse[]>([]);

  const directorName = useMemo(() => user?.email?.split("@")[0] ?? "Directivo", [user]);

  useEffect(() => {
    (async () => {
      const res = await listCoursesForDirector(); // trae { id_curso, nombre, paralelo, ano_lectivo }
      setCourses(res ?? []);
    })();
  }, []);

  const onPick = (c: CeiafCourse) => {
    setSelectedCourse({ id_curso: c.id_curso, display_name: `${c.nombre}${c.paralelo ? ` - ${c.paralelo}` : ""}` });
    navigate("/directivo/dashboard");
  };

  const onChangeCourse = (id: number) => {
    const c = courses.find(x => x.id_curso === id);
    if (c) onPick(c);
  };

  return (
  <div className="dir-layout">
    <DirectivoHeader
      directorName={directorName}
      courses={courses}
      selected={
        selectedCourse
          ? ({
              id_curso: selectedCourse.id_curso,
              nombre: selectedCourse.display_name,
              paralelo: "",
              ano_lectivo: "",
            } as CeiafCourse)
          : null
      }
      onChangeCourse={onChangeCourse}
      onLogout={logout}
    />

    <div className="dir-body">
      <div className="dir-main">
        <section className="card">
          <div className="card-title">Selecciona un curso</div>
          <div className="card-sub">Elige el curso que deseas analizar</div>
        </section>

        {/* ===== Sección Básica ===== */}
        <section className="level-block">
          <header className="level-header">Básica (8vo a 10mo)</header>
          <div className="course-grid">
            {courses
              .filter(c => c.nivel?.toLowerCase() === "básica" || c.nivel?.toLowerCase() === "basica")
              .map(c => (
                <button
                  key={c.id_curso}
                  className="course-tile course-tile--basic"
                  onClick={() => onPick(c)}
                >
                  <div className="ct-name">
                    {c.nombre}{c.paralelo ? ` — ${c.paralelo}` : ""}
                  </div>
                  <div className="ct-meta">Año lectivo: {c.ano_lectivo || "—"}</div>
                </button>
              ))}
          </div>
        </section>

        {/* ===== Sección Bachillerato ===== */}
        <section className="level-block">
          <header className="level-header">Bachillerato</header>
          <div className="course-grid">
            {courses
              .filter(c => c.nivel?.toLowerCase() === "bachillerato")
              .map(c => (
                <button
                  key={c.id_curso}
                  className="course-tile course-tile--bach"
                  onClick={() => onPick(c)}
                >
                  <div className="ct-name">
                    {c.nombre}{c.paralelo ? ` — ${c.paralelo}` : ""}
                  </div>
                  <div className="ct-meta">Año lectivo: {c.ano_lectivo || "—"}</div>
                </button>
              ))}
          </div>
        </section>
      </div>

      <div className="dir-sidebar" />
    </div>
  </div>
);

};

export default DirectivoSelectCoursePage;
