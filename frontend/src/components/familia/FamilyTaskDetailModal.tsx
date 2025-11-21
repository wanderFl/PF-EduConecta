import React, { useState } from "react";
import type { GradeRow } from "../../types";
import { getSubmissionDownloadUrl } from "../../services/familia";

interface Props {
  task: GradeRow | null;
  onClose: () => void;
}

const FamilyTaskDetailModal: React.FC<Props> = ({ task, onClose }) => {
  const [loading, setLoading] = useState(false);
  if (!task) return null;

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-EC", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const periodo =
    task.trimestre != null
      ? `${task.trimestre}º Trimestre · Aporte ${task.aporte ?? "—"}`
      : "—";

  const handleOpenFile = async () => {
    if (!task.file_url || loading) return;
    try {
      setLoading(true);
      const url = await getSubmissionDownloadUrl(task.file_url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir el archivo enviado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="family-task-modal-overlay">
      <div className="family-task-modal">

        {/* Cerrar */}
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        {/* Título */}
        <div className="family-task-title">{task.task_title}</div>
        <div className="family-task-sub">
          {task.subject_name} · {periodo}
        </div>

        {/* FILA: Fechas y nota */}
        <div className="family-task-row">
          <div className="family-task-col">
            <strong>Fecha entrega:</strong>
            <span>{formatDate(task.due_date)}</span>
          </div>
          <div className="family-task-col">
            <strong>Fecha envío:</strong>
            <span>{formatDate(task.submitted_at)}</span>
          </div>
        </div>

        <div className="family-task-row">
          <div className="family-task-col">
            <strong>Calificación:</strong>
            <span>
              {task.grade != null ? task.grade.toFixed(2) : "—"}
            </span>
          </div>
          <div className="family-task-col">
            <strong>Comentarios:</strong>
            <span>{task.comments || "—"}</span>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="family-task-label">Instrucciones</div>
        <div className="family-task-text">
          {task.instructions?.trim()
            ? task.instructions
            : "No se registraron instrucciones para esta tarea."}
        </div>

        {/* Archivo */}
        <div className="family-task-label" style={{ marginTop: 16 }}>
          Archivo enviado
        </div>

        {task.file_url ? (
          <button
            type="button"
            className="family-task-download-btn"
            onClick={handleOpenFile}
            disabled={loading}
          >
            {loading ? "Abriendo…" : "Ver archivo enviado"}
          </button>
        ) : (
          <div className="family-task-no-file">
            El estudiante no adjuntó ningún archivo.
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyTaskDetailModal;
