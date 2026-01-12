import React from "react";
import { useNavigate } from "react-router-dom";

const items = [
  { key: "tareas", label: "Tareas", icon: "📖" },
  { key: "calificaciones", label: "Calificaciones", icon: "📝" },
  { key: "comunicados", label: "Comunicados", icon: "💬" },
  { key: "asistencia", label: "Asistencia", icon: "📊" },
  { key: "reportes", label: "Reportes", icon: "📋" },
];

const ActionGrid: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = (key: string) => {
    if (key === "tareas") return navigate("/familia/tareas");
    if (key === "asistencia") return navigate("/familia/asistencia");
    if (key === "comunicados") return navigate("/familia/comunicados");
    if (key === "calificaciones") return navigate("/familia/calificaciones");
    if (key === "reportes") return navigate("/familia/reportes");
    // Otros: implementar pronto…
  };

  return (
    <section className="action-grid">
      {items.map((it) => (
        <button
          className="action-tile"
          key={it.key}
          type="button"
          onClick={() => handleClick(it.key)}
        >
          <div className="tile-icon">{it.icon}</div>
          <div className="tile-label">{it.label}</div>
        </button>
      ))}
    </section>
  );
};

export default ActionGrid;
