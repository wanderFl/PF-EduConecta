import React, { useEffect, useState, useRef } from "react";
import type { TeacherConversation, ConversationMessage } from "../../services/communications";
import { 
  getConversationMessages, 
  sendMessage, 
  uploadTeacherAttachment, 
  getFileDownloadUrl 
} from "../../services/communications";

type Props = {
  conversation: TeacherConversation | null;
  currentUserId: string;
};

const TeacherConversationPanel: React.FC<Props> = ({ conversation }) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar mensajes cuando cambia la conversación
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const msgs = await getConversationMessages(conversation.id);
        setMessages(msgs);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversation]);

  // Scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

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

  const handleSend = async () => {
    if (!conversation) return;
    if (!newMessage.trim() && !file) return;
    if (sending) return;

    setSending(true);
    try {
      const attachments: { url: string; file_name: string; mime_type: string; size_bytes: number }[] = [];

      if (file) {
        // Upload logic
        const uploaded = await uploadTeacherAttachment(conversation.id, file);
        attachments.push(uploaded);
      }

      const finalBody = newMessage.trim() || (file ? "📎 Archivo adjunto" : "");

      const sent = await sendMessage(conversation.id, { 
        body: finalBody,
        attachments
      });
      
      setMessages(prev => [...prev, sent]);
      setNewMessage("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#9ca3af',
        fontSize: '1.1rem'
      }}>
        Selecciona una conversación para ver los mensajes
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <h3 style={{ margin: 0, color: '#111827' }}>
          {conversation.student_name}
        </h3>
        {conversation.subject && (
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            {conversation.subject}
          </p>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        backgroundColor: '#f9fafb'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
            No hay mensajes todavía. Inicia la conversación.
          </div>
        ) : (
          messages.map((msg) => {
            // El docente es quien envía (sender_role = 'TEACHER')
            const isTeacher = msg.sender_role === 'TEACHER';
            const time = new Date(msg.createdAt);

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isTeacher ? 'flex-end' : 'flex-start',
                  marginBottom: '1rem'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: isTeacher ? '#3b82f6' : 'white',
                  color: isTeacher ? 'white' : '#1f2937',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    {isTeacher ? 'Docente (Tú)' : 'Padre/Madre'}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.body}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ marginTop: "8px" }}>
                        {msg.attachments.map((att, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              background: "rgba(0,0,0,0.05)", 
                              padding: "4px 8px", 
                              borderRadius: "4px",
                              marginTop: "4px",
                              fontSize: "0.9em",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px"
                            }}
                          >
                            <span>📎 {att.file_name}</span>
                            <button
                              onClick={(e) => handleDownload(e, att.url)}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "inherit",
                                textDecoration: "underline",
                                cursor: "pointer",
                                fontSize: "inherit",
                                padding: 0
                              }}
                            >
                              Descargar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    opacity: 0.7
                  }}>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '1rem',
        borderTop: '2px solid #e5e7eb',
        backgroundColor: 'white'
      }}>
        {file && (
          <div style={{ 
            marginBottom: '0.5rem', 
            padding: '0.5rem', 
            backgroundColor: '#eff6ff', 
            borderRadius: '4px',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#1d4ed8' }}>📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            <button 
              onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#1d4ed8' }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <input
             type="file"
             ref={fileInputRef}
             style={{ display: "none" }}
             onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            title="Adjuntar archivo"
            style={{
              padding: '0.75rem',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: sending ? 'not-allowed' : 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1
            }}
          >
            📎
          </button>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            disabled={sending}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem',
              resize: 'none',
              minHeight: '44px',
              height: '44px',
              maxHeight: '120px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={handleSend}
            disabled={(!newMessage.trim() && !file) || sending}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: sending || (!newMessage.trim() && !file) ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: sending || (!newMessage.trim() && !file) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              height: '44px'
            }}
          >
            {sending ? '...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherConversationPanel;
