import React, { useEffect, useState } from "react";
import type { PendingTask } from "../../types";
import { getPendingTasks } from "../../services/familia";
 import { formatDateUTC } from "../../utils/dates";

const PendingTasksPanel: React.FC<{ studentId: number }> = ({ studentId }) => {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getPendingTasks(studentId).then(res => {
      if (mounted) {
        setTasks(res ?? []);
        setLoading(false);
      }
    }).catch(() => setLoading(false));
    return () => { mounted = false; };
  }, [studentId]);

  return (
    <aside className="pending-panel">
      <h3>Tareas Pendientes</h3>
      {loading ? (
        <div className="muted">Cargando...</div>
      ) : tasks.length === 0 ? (
        <div className="empty">🎉 ¡No tienes tareas pendientes!</div>
      ) : (
        <ul className="pending-list">
          {tasks.slice(0, 5).map(t => (
            <li key={t.id} className="pending-item">
              <div className="pt-title">{t.title}</div>
              <div className="pt-meta">
                <span>{t.course_name ?? "Curso"}</span>
                <span>vence {formatDateUTC(t.due_date)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {tasks.length > 5 && <button className="see-more" disabled>Ver más…</button>}
    </aside>
  );
};

export default PendingTasksPanel;
