# Spaced Repetition Database Schema for Appwrite

This document describes how to set up the Appwrite collections for the Spaced Repetition feature.

## Collection 1: `spaced_repetition`

Tracks individual topics scheduled for review.

### Attributes:

| Attribute | Type | Size | Required | Default | Notes |
|-----------|------|------|----------|---------|-------|
| userId | string | 36 | Yes | - | User ID reference |
| topicId | string | 36 | Yes | - | Topic ID reference |
| subjectId | string | 36 | Yes | - | Subject ID reference |
| curriculumId | string | 36 | Yes | - | Curriculum ID reference |
| topicName | string | 200 | Yes | - | Cached topic name |
| subjectName | string | 100 | No | - | Cached subject name |
| curriculumName | string | 100 | No | - | Cached curriculum name |
| easeFactor | float | - | No | 2.5 | SM-2 ease factor (min: 1.3, max: 5.0) |
| interval | integer | - | No | 1 | Days until next review |
| repetitions | integer | - | No | 0 | Successful review count |
| nextReviewDate | datetime | - | Yes | - | When to review next |
| lastReviewDate | datetime | - | No | - | Last review timestamp |
| totalReviews | integer | - | No | 0 | Total number of reviews |
| correctReviews | integer | - | No | 0 | Number of correct reviews |
| reviewMode | enum | - | No | "sm2" | Options: ["sm2", "custom"] |
| patternId | string | 50 | No | - | Pattern ID (e.g., "standard") |
| customIntervals | string | 100 | No | - | JSON array like "[1,4,7,14,30]" |
| currentStep | integer | - | No | 0 | Position in pattern |
| status | enum | - | No | "active" | Options: ["active", "paused", "completed", "archived"] |
| emailReminderSent | boolean | - | No | false | Reminder tracking |

### Indexes:

1. **userId_idx** (key)
   - Attributes: `userId`
   - Order: ASC

2. **topicId_idx** (key)
   - Attributes: `topicId`
   - Order: ASC

3. **nextReview_idx** (key)
   - Attributes: `nextReviewDate`
   - Order: ASC

4. **user_nextReview_idx** (key)
   - Attributes: `userId`, `nextReviewDate`
   - Order: ASC, ASC

5. **status_idx** (key)
   - Attributes: `status`
   - Order: ASC

6. **user_status_idx** (key)
   - Attributes: `userId`, `status`
   - Order: ASC, ASC

---

## Collection 2: `user_sr_settings`

User preferences for spaced repetition.

### Attributes:

| Attribute | Type | Size | Required | Default | Notes |
|-----------|------|------|----------|---------|-------|
| userId | string | 36 | Yes | - | User ID (unique per user) |
| emailRemindersEnabled | boolean | - | No | true | Enable email reminders |
| reminderTime | string | 5 | No | "09:00" | HH:MM format |
| timezone | string | 50 | No | "UTC" | User's timezone |
| maxDailyReviews | integer | - | No | 20 | Max reviews per day |
| weekendReminders | boolean | - | No | true | Send weekend reminders |
| reminderDaysBefore | integer | - | No | 0 | Days before to remind |
| reviewMode | enum | - | No | "custom" | Options: ["sm2", "custom"] |
| selectedPatternId | string | 50 | No | "standard" | Selected pattern |
| customIntervals | string | 100 | No | - | Custom pattern intervals |

### Indexes:

1. **userId_unique** (unique)
   - Attributes: `userId`
   - Order: ASC

---

## Setting Up in Appwrite Console

### Step 1: Create Collections

1. Go to your Appwrite Console → Databases → Your Database
2. Click "Create Collection"
3. Name it `spaced_repetition` and note the Collection ID
4. Repeat for `user_sr_settings`

### Step 2: Add Attributes

For each collection, add the attributes as specified in the tables above.

**Creating Enum Attributes:**
- For `reviewMode`: Create a string attribute, then add enum values: `sm2`, `custom`
- For `status`: Create a string attribute, then add enum values: `active`, `paused`, `completed`, `archived`

### Step 3: Add Indexes

Create the indexes as specified for each collection.

### Step 4: Set Permissions

For both collections, set document-level permissions:
- Read: User who owns the document
- Create: Any authenticated user
- Update: User who owns the document  
- Delete: User who owns the document

This is handled automatically by the code when creating documents using:
```javascript
[
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
]
```

---

## Appwrite CLI Commands (Optional)

If you prefer using the Appwrite CLI, here are the commands:

```bash
# Create spaced_repetition collection
appwrite databases createCollection \
  --databaseId "compstudy-db" \
  --collectionId "spaced_repetition" \
  --name "Spaced Repetition"

# Create user_sr_settings collection  
appwrite databases createCollection \
  --databaseId "compstudy-db" \
  --collectionId "user_sr_settings" \
  --name "User SR Settings"
```

Then add attributes and indexes via the console or additional CLI commands.
