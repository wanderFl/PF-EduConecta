import React, { useEffect, useMemo, useState } from "react";
import { useFamily } from "../contexts/useFamily";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import FamilyHeader from "../components/familia/FamilyHeader";
import { getLinkedChildren, getStudentTasks } from "../services/familia";
import type { CeiafStudent, PendingTask } from "../types";
import { startOfWeekMonday, getWeekRangeFrom, addWeeks, formatDayHeader } from "../utils/dates";
import TaskSubmissionModal from "../components/familia/TaskSubmissionModal";
import { TaskRecommendations } from "../components/AI/TaskRecommendations";
import "./familia.css";

const WeeklyTasksPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedStudent, setSelectedStudent } = useFamily();
  const [selectedTask, setSelectedTask] = useState<PendingTask | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openTaskModal = (t: PendingTask) => {
    setSelectedTask(t);
    setModalOpen(true);
  };
  const closeTaskModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };
  const parentName = useMemo(() => user?.email?.split("@")[0] ?? "Familia", [user]);

  const [students, setStudents] = useState<CeiafStudent[]>([]);
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [filter, setFilter] = useState<"ALL" | "PENDING">("ALL"); // 👈 filtro

  const { from, to, days } = useMemo(() => getWeekRangeFrom(weekStart), [weekStart]);

  // carga hijos y fija el seleccionado si no hay
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

  // carga tareas de la semana actual del estudiante seleccionado
  useEffect(() => {
    (async () => {
      if (!selectedStudent) return;
      const list = await getStudentTasks(selectedStudent.id_estudiante, from, to);
      setTasks(list);
    })();
  }, [selectedStudent, from, to]);

  const handleChangeStudent = (id: number) => {
    const found = students.find((s) => s.id_estudiante === id) ?? null;
    setSelectedStudent(found);
  };

  const prevWeek = () => setWeekStart((d) => addWeeks(d, -1));
  const nextWeek = () => setWeekStart((d) => addWeeks(d, +1));

  // Aplicar filtro de tareas
  const filteredTasks = useMemo(() => {
    return filter === "PENDING" ? tasks.filter((t) => t.status === "PENDING") : tasks;
  }, [tasks, filter]);

  // Agrupar por día YYYY-MM-DD
  const byDay = useMemo(() => {
    const map = new Map<string, PendingTask[]>();
    filteredTasks.forEach((t) => {
      const dateKey = new Date(t.due_date).toISOString().slice(0, 10);
      const arr = map.get(dateKey) ?? [];
      arr.push(t);
      map.set(dateKey, arr);
    });
    return map;
  }, [filteredTasks]);

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
          {/* Breadcrumb / rutas */}
          <nav className="fam-breadcrumb">
            <span
              className="crumb-link"
              onClick={() => navigate("/familia")}
            >
              Inicio
            </span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Calendario Semanal</span>
          </nav>
          {/* Encabezado del calendario con flechas y filtro */}
          <section className="student-info-card">
            <div className="sic-title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="nav-btn" onClick={prevWeek} aria-label="Semana anterior">◀</button>
              <span>📅 Calendario Semanal de Tareas</span>
              <button className="nav-btn" onClick={nextWeek} aria-label="Semana siguiente">▶</button>

              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                <label className="muted" htmlFor="filter">Ver:</label>
                <select
                  id="filter"
                  className="student-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as "ALL" | "PENDING")}
                  style={{ minWidth: 180 }}
                >
                  <option value="ALL">Todas</option>
                  <option value="PENDING">Solo pendientes</option>
                </select>
              </div>
            </div>
            <div className="muted">Semana: {from} a {to}</div>
          </section>

          {/* Grid de 7 columnas: Lun...Dom */}
          <section className="calendar-grid">
            {days.map((d) => {
              const key = d.toISOString().slice(0, 10);
              const items = byDay.get(key) ?? [];
              return (
                <div key={key} className="calendar-day">
                  <div className="calendar-day-header">{formatDayHeader(d)}</div>
                  <div className="calendar-day-body">
                    {items.length === 0 ? (
                      <div className="muted">Sin tareas</div>
                    ) : (
                      items.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`calendar-task ${t.status === "PENDING" ? "pending" : "submitted"}`}
                          onClick={() => openTaskModal(t)}
                        >
                          <div className="ct-title">{t.title}</div>
                          <div className="ct-meta">
                            {t.status === "PENDING" ? "Pendiente" : "Entregada"}
                            {t.course_name ? ` • ${t.course_name}` : ""}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Recomendaciones de IA para organizar tareas */}
          {selectedStudent && filteredTasks.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <TaskRecommendations 
                studentExternalId={String(selectedStudent.id_estudiante)}
              />
            </div>
          )}
        </div>
        <div className="fam-sidebar" />
      </div>
      
      {/* Modal de entrega (visual) */}
      <TaskSubmissionModal
        open={modalOpen}
        task={selectedTask}
        onClose={closeTaskModal}
        onSubmitted={async () => {
          if (!selectedStudent) return;
          const list = await getStudentTasks(selectedStudent.id_estudiante, from, to);
          setTasks(list);
        }}
      />
    </div>
  );
};

export default WeeklyTasksPage;
