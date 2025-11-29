import React, { useEffect, useMemo, useState } from "react";
import "./directivo.css";
import { useAuth } from "../hooks/useAuth";
import { useDirectivo } from "../contexts/useDirectivo";
import DirectivoHeader from "../components/directivo/DirectivoHeader";
import { useNavigate } from "react-router-dom";
import GradesBySubjectChart from "../components/directivo/GradesBySubjectChart";
import { getGradesBySubject } from "../services/directivo";
import { listCoursesForDirector } from "../services/directivo";
import type { CeiafCourse, GradesBySubjectItem } from "../types";

const DirectivoRendimientoPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { selectedCourse, setSelectedCourse } = useDirectivo();

  const directorName = useMemo(() => user?.email?.split("@")[0] ?? "Directivo", [user]);

  // Cursos locales (en vez de availableCourses del contexto)
  const [courses, setCourses] = useState<CeiafCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);

  const [data, setData] = useState<GradesBySubjectItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Carga cursos
  useEffect(() => {
    (async () => {
      setLoadingCourses(true);
      try {
        const list = await listCoursesForDirector();
        setCourses(list);
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  // Si no hay curso seleccionado, manda a seleccionar curso
  useEffect(() => {
    if (!selectedCourse) {
      navigate("/directivo/cursos");
    }
  }, [selectedCourse, navigate]);

  // Carga promedios por materia
  useEffect(() => {
    if (!selectedCourse) return;
    (async () => {
      setLoadingData(true);
      try {
        const items = await getGradesBySubject(selectedCourse.id_curso);
        setData(items);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [selectedCourse]);

  const onChangeCourse = (id: number) => {
    const c = courses.find((x) => x.id_curso === id);
    if (c) {
      setSelectedCourse({ id_curso: c.id_curso, display_name: `${c.nombre}${c.paralelo ? ` - ${c.paralelo}` : ""}` });
      // recarga misma vista
      navigate("/directivo/dashboard/academico");
    }
  };

  // Adaptar el seleccionado al tipo CeiafCourse para el header (sin any)
  const selectedForHeader: CeiafCourse | null = selectedCourse
    ? {
        id_curso: selectedCourse.id_curso,
        nombre: selectedCourse.display_name,
        nivel: "",
        paralelo: "",
        ano_lectivo: "",
        display_name: selectedCourse.display_name,
      }
    : null;

  return (
    <div className="dir-layout">
      <DirectivoHeader
        directorName={directorName}
        courses={courses}
        selected={selectedForHeader}
        onChangeCourse={onChangeCourse}
        onLogout={logout}
      />

      <div className="dir-body">
        <div className="dir-main">
          <nav className="fam-breadcrumb">
            <span className="crumb-link" onClick={() => navigate("/directivo/dashboard")}>Inicio</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Rendimiento académico</span>
          </nav>

          {loadingCourses || loadingData ? (
            <div className="card"><div className="muted">Cargando…</div></div>
          ) : (
            <GradesBySubjectChart data={data} />
          )}
        </div>
        <div className="dir-sidebar" />
      </div>
    </div>
  );
};

export default DirectivoRendimientoPage;
