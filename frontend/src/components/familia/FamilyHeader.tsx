import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import type { CeiafStudent } from "../../types";
import { notificationService } from "../../services/notifications";
type Props = {
  parentName: string;
  students: CeiafStudent[];
  selected?: CeiafStudent | null;
  onChangeStudent: (id_estudiante: number) => void;
  onOpenAddChild?: () => void;
};

const FamilyHeader: React.FC<Props> = ({
  parentName,
  students,
  selected,
  onChangeStudent,
  onOpenAddChild,
}) => {
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const notifications = await notificationService.getNotifications();
        const unread = notifications.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (error: any) {
        // Silenciar errores de red
        setUnreadCount(0);
      }
    };
    
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="fam-header">
      <div className="fam-header-left">
        <div className="avatar-initials">{parentName?.slice(0, 2).toUpperCase()}</div>
        <div className="parent-name" title={parentName}>{parentName}</div>
      </div>

      <div className="fam-header-center">
        <select
          className="student-select"
          value={selected?.id_estudiante ?? ""}
          onChange={(e) => onChangeStudent(Number(e.target.value))}
        >
          {students.map((s) => (
            <option key={s.id_estudiante} value={s.id_estudiante}>
              {`${s.nombres} ${s.apellidos}`}{" "}
              {s.curso_nombre ? `- ${s.curso_nombre}${s.curso_paralelo ? ` ${s.curso_paralelo}` : ""}` : ""}
            </option>
          ))}
        </select>
        {onOpenAddChild && (
          <button className="add-child-btn" onClick={onOpenAddChild} title="Agregar hijo">＋</button>
        )}
      </div>

      <div className="fam-header-right">
        <button 
          className="notification-btn" 
          onClick={handleNotificationClick}
          title="Notificaciones"
          style={{ position: 'relative', marginRight: '10px' }}
        >
          🔔
          {unreadCount > 0 && (
            <span className="notification-badge" style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#e74c3c',
              color: 'white',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button className="logout-btn" onClick={logout}>⏻ Cerrar sesión</button>
      </div>
    </header>
  );
};

export default FamilyHeader;
