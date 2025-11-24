import React, { useEffect, useState, useRef } from "react";
import type { TeacherConversation, ConversationMessage } from "../../services/communications";
import { getConversationMessages, sendMessage } from "../../services/communications";

type Props = {
  conversation: TeacherConversation | null;
  currentUserId: string;
};

const TeacherConversationPanel: React.FC<Props> = ({ conversation, currentUserId }) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
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

  const handleSend = async () => {
    if (!conversation || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const sent = await sendMessage(conversation.id, { body: newMessage.trim() });
      setMessages(prev => [...prev, sent]);
      setNewMessage("");
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
            const isOwn = msg.sender_role === 'DOCENTE' && msg.sender_id === currentUserId;
            const time = new Date(msg.created_at);

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  marginBottom: '1rem'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: isOwn ? '#3b82f6' : 'white',
                  color: isOwn ? 'white' : '#1f2937',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    {msg.sender_role === 'DOCENTE' ? 'Docente' : 'Padre/Madre'}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.body}
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              minHeight: '60px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: sending || !newMessage.trim() ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherConversationPanel;
