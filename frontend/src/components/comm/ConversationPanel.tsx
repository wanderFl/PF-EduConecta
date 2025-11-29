// src/components/comm/ConversationPanel.tsx
import React, { useEffect, useRef, useState } from "react";
import type { Conversation, ConversationMessage } from "../../types";
import { listConversationMessages, postConversationMessage } from "../../services/comm";
import { getStudentName, getTeacherName } from "../../services/ceiaf";

type Props = {
  conversation: Conversation | null;
};

const ConversationPanel: React.FC<Props> = ({ conversation }) => {
  const [msgs, setMsgs] = useState<ConversationMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [studentName, setStudentName] = useState<string>("");
  const [teacherName, setTeacherName] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement>(null);

  // Cargar nombres reales cuando cambia la conversación
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!conversation) return;
      try {
        const [sName, tName] = await Promise.all([
          getStudentName(conversation.student_external_id).catch(() => `Estudiante #${conversation.student_external_id}`),
          getTeacherName(conversation.teacher_external_id).catch(() => `Docente #${conversation.teacher_external_id}`),
        ]);
        if (!cancel) {
          setStudentName(sName);
          setTeacherName(tName);
        }
      } catch {
        /* noop */
      }
    })();
    return () => { cancel = true; };
  }, [conversation?.student_external_id, conversation?.teacher_external_id]);

  // Cargar últimos mensajes
  useEffect(() => {
    (async () => {
      if (!conversation) return;
      setLoading(true);
      try {
        const res = await listConversationMessages(conversation.id, { limit: 30 });
        setMsgs(res.messages);
        setCursor(res.nextCursor ?? null);
      } finally {
        setLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      }
    })();
  }, [conversation?.id]);

  const loadMore = async () => {
    if (!conversation || !cursor) return;
    setLoading(true);
    try {
      const res = await listConversationMessages(conversation.id, { limit: 30, cursor });
      setMsgs(prev => [...prev, ...res.messages]);
      setCursor(res.nextCursor ?? null);
    } finally {
      setLoading(false);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation || !body.trim()) return;
    const text = body.trim();
    setBody("");
    await postConversationMessage(conversation.id, { body: text });
    const res = await listConversationMessages(conversation.id, { limit: 30 });
    setMsgs(res.messages);
    setCursor(res.nextCursor ?? null);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  if (!conversation) {
    return <div className="empty">Selecciona una conversación para ver los mensajes.</div>;
  }

  const isThread = conversation.kind === "THREAD";

  return (
    <div className="conv-panel">
      <div className="conv-header">
        <div className="conv-title">
          {isThread ? `Hilo con ${teacherName || "docente"}` : "Aviso institucional"}
          {conversation.is_behavioral_note && <span className="tag red">Conducta</span>}
        </div>
        <div className="muted">
          Estudiante • {studentName || `Estudiante #${conversation.student_external_id}`} 
        </div>
      </div>

      <div className="conv-messages">
        {cursor && (
          <button className="chip" onClick={loadMore} disabled={loading}>
            {loading ? "Cargando..." : "Cargar mensajes anteriores"}
          </button>
        )}

        {msgs.map(m => (
          <div key={m.id} className={`msg ${m.sender_role === "PARENT" ? "me" : "them"}`}>
            <div className="msg-body">{m.body}</div>
            <div className="msg-meta">
              {m.sender_role === "PARENT" ? "Tú" : "Docente"} • {new Date(m.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="conv-composer" onSubmit={send}>
        <input
          className="chat-input"
          placeholder="Escribe un mensaje…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit" className="ts-btn primary" disabled={!body.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
};

export default ConversationPanel;
