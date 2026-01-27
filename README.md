# CompStudy 📚⏱️

**Study alone, compete together.**

CompStudy is a comprehensive cross-platform study productivity app that transforms solitary studying into a collaborative, motivating experience. Built with React Native and Expo, it features real-time study rooms, advanced timer functionality, curriculum management, global leaderboards, and social features to keep you focused and accountable.

## 🌟 Features

### 🎯 Study Timer & Pomodoro
- **Multiple Timer Modes:**
  - Classic countdown timer (customizable duration)
  - Stopwatch mode for flexible study sessions
  - Pomodoro technique with automatic focus/break cycles
  
- **Advanced Timer Features:**
  - Multiple visual displays: Grid, Circular, Digital, Minimal
  - Customizable themes and colors (Indigo, Emerald, Rose, Amber)
  - Configurable fonts and timer styles
  - Auto-start options for focus and break sessions
  - Background timer support with notifications
  - Haptic feedback and sound notifications
  - Session goals and notes

- **Strict Mode:**
  - Prevents app switching during focus sessions
  - Enforces dedicated study time
  - Helps maintain deep focus

- **Session Tracking:**
  - Automatic session logging to database
  - Duration, subject, and topic tracking
  - Complete study history
  - XP and streak tracking

### 🏠 Study Rooms
- **Create & Join Rooms:**
  - Host private study rooms with unique room codes
  - Join friends' rooms for collaborative studying
  - Public rooms visible to all users
  - Solo study mode for individual sessions

- **Room Features:**
  - Real-time active user count
  - Shared timer state (idle, running, paused)
  - Subject-based room organization
  - Room creator information
  - Live session visibility

- **Live Sessions:**
  - Public/private session modes
  - Real-time peer count
  - View other active studiers
  - Session duration tracking
  - Profile pictures and user stats

### 📊 Statistics & Analytics
- **Personal Stats:**
  - Total study hours tracked
  - Current streak days
  - XP and level progression
  - Subject-wise time distribution
  - Daily study trends
  - Session history

- **Time Range Filters:**
  - Weekly stats
  - Monthly overview
  - All-time achievements

- **Global Statistics:**
  - Total platform users
  - Combined study hours globally
  - Currently active students
  - Recent community sessions

- **Visual Analytics:**
  - Daily study hour trends
  - Subject distribution charts
  - Progress tracking graphs
  - Completion percentages

### 🏆 Leaderboards
- **Global Rankings:**
  - Top 50 students by total hours
  - Real-time leaderboard updates
  - Podium display for top 3 users
  - Profile pictures and avatars
  - User statistics (hours, streak, XP)

- **Social Features:**
  - Tap to view user profiles
  - See other users' study stats
  - Competitive motivation
  - Achievement badges

### 📚 Curriculum Management
- **Three-Tier Organization:**
  - **Curriculums:** Top-level learning paths (e.g., "Computer Science")
  - **Subjects:** Topics within curriculums (e.g., "Data Structures")
  - **Topics:** Individual study items (e.g., "Binary Trees")

- **Topic Management:**
  - Mark topics as completed
  - Track progress through subjects
  - Visual completion indicators
  - Edit and delete items
  - Nested navigation

- **Public Curriculums:**
  - Browse community-shared curriculums
  - Discover learning paths
  - Access curated study materials

### 🌐 Social & Community
- **User Profiles:**
  - Public profile pages
  - Profile pictures
  - Study statistics
  - Achievement display
  - User streaks and hours

- **Blog System:**
  - Browse study tips and articles
  - Read time estimates
  - Publication dates
  - Categorized content
  - Detailed blog post views

### 🔔 Push Notifications
- **Notification Features:**
  - Session completion alerts
  - Break time reminders
  - Streak maintenance notifications
  - Background timer notifications
  - FCM (Firebase Cloud Messaging) integration

- **Notification Management:**
  - Automatic permission requests
  - Token management
  - Topic subscriptions
  - User-specific notifications

### 🎨 Customization
- **Timer Customization:**
  - 4 theme colors (Indigo, Emerald, Rose, Amber)
  - 3 timer styles (Grid, Circular, Digital)
  - Multiple font options
  - Sound toggle
  - Custom durations

- **Session Designer:**
  - Pre-plan study sessions
  - Schedule focus blocks
  - Set session goals
  - Configure Pomodoro cycles

- **Theme Support:**
  - Light and dark mode
  - Automatic system theme detection
  - Consistent color schemes
  - Beautiful gradients

### 💝 Support & Donations
- **Support System:**
  - Multiple donation tiers
  - bKash payment integration
  - Supporter recognition
  - Share app functionality
  - Copy payment information

- **Donation Tiers:**
  - Cup of Tea (৳50)
  - Lunch Treat (৳100)
  - Night Snacks (৳200)
  - Champion (৳500)

### 🔐 Authentication
- **User Management:**
  - Email/password registration
  - Google OAuth login
  - Username availability checking
  - Profile creation
  - Secure session management

- **Profile System:**
  - Automatic profile creation
  - User statistics initialization
  - Profile picture support
  - Username validation

### 📱 Cross-Platform Support
- **Platforms:**
  - iOS (iPhone & iPad)
  - Android
  - Web (limited)

- **Native Features:**
  - Deep linking support
  - App state management
  - Background processing
  - Platform-specific optimizations

## 🛠️ Technology Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tools
- **Expo Router** - File-based routing system
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation library
- **Lucide React Native** - Beautiful icons

### Backend & Services
- **Appwrite** - Backend-as-a-Service
  - Authentication
  - Database (NoSQL)
  - Storage
  - Real-time subscriptions
  - Permissions & security

- **Firebase Cloud Messaging (FCM)** - Push notifications
- **Expo Notifications** - Local notifications

### UI Components & Styling
- **Expo Linear Gradient** - Gradient backgrounds
- **Expo Image** - Optimized image loading
- **React Native Gesture Handler** - Touch interactions
- **React Native Reanimated** - Smooth animations
- **React Native Safe Area Context** - Safe area handling

### Storage & State
- **AsyncStorage** - Local data persistence
- **React Hooks** - State management
- **Context API** - Global state sharing

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Expo Dev Client** - Development builds
- **EAS (Expo Application Services)** - Build and deployment

## 📦 Database Collections

The app uses Appwrite with the following collections:

- **profiles** - User profiles and statistics
- **rooms** - Study room information
- **room_participants** - Room membership
- **study_sessions** - Completed study sessions
- **live_sessions** - Active study sessions
- **curriculum** - User curriculums
- **subjects** - Curriculum subjects
- **topics** - Subject topics
- **blog_posts** - Blog articles
- **fcm_tokens** - Push notification tokens
- **public_curriculum** - Shared curriculums
- **curriculum_ratings** - Curriculum reviews
- **contact_submissions** - User feedback
- **newsletter_subscribers** - Email subscribers
- **visitors** - App analytics

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio & Android Emulator (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd compstudy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Appwrite**
   - Set up an Appwrite project
   - Update `lib/appwrite.ts` with your credentials:
     - `ENDPOINT`
     - `PROJECT_ID`
     - `DB_ID`
     - Collection IDs

4. **Configure Firebase (for push notifications)**
   - Add `google-services.json` for Android
   - Update `app.json` with your configuration

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on your device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

### Development Scripts

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web

# Lint code
npm run lint

# Reset project
npm run reset-project
```

## 📱 App Structure

```
app/
├── (tabs)/              # Main app tabs
│   ├── index.tsx        # Home/Dashboard
│   ├── timer.tsx        # Study Timer
│   ├── rooms.tsx        # Study Rooms & Live Sessions
│   ├── leaderboard.tsx  # Global Leaderboards
│   ├── curriculum.tsx   # Curriculum Management
│   ├── stats.tsx        # Statistics & Analytics
│   └── support.tsx      # Support & Donations
├── room/                # Room-related screens
│   ├── [roomId].tsx     # Room details
│   ├── create.tsx       # Create room
│   └── start.tsx        # Join/Host room
├── blog/                # Blog screens
│   ├── index.tsx        # Blog list
│   └── [slug].tsx       # Blog post
├── profile/             # User profiles
│   └── [userId].tsx     # Profile view
├── curriculum/          # Curriculum screens
│   └── public.tsx       # Public curriculums
├── login.tsx            # Authentication
└── _layout.tsx          # Root layout

components/
├── AppwriteProvider.tsx      # Auth context
├── NativeStudyTimer.tsx      # Timer component
├── SessionDesigner.tsx       # Session planner
├── TimerDisplays.tsx         # Timer UI variants
├── TimerSettings.tsx         # Timer configuration
└── CustomDrawer.tsx          # Navigation drawer

lib/
└── appwrite.ts              # Appwrite configuration

services/
├── pushNotifications.ts     # Push notification service
└── fcmTokenManager.ts       # FCM token management

hooks/
├── useStrictMode.ts         # Strict mode enforcement
├── usePushNotifications.ts  # Notification hooks
└── useOTAUpdates.ts         # Over-the-air updates
```

## 🔧 Configuration

### App Configuration (`app.json`)
- Bundle identifier: `com.compstudy.compstudy`
- OAuth scheme: `appwrite-callback-6955d513000fca8bf0d3`
- Android package: `com.compstudy.compstudy`
- EAS project ID: `b8a1785f-2be9-4b89-bb99-85d4d12e5557`

### Environment Setup
Configure the following in your environment:
- Appwrite endpoint and project ID
- Firebase configuration
- Google Services files
- OAuth redirect URIs

## 🎯 Key Features Breakdown

### Timer Functionality
The timer system supports both countdown and stopwatch modes with:
- Session persistence across app restarts
- Background timer continuation
- Notification scheduling
- Database session logging
- Real-time peer visibility
- Subject and topic linking

### Room System
Study rooms enable collaborative studying:
- Generate unique room codes
- Share codes with friends
- Real-time synchronization
- Public/private modes
- Active user tracking
- Session state management

### Progress Tracking
Comprehensive analytics including:
- Total study time accumulation
- Streak day calculations
- XP and leveling system
- Subject distribution analysis
- Daily trend visualization
- Global ranking position

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

Built with ❤️ by the CompStudy team

## 🔗 Links

- Website: https://compstudy.com
- Support: Available through in-app support page

## 📞 Support

For support, contact through:
- In-app support form
- bKash donations: 01918742161

---

**Study smarter, not harder. Turn isolation into motivation with CompStudy.**
