import React, { useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { requestFcmToken, registerDeviceToken } from '../services/notifications';

// Apuntar al backend
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'], // Intentar WebSocket primero si es posible
  reconnectionAttempts: 5
});

const NotificationListener: React.FC = () => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = React.useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );
  
  const isSecure = window.isSecureContext;

  useEffect(() => {
    if (user?.id) {
      if (!socket.connected) socket.connect();
      
      socket.emit('join', user.id);
      console.log('🔌 Socket: Intenta conectar para usuario:', user.id);

      const handleNotification = (data: any) => {
        console.log('🔔 Notificación recibida:', data);
        alert(`🔔 ${data.title}\n${data.message}`);
        if (Notification.permission === 'granted') {
           new Notification(data.title, { body: data.message });
        }
      };

      socket.on('notification', handleNotification);
      
      // Auto-registro si ya existen permisos y está en contexto seguro
      if (Notification.permission === 'granted' && isSecure) {
        registerToken();
      }

      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [user]);

  const registerToken = () => {
    console.log('📥 Intentando obtener token FCM...');
    requestFcmToken().then(token => {
      if (token) {
        setPermissionStatus('granted');
      }
    }).catch(err => {
        console.warn("FCM Error Completo:", err);
        
        // Detección específica: Permiso visual OK pero bloqueo técnico
        if (err.name === 'NotAllowedError' || err.code === 'messaging/permission-blocked') {
            alert("⚠️ Error de Privacidad en Edge/Windows\n\nEl navegador tiene permiso visual, pero bloqueó la generación del token.\n\nCausas probables:\n1. Modo 'Estricto' de privacidad en Edge.\n2. Notificaciones desactivadas en Windows.\n3. Cookies de terceros bloqueadas.");
            setPermissionStatus('denied');
        } else if (err.message && (err.message.includes("permission denied") || err.message.includes("blocked"))) {
            setPermissionStatus('denied');
        }
    });
  };

  const handleRequestPermission = () => {
    if (!isSecure) {
        alert("Las notificaciones requieren HTTPS o localhost.");
        return;
    }
    
    Notification.requestPermission().then(permission => {
      setPermissionStatus(permission);
      if (permission === 'granted') {
        registerToken();
      }
    });
  };

  if (!user?.id || !('Notification' in window)) return null;

  // Aviso de contexto inseguro (solo logs por ahora para no molestar)
  if (!isSecure) return null;

  // Si está denegado
  if (permissionStatus === 'denied') {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px',
        backgroundColor: '#ef4444', color: 'white', padding: '12px 16px',
        borderRadius: '8px', zIndex: 9999, fontSize: '14px',
        display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '300px'
      }}>
        <span>🚫 Permiso denegado. Haz clic en el candado/ajustes de la URL para desbloquear.</span>
        <button onClick={() => setPermissionStatus('default')} 
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
      </div>
    );
  }

  // Si está granted, no mostrar nada
  if (permissionStatus === 'granted') return null;

  // Si está default, mostrar botón azul
  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px',
      backgroundColor: '#2563eb', color: 'white', padding: '12px 16px',
      borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      zIndex: 9999, alignItems: 'center', gap: '8px', fontSize: '14px',
      display: 'flex'
    }}>
      <span>🔔 Activar notificaciones</span>
      <button 
        onClick={handleRequestPermission}
        style={{
          backgroundColor: 'white', color: '#2563eb', border: 'none',
          padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
        }}
      >
        Activar
      </button>
      <button 
        onClick={() => setPermissionStatus('granted')} // Ocultar
        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '4px' }}
      >
        ✕
      </button>
    </div>
  );
};
   

export default NotificationListener;
