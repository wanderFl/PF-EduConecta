// src/components/directivo/DirectivoTaskDetailModal.tsx
import React from "react";
import type { StudentTaskRow } from "../../types";
import { getSubmissionDownloadUrl } from "../../services/directivo"; // 👈 aquí

interface Props {
  task: StudentTaskRow | null;
  onClose: () => void;
}

const DirectivoTaskDetailModal: React.FC<Props> = ({ task, onClose }) => {
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
  const handleOpenFile = async () => {
      if (!task.file_url) return;

      try {
        const url = await getSubmissionDownloadUrl(task.file_url);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        console.error(e);
        alert("No se pudo abrir el archivo de la tarea.");
      }
    };
  const periodo =
    task.trimestre != null
      ? `${task.trimestre}º Trimestre · Aporte ${task.aporte ?? "—"}`
      : "—";

  return (
    <div className="dir-modal-backdrop">
      <div className="dir-modal">
        <div className="dir-modal-header">
          <div>
            <div className="dir-modal-title">{task.title}</div>
            <div className="dir-modal-sub">{periodo}</div>
          </div>
          <button className="dir-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="dir-modal-body">
          <div className="dir-modal-row">
            <span className="label">Fecha entrega:</span>
            <span>{formatDate(task.due_date)}</span>
          </div>
          <div className="dir-modal-row">
            <span className="label">Fecha envío:</span>
            <span>{formatDate(task.submitted_at)}</span>
          </div>
          <div className="dir-modal-row">
            <span className="label">Calificación:</span>
            <span>{task.grade != null ? task.grade.toFixed(2) : "—"}</span>
          </div>

          <div className="dir-modal-block">
            <div className="label">Instrucciones de la tarea</div>
            <div className="dir-modal-text">
              {task.instructions?.trim()
                ? task.instructions
                : "No se registraron instrucciones para esta tarea."}
            </div>
          </div>

          <div className="dir-modal-block">
            <div className="label">Archivo enviado</div>
            {task.file_url ? (
              <button
                type="button"
                className="dir-link-button"
                onClick={handleOpenFile}
              >
                Ver archivo enviado
              </button>
            ) : (
              <div className="dir-modal-text">
                El estudiante no adjuntó ningún archivo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectivoTaskDetailModal;
