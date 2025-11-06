import React, { useEffect, useMemo, useState } from "react";
import "./directivo.css";
import { useAuth } from "../hooks/useAuth";
import { useDirectivo } from "../contexts/useDirectivo";
import DirectivoHeader from "../components/directivo/DirectivoHeader";
import type { CeiafCourse } from "../types";
import { listCoursesForDirector } from "../services/directivo";
import { useNavigate } from "react-router-dom";

const DirectivoDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedCourse, setSelectedCourse } = useDirectivo();
  const [courses, setCourses] = useState<CeiafCourse[]>([]);
  const navigate = useNavigate();

  const directorName = useMemo(() => user?.email?.split("@")[0] ?? "Directivo", [user]);

  useEffect(() => {
    (async () => {
      const res = await listCoursesForDirector();
      setCourses(res ?? []);
      // si no hay curso seleccionado, quédese en selector:
      if (!selectedCourse && (res?.length ?? 0) > 0) {
        // opcional: redirigir a selector
      }
    })();
  }, []);

  const onChangeCourse = (id: number) => {
    const c = courses.find(x => x.id_curso === id);
    if (c) {
      setSelectedCourse({ id_curso: c.id_curso, display_name: `${c.nombre}${c.paralelo ? ` - ${c.paralelo}` : ""}` });
    }
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
            <div className="card-title">Dashboard Institucional</div>
            <div className="card-sub">
              Curso seleccionado: <b>{selectedCourse?.display_name ?? "—"}</b>
            </div>
          </section>

          <section className="kpi-grid">
            <div className="kpi-tile" onClick={() => navigate("/directivo/rendimiento")}>
              <div className="kpi-title">Rendimiento académico</div>
              <button className="kpi-cta">Ver</button>
            </div>

            <div className="kpi-tile" onClick={() => navigate("/directivo/asistencia")}>
              <div className="kpi-title">Indicador de asistencia</div>
              <button className="kpi-cta">Ver</button>
            </div>
          </section>
        </div>
        <div className="dir-sidebar" />
      </div>
    </div>
  );
};

export default DirectivoDashboard;
