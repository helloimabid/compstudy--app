import { usePushNotifications } from '@/hooks/usePushNotifications';
import { sendPushNotification } from '@/services/pushNotifications';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PushNotificationExample() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [userId, setUserId] = useState('');
  const [topic, setTopic] = useState('');
  const [pushToken, setPushToken] = useState<string | null>(null);
  
  const {
    requestPermissions,
    getPushToken,
    scheduleLocalNotification,
    getBadgeCount,
    setBadgeCount,
  } = usePushNotifications();

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Push notification permissions are required.');
        return;
      }

      // Get push token
      const token = await getPushToken();
      setPushToken(token);
      
      // Here you would typically save this token to your Appwrite database
      // associated with the user's profile
      console.log('Push token ready to be saved:', token);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const sendToUser = async () => {
    if (!title || !body || !userId) {
      Alert.alert('Error', 'Please fill in title, body, and userId');
      return;
    }

    try {
      await sendPushNotification.toUser(userId, title, body);
      Alert.alert('Success', 'Push notification sent to user');
    } catch (error) {
      Alert.alert('Error', 'Failed to send push notification');
      console.error(error);
    }
  };

  const sendToTopic = async () => {
    if (!title || !body || !topic) {
      Alert.alert('Error', 'Please fill in title, body, and topic');
      return;
    }

    try {
      await sendPushNotification.toTopic(topic, title, body);
      Alert.alert('Success', 'Push notification sent to topic');
    } catch (error) {
      Alert.alert('Error', 'Failed to send push notification');
      console.error(error);
    }
  };

  const sendToAll = async () => {
    if (!title || !body) {
      Alert.alert('Error', 'Please fill in title and body');
      return;
    }

    try {
      await sendPushNotification.toAll(title, body);
      Alert.alert('Success', 'Push notification sent to all users');
    } catch (error) {
      Alert.alert('Error', 'Failed to send push notification');
      console.error(error);
    }
  };

  const sendLocalNotification = async () => {
    if (!title || !body) {
      Alert.alert('Error', 'Please fill in title and body');
      return;
    }

    try {
      await scheduleLocalNotification(title, body, { screen: '/home' });
      Alert.alert('Success', 'Local notification scheduled');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule local notification');
      console.error(error);
    }
  };

  const showBadgeCount = async () => {
    const count = await getBadgeCount();
    Alert.alert('Badge Count', `Current badge count: ${count}`);
  };

  const updateBadgeCount = async (count: number) => {
    await setBadgeCount(count);
    Alert.alert('Success', `Badge count set to ${count}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notification Example</Text>
      
      {pushToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>Push Token:</Text>
          <Text style={styles.token} selectable>
            {pushToken.substring(0, 50)}...
          </Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Notification Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Notification Body"
        value={body}
        onChangeText={setBody}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="User ID (for user-specific notification)"
        value={userId}
        onChangeText={setUserId}
      />

      <TextInput
        style={styles.input}
        placeholder="Topic (for topic-specific notification)"
        value={topic}
        onChangeText={setTopic}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={sendToUser}>
          <Text style={styles.buttonText}>Send to User</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={sendToTopic}>
          <Text style={styles.buttonText}>Send to Topic</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={sendToAll}>
          <Text style={styles.buttonText}>Send to All</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.localButton]} onPress={sendLocalNotification}>
          <Text style={styles.buttonText}>Send Local Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.badgeButton]} onPress={showBadgeCount}>
          <Text style={styles.buttonText}>Show Badge Count</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.badgeButton]} 
          onPress={() => updateBadgeCount(5)}
        >
          <Text style={styles.buttonText}>Set Badge to 5</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  tokenContainer: {
    backgroundColor: '#e8f4fd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    color: '#666',
  },
  token: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  localButton: {
    backgroundColor: '#34C759',
  },
  badgeButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
