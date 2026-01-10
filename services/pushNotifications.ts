import { ENDPOINT, PROJECT_ID } from '@/lib/appwrite';

interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  userId?: string;
  topic?: string;
}

class PushNotificationService {
  private apiKey: string;

  constructor() {
    // You'll need to set your Appwrite API key
    // This should be stored securely (environment variables)
    this.apiKey = 'standard_f46dbfc5e0f0148e125c347e92c6f598fe0913e76fe279506c73bba6743b1bb8f45ed431c9761bbc1642a5efffa92a246ce11a778cf162ae9a49eb5519dd74e064c8904ddaf77f779ab9cbf3312967aca3e168cd0f8deba88aba89bab4ff12f7cddbac63bf3dd4c0f717eacf956b67f227f620f2e26f00e03dc461f52032ef8f';
  }

  /**
   * Send a push notification to a specific user
   */
  async sendToUser(userId: string, notification: Omit<PushNotificationData, 'userId'>) {
    return this.sendNotification({
      ...notification,
      userId,
    });
  }

  /**
   * Send a push notification to a topic
   */
  async sendToTopic(topic: string, notification: Omit<PushNotificationData, 'topic'>) {
    return this.sendNotification({
      ...notification,
      topic,
    });
  }

  /**
   * Send a push notification to all users
   */
  async sendToAll(notification: Omit<PushNotificationData, 'userId' | 'topic'>) {
    return this.sendNotification({
      ...notification,
      topic: 'all', // Assuming you have an 'all' topic
    });
  }

  private async sendNotification(notification: PushNotificationData) {
    try {
      const response = await fetch(`${ENDPOINT}/messaging/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': this.apiKey,
        },
        body: JSON.stringify({
          messageId: `message_${Date.now()}`,
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          ...(notification.userId && {
            users: [notification.userId],
          }),
          ...(notification.topic && {
            topics: [notification.topic],
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Push notification sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Create a topic for users to subscribe to
   */
  async createTopic(topicId: string, name: string) {
    try {
      const response = await fetch(`${ENDPOINT}/messaging/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': this.apiKey,
        },
        body: JSON.stringify({
          topicId,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Topic created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  /**
   * Subscribe a user to a topic
   */
  async subscribeToTopic(userId: string, topicId: string) {
    try {
      const response = await fetch(`${ENDPOINT}/messaging/topics/${topicId}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': this.apiKey,
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('User subscribed to topic successfully:', result);
      return result;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }
}

export const pushNotificationService = new PushNotificationService();

// Example usage functions for easy access
export const sendPushNotification = {
  toUser: (userId: string, title: string, body: string, data?: Record<string, any>) =>
    pushNotificationService.sendToUser(userId, { title, body, data }),

  toTopic: (topic: string, title: string, body: string, data?: Record<string, any>) =>
    pushNotificationService.sendToTopic(topic, { title, body, data }),

  toAll: (title: string, body: string, data?: Record<string, any>) =>
    pushNotificationService.sendToAll({ title, body, data }),
};
