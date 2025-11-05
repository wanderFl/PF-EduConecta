import React, { useEffect, useState } from "react";
import type { Conversation } from "../../types";
import { getTeacherName, getTeacherSubject } from "../../services/ceiaf";

type Props = {
  items: Conversation[];
  selectedId?: string | null;
  onSelect: (c: Conversation) => void;
  onArchive: (c: Conversation) => void;
};

type RowInfo = {
  teacherName: string;
  subject: string;
};

const ConversationList: React.FC<Props> = ({ items, selectedId, onSelect }) => {
  // Mapa idConv -> datos enriquecidos
  const [infoMap, setInfoMap] = useState<Record<string, RowInfo>>({});

  // Carga nombres y materias en paralelo con cache de servicios
  useEffect(() => {
    let cancel = false;
    (async () => {
      const entries = await Promise.all(
        items.map(async (c) => {
          const [tName, subj] = await Promise.all([
            getTeacherName(c.teacher_external_id),
            getTeacherSubject(c.teacher_external_id),
          ]);
          return [c.id, { teacherName: tName, subject: subj }] as const;
        })
      );
      if (!cancel) {
        const merged: Record<string, RowInfo> = {};
        entries.forEach(([id, data]) => { merged[id] = data; });
        setInfoMap(merged);
      }
    })();
    return () => { cancel = true; };
  }, [items]);

  if (!items.length) {
    return <div className="empty">No tienes conversaciones todavía.</div>;
  }

  return (
    <ul className="conv-list">
      {items.map(c => {
        const row = infoMap[c.id];
        const teacherDisplay = row?.teacherName ?? `Docente #${c.teacher_external_id}`;
        const subjectDisplay = row?.subject ?? "Materia";
        const when = c.lastMessageAt ? new Date(c.lastMessageAt) : new Date(c.createdAt);
        return (
          <li
            key={c.id}
            className={`conv-item ${selectedId === c.id ? "active" : ""}`}
            onClick={() => onSelect(c)}
          >
            <div className="conv-row1">
              <span className="conv-kind">{c.kind === "THREAD" ? "Hilo" : "Aviso"}</span>
              {c.is_behavioral_note && <span className="tag red">Conducta</span>}
              {c.archived_by_parent && <span className="tag gray">Archivada</span>}
              <span className="conv-date">{when.toLocaleString()}</span>
            </div>

            <div className="conv-row2">
              <strong>Docente:</strong> {teacherDisplay} <strong>Materia:</strong><span> {subjectDisplay}</span>
            </div>

            {c.lastMessagePreview && (
              <div className="conv-preview muted">
                {c.lastMessagePreview}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default ConversationList;
