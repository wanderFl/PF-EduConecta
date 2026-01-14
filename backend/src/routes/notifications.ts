import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Almacenamiento temporal en memoria (reemplazar con base de datos)
interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: Date;
  data?: any;
}

// Almacén temporal (en producción usar una tabla en la BD)
const notificationsStore: Notification[] = [];

/**
 * GET /api/notifications
 * Obtener todas las notificaciones del usuario autenticado
 */
router.get('/', authenticate, (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Filtrar notificaciones del usuario
    const userNotifications = notificationsStore
      .filter(n => n.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    res.json(userNotifications);
  } catch (error) {
    console.error('[Notifications] Error fetching notifications:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

/**
 * POST /api/notifications/mark-read/:id
 * Marcar una notificación como leída
 */
router.post('/mark-read/:id', authenticate, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const notification = notificationsStore.find(
      n => n.id === id && n.user_id === userId
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    notification.is_read = true;

    res.json({ success: true, notification });
  } catch (error) {
    console.error('[Notifications] Error marking as read:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída' });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Marcar todas las notificaciones del usuario como leídas
 */
router.post('/mark-all-read', authenticate, (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    let count = 0;
    notificationsStore.forEach(n => {
      if (n.user_id === userId && !n.is_read) {
        n.is_read = true;
        count++;
      }
    });

    res.json({ success: true, markedAsRead: count });
  } catch (error) {
    console.error('[Notifications] Error marking all as read:', error);
    res.status(500).json({ error: 'Error al marcar todas como leídas' });
  }
});

/**
 * POST /api/notifications/create (interno - para otros servicios)
 * Crear una nueva notificación
 */
router.post('/create', authenticate, (req: Request, res: Response) => {
  try {
    const { user_id, title, body, data } = req.body;

    if (!user_id || !title || !body) {
      return res.status(400).json({ 
        error: 'user_id, title y body son requeridos' 
      });
    }

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id,
      title,
      body,
      is_read: false,
      created_at: new Date(),
      data: data || {}
    };

    notificationsStore.push(notification);

    res.json({ success: true, notification });
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error);
    res.status(500).json({ error: 'Error al crear notificación' });
  }
});

export default router;
