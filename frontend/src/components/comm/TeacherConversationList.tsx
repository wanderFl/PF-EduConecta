import React from "react";
import type { TeacherConversation } from "../../services/communications";

type Props = {
  items: TeacherConversation[];
  selectedId?: string | null;
  onSelect: (c: TeacherConversation) => void;
};

const TeacherConversationList: React.FC<Props> = ({ items, selectedId, onSelect }) => {
  if (!items.length) {
    return (
      <div className="empty" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        No tienes conversaciones todavía.
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Busca un estudiante para iniciar una conversación.
        </p>
      </div>
    );
  }

  return (
    <ul className="conv-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map(c => {
        const when = new Date(c.lastMessageAt);
        const isSelected = selectedId === c.id;
        
        return (
          <li
            key={c.id}
            className={`conv-item ${isSelected ? "active" : ""}`}
            onClick={() => onSelect(c)}
            style={{
              padding: '1rem',
              borderBottom: '1px solid #e2e8f0',
              cursor: 'pointer',
              backgroundColor: isSelected ? '#f0f4ff' : 'white',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: '#e0e7ff',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#4f46e5'
                }}>
                  {c.kind === 'THREAD' ? 'Hilo' : 'Aviso'}
                </span>
                {c.is_behavioral_note && (
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: '#fee2e2',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#dc2626'
                  }}>
                    Conducta
                  </span>
                )}
                {c.archived_by_teacher && (
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: '#f3f4f6',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    Archivada
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {when.toLocaleDateString()} {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#1f2937' }}>Estudiante:</strong>{' '}
              <span style={{ color: '#4b5563' }}>{c.student_name}</span>
            </div>

            {c.subject && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: '#1f2937' }}>Asunto:</strong>{' '}
                <span style={{ color: '#4b5563' }}>{c.subject}</span>
              </div>
            )}

            {c.lastMessagePreview && (
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {c.lastMessagePreview}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default TeacherConversationList;
