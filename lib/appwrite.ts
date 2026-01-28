import { Account, Avatars, Client, Databases, ID, Permission, Query, Role, Storage } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto';

const client = new Client();

export const ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
export const PROJECT_ID = '6955d513000fca8bf0d3'; // Your Appwrite Project ID

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setPlatform('com.compstudy.compstudy');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
export { client, ID, Permission, Query, Role };

export const DB_ID = 'compstudy-db';
export const BUCKET_ID = 'profile-pictures';
export const POST_IMAGES_BUCKET_ID = 'post-images';
export const BLOG_IMAGES_BUCKET_ID = 'blog-images';

export const COLLECTIONS = {
    PROFILES: 'profiles',
    ROOMS: 'rooms',
    ROOM_PARTICIPANTS: 'room_participants',
    DISCUSSIONS: 'discussions',
    GROUPS: 'groups',
    STUDY_SESSIONS: 'study_sessions',
    LIVE_SESSIONS: 'live_sessions',
    POSTS: 'posts',
    COMMENTS: 'comments',
    REACTIONS: 'reactions',
    CURRICULUM: 'curriculum',
    SUBJECTS: 'subjects',
    TOPICS: 'topics',
    PUBLIC_CURRICULUM: 'public_curriculum',
    CURRICULUM_RATINGS: 'curriculum_ratings',
    CONTACT_SUBMISSIONS: 'contact_submissions',
    VISITORS: 'visitors',
    NEWSLETTER_SUBSCRIBERS: 'newsletter_subscribers',
    BLOG_POSTS: 'blog_posts',
    FCM_TOKENS: 'fcm_tokens',
    PUSH_TOKENS: 'push_tokens',
    // Spaced Repetition Collections
    SPACED_REPETITION: 'spaced_repetition',
    USER_SR_SETTINGS: 'user_sr_settings',
};
