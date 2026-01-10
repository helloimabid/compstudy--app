// Add this to your login/register flow
import { FCMTokenManager } from '@/services/fcmTokenManager';

// After successful login/registration:
await FCMTokenManager.initializeToken();

// When user logs out:
await FCMTokenManager.clearToken();
