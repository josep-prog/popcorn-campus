import { supabase } from './supabase';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('This browser does not support service workers');
        return false;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');

      // Request notification permission
      this.permission = await this.requestPermission();
      
      return this.permission === 'granted';
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (this.permission === 'granted') {
      return this.permission;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration || this.permission !== 'granted') {
      return null;
    }

    try {
      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('This browser does not support push messaging');
        return null;
      }

      // Get existing subscription
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        
        if (!vapidPublicKey) {
          console.warn('VAPID public key not found. Push notifications will not work.');
          return null;
        }

        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        console.warn('No authenticated user found');
        return;
      }

      // Store subscription in your database
      const { error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.user.id,
          subscription: subscription.toJSON(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save push subscription:', error);
      } else {
        console.log('Push subscription saved successfully');
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      if (this.registration) {
        // Use service worker to show notification
        await this.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/favicon-32x32.png',
          tag: payload.tag || 'campus-popcorn',
          data: payload.data,
          actions: payload.actions,
          requireInteraction: true,
          silent: false
        });
      } else {
        // Fallback to browser notification
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          tag: payload.tag || 'campus-popcorn'
        });
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async sendOrderNotification(orderId: string, status: string): Promise<void> {
    const messages = {
      'pending': {
        title: 'Order Received! 🍿',
        body: 'Your popcorn order has been received and is being prepared.'
      },
      'preparing': {
        title: 'Order in Progress 👨‍🍳',
        body: 'Your popcorn is being prepared with love!'
      },
      'ready': {
        title: 'Order Ready! 🚀',
        body: 'Your popcorn is ready for pickup or delivery!'
      },
      'delivered': {
        title: 'Order Delivered! ✅',
        body: 'Your popcorn has been delivered. Enjoy!'
      },
      'cancelled': {
        title: 'Order Cancelled ❌',
        body: 'Your order has been cancelled. Contact support if this was unexpected.'
      }
    };

    const message = messages[status as keyof typeof messages] || {
      title: 'Order Update',
      body: `Your order status has been updated to: ${status}`
    };

    await this.showLocalNotification({
      ...message,
      tag: `order-${orderId}`,
      data: { orderId, status },
      actions: [
        {
          action: 'view',
          title: 'View Order',
          icon: '/favicon-32x32.png'
        }
      ]
    });
  }

  async sendWelcomeNotification(): Promise<void> {
    await this.showLocalNotification({
      title: 'Welcome to Campus Popcorn! 🍿',
      body: 'You can now receive order updates and notifications.',
      tag: 'welcome'
    });
  }

  async sendPromotionalNotification(title: string, body: string): Promise<void> {
    await this.showLocalNotification({
      title,
      body,
      tag: 'promotion',
      actions: [
        {
          action: 'order',
          title: 'Order Now',
          icon: '/favicon-32x32.png'
        }
      ]
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }

  async unsubscribe(): Promise<void> {
    if (this.registration) {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
      }
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Helper functions for easy use
export const initializeNotifications = () => notificationService.initialize();
export const subscribeToNotifications = () => notificationService.subscribeToPushNotifications();
export const showNotification = (payload: NotificationPayload) => notificationService.showLocalNotification(payload);
export const sendOrderNotification = (orderId: string, status: string) => notificationService.sendOrderNotification(orderId, status);
export const sendWelcomeNotification = () => notificationService.sendWelcomeNotification();
export const sendPromotionalNotification = (title: string, body: string) => notificationService.sendPromotionalNotification(title, body);
