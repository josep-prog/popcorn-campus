// Push Notification Server for Campus Popcorn
// This file shows how to send push notifications from your server
// You can integrate this into your existing backend or use it as a reference

const webpush = require('web-push');

// Your VAPID keys (from .env file)
const VAPID_PUBLIC_KEY = 'BLx3bLGxwnA53n6oRDFOg9-gKQtZeG3WRDKuf3Jwd0rvPmoEdvpdg87_JjED2mCGPvKBZqwwMr497iupAPzaEf8';
const VAPID_PRIVATE_KEY = 'TIdYVCaBxDyswrb_0nVaDMakiH7QScjK0OUXB3JaZg8';
const VAPID_EMAIL = 'mailto:your-email@example.com'; // Replace with your email

// Configure web-push
webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Function to send push notification to a user
async function sendPushNotification(userId, notification) {
  try {
    // Get user's push subscription from database
    const { data: subscription, error } = await supabase
      .from('user_push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      console.log(`No push subscription found for user ${userId}`);
      return false;
    }

    // Send the notification
    const result = await webpush.sendNotification(
      subscription.subscription,
      JSON.stringify(notification)
    );

    console.log(`Push notification sent to user ${userId}:`, result);
    return true;
  } catch (error) {
    console.error(`Failed to send push notification to user ${userId}:`, error);
    return false;
  }
}

// Function to send order status notification
async function sendOrderStatusNotification(userId, orderId, status) {
  const messages = {
    'pending': {
      title: 'Order Received! 🍿',
      body: 'Your popcorn order has been received and is being prepared.',
      icon: '/icon-192x192.png',
      badge: '/favicon-32x32.png',
      tag: `order-${orderId}`,
      data: { orderId, status },
      actions: [
        {
          action: 'view',
          title: 'View Order',
          icon: '/favicon-32x32.png'
        }
      ]
    },
    'preparing': {
      title: 'Order in Progress 👨‍🍳',
      body: 'Your popcorn is being prepared with love!',
      icon: '/icon-192x192.png',
      badge: '/favicon-32x32.png',
      tag: `order-${orderId}`,
      data: { orderId, status }
    },
    'ready': {
      title: 'Order Ready! 🚀',
      body: 'Your popcorn is ready for pickup or delivery!',
      icon: '/icon-192x192.png',
      badge: '/favicon-32x32.png',
      tag: `order-${orderId}`,
      data: { orderId, status }
    },
    'delivered': {
      title: 'Order Delivered! ✅',
      body: 'Your popcorn has been delivered. Enjoy!',
      icon: '/icon-192x192.png',
      badge: '/favicon-32x32.png',
      tag: `order-${orderId}`,
      data: { orderId, status }
    },
    'cancelled': {
      title: 'Order Cancelled ❌',
      body: 'Your order has been cancelled. Contact support if this was unexpected.',
      icon: '/icon-192x192.png',
      badge: '/favicon-32x192.png',
      tag: `order-${orderId}`,
      data: { orderId, status }
    }
  };

  const notification = messages[status] || {
    title: 'Order Update',
    body: `Your order status has been updated to: ${status}`,
    icon: '/icon-192x192.png',
    badge: '/favicon-32x32.png',
    tag: `order-${orderId}`,
    data: { orderId, status }
  };

  return await sendPushNotification(userId, notification);
}

// Function to send promotional notification
async function sendPromotionalNotification(userId, title, body) {
  const notification = {
    title,
    body,
    icon: '/icon-192x192.png',
    badge: '/favicon-32x32.png',
    tag: 'promotion',
    data: { type: 'promotion' },
    actions: [
      {
        action: 'order',
        title: 'Order Now',
        icon: '/favicon-32x32.png'
      }
    ]
  };

  return await sendPushNotification(userId, notification);
}

// Example usage in your order update handler
async function updateOrderStatus(orderId, newStatus) {
  try {
    // Update order in database
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select('user_id')
      .single();

    if (error) {
      throw error;
    }

    // Send push notification
    if (order.user_id) {
      await sendOrderStatusNotification(order.user_id, orderId, newStatus);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update order status:', error);
    return { success: false, error: error.message };
  }
}

// Export functions for use in your backend
module.exports = {
  sendPushNotification,
  sendOrderStatusNotification,
  sendPromotionalNotification,
  updateOrderStatus
};

// Example: Send notification when order status changes
// updateOrderStatus('order-id-here', 'ready');
