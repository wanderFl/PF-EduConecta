import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFamily } from "../contexts/useFamily";
import { useAuth } from "../hooks/useAuth";
import FamilyHeader from "../components/familia/FamilyHeader";
import { getLinkedChildren } from "../services/familia";
import { listParentConversations, createParentConversation } from "../services/comm";
import { searchTeachersForStudent, type TeacherSearchResult } from "../services/comm"; // 👈
import ConversationList from "../components/comm/ConversationList";
import ConversationPanel from "../components/comm/ConversationPanel";
import type { CeiafStudent, Conversation } from "../types";
import "./familia.css";
import { useNavigate } from "react-router-dom";

const CommunicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedStudent, setSelectedStudent } = useFamily();
  const [students, setStudents] = useState<CeiafStudent[]>([]);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  // búsqueda
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TeacherSearchResult[]>([]);
  const debounceRef = useRef<number | null>(null);

  const parentName = useMemo(() => user?.email?.split("@")[0] ?? "Familia", [user]);

  useEffect(() => {
    (async () => {
      const list = await getLinkedChildren();
      setStudents(list);
      if (!selectedStudent && list.length > 0) setSelectedStudent(list[0]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cargar conversaciones cuando cambia estudiante
  useEffect(() => {
    (async () => {
      if (!selectedStudent) return;
      const res = await listParentConversations();
      setConvs(res ?? []);
      // limpiar selección si ya no corresponde
      setSelectedConv(null);
    })();
  }, [selectedStudent?.id_estudiante]);

  // debounce búsqueda
  useEffect(() => {
    if (!selectedStudent) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }

    debounceRef.current = window.setTimeout(async () => {
      const found = await searchTeachersForStudent(selectedStudent.id_estudiante, query.trim());
      setResults(found);
    }, 300);

    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query, selectedStudent?.id_estudiante]);

  const handleChangeStudent = (id: number) => {
    const s = students.find(st => st.id_estudiante === id) ?? null;
    setSelectedStudent(s);
    setQuery("");
    setResults([]);
  };

  const openOrCreateConversation = async (t: TeacherSearchResult) => {
    if (!selectedStudent) return;

    // Buscar si ya existe conv con ese docente y ese estudiante
    const existing = convs.find(
      c => c.teacher_external_id === t.teacher_external_id &&
           c.student_external_id === selectedStudent.id_estudiante &&
           c.kind === "THREAD"
    );
    if (existing) {
      setSelectedConv(existing);
      setQuery("");
      setResults([]);
      return;
    }

    // Crear conversacion nueva
    const created = await createParentConversation({
      kind: "THREAD",
      student_external_id: selectedStudent.id_estudiante,
      teacher_external_id: t.teacher_external_id,
      subject: null,
      is_behavioral_note: false,
    });

    // Refrescar lista y seleccionar la nueva
    const refreshed = await listParentConversations();
    setConvs(refreshed ?? []);
    const justCreated = refreshed?.find(c => c.id === created.id) ?? null;
    setSelectedConv(justCreated);
    setQuery("");
    setResults([]);
  };

  return (
  <div className="fam-layout">
    <FamilyHeader
      parentName={parentName}
      students={students}
      selected={selectedStudent}
      onChangeStudent={handleChangeStudent}
      onOpenAddChild={() => {}}
    />
    
    <nav className="fam-breadcrumb" style={{ margin: "8px" }}>
            <span className="crumb-link" onClick={() => navigate("/familia")}>Inicio</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Comunicados</span>
     </nav>
    {/* Encabezado de la sección */}
    <section className="student-info-card" style={{ margin: "16px" }}>
      <div className="sic-title">Comunicados</div>
      <div className="muted">Escribe a los docentes de las materias de tu hijo.</div>
    </section>

    {/* NUEVO: layout de dos columnas tipo WhatsApp */}
    <div className="comm-layout" style={{ margin: "0 16px 16px" }}>
      {/* LADO IZQUIERDO: búsqueda + lista */}
      <aside className="comm-sidebar">
        <div className="comms-search-wrap">
          <input
            type="search"
            className="conv-search"
            placeholder="Buscar docente por nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {query && results.length > 0 && (
            <div className="search-results">
              {results.map((r) => (
                <button
                  key={`${r.teacher_external_id}-${r.subject}`}
                  type="button"
                  className="search-result-item"
                  onClick={() => openOrCreateConversation(r)}
                >
                  <div className="sr-title">{r.teacher_name}</div>
                  <div className="muted">{r.subject}</div>
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="empty">No se encontraron docentes.</div>
          )}
        </div>

        {/* Lista de conversaciones */}
        <ConversationList
          items={convs}
          selectedId={selectedConv?.id ?? null}
          onSelect={setSelectedConv}
          onArchive={async () => {
            // si mantienes archivar, pon aquí tu handler
          }}
        />
      </aside>

      {/* LADO DERECHO: panel de conversación */}
      <section className="comm-main">
        <ConversationPanel conversation={selectedConv} />
      </section>
    </div>
  </div>
);

};

export default CommunicationsPage;
