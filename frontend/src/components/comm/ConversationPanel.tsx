// src/components/comm/ConversationPanel.tsx
import React, { useEffect, useRef, useState } from "react";
import type { Conversation, ConversationMessage } from "../../types";
import { listConversationMessages, postConversationMessage } from "../../services/comm";
import { getStudentName, getTeacherName } from "../../services/ceiaf";
import { uploadConversationAttachment, getFileDownloadUrl } from "../../services/uploads";

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

  // Estado para adjuntos
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const handleDownload = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    try {
      const downloadUrl = await getFileDownloadUrl(url);
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error("Error descargando archivo:", err);
      alert("No se pudo descargar el archivo.");
    }
  };

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation) return;
    if (!body.trim() && !file) return;

    const text = body.trim();
    
    try {
      setUploading(true);
      const attachments: { url: string; file_name: string; mime_type: string; size_bytes: number }[] = [];

      if (file) {
        // Subir archivo
        const uploaded = await uploadConversationAttachment(
          conversation.student_external_id,
          conversation.id,
          file
        );
        attachments.push({
          url: uploaded.url,
          file_name: uploaded.file_name,
          mime_type: uploaded.mime_type,
          size_bytes: uploaded.size_bytes
        });
      }

      const finalBody = text || (file ? "📎 Archivo adjunto" : "");

      await postConversationMessage(conversation.id, { 
        body: finalBody,
        attachments
      });

      setBody("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      const res = await listConversationMessages(conversation.id, { limit: 30 });
      setMsgs(res.messages);
      setCursor(res.nextCursor ?? null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      alert("Error al enviar el mensaje. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
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
            <div className="msg-body">
              {m.body}
              {m.attachments && m.attachments.length > 0 && (
                <div className="msg-attachments" style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
                  {m.attachments.map((att, i) => (
                    <div key={i}>
                      <a 
                        href="#" 
                        onClick={(e) => handleDownload(e, att.url)}
                        style={{ color: "inherit", textDecoration: "underline", cursor: "pointer" }}
                      >
                        📎 {att.file_name || "Archivo adjunto"}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="msg-meta">
              {m.sender_role === "PARENT" ? "Tú" : "Docente"} • {new Date(m.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="conv-composer" onSubmit={send} style={{ flexDirection: "column", alignItems: "stretch" }}>
        {file && (
          <div className="file-preview" style={{ padding: "4px 8px", background: "#f0f0f0", marginBottom: "4px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.9em" }}>📎 {file.name}</span>
            <button 
              type="button" 
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <button 
            type="button" 
            className="ts-btn secondary" 
            onClick={() => fileInputRef.current?.click()}
            title="Adjuntar archivo"
            style={{ padding: "0 12px" }}
          >
            📎
          </button>
          <input
            className="chat-input"
            placeholder="Escribe un mensaje…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={uploading}
            style={{ flex: 1 }}
          />
          <button type="submit" className="ts-btn primary" disabled={(!body.trim() && !file) || uploading}>
            {uploading ? "..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConversationPanel;
