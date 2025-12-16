// Simple event emitter for notifications (future-proofing)
type NotificationType = 'new-comment' | 'comment-reply' | 'comment-edit' | 'comment-delete';

interface NotificationPayload {
  itemType: string;
  itemId: string;
  commentId?: string;
  parentId?: string;
}

type NotificationListener = (type: NotificationType, payload: NotificationPayload) => void;

const listeners: NotificationListener[] = [];

export const triggerNotification = (type: NotificationType, payload: NotificationPayload) => {
  listeners.forEach(listener => listener(type, payload));
  // Log for debugging in development
  if (import.meta.env.DEV) {
    console.log('[Notification]', type, payload);
  }
};

export const onNotification = (listener: NotificationListener) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
};
