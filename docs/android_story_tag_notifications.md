# Android (Kotlin) — Story Tag Notification Deep Link Contract

This doc explains how Android should handle the **“tagged in a story”** notification so the app opens the correct story instead of navigating to Posts/Comments.

## Why you’re currently seeing `/api/v1/posts/comments/` + “Invalid ID”

Your Android app is likely treating all `type=tagged` notifications as **post-tag** and navigating into the Posts/Comments flow.  
When it calls `/api/v1/posts/comments/` **without an id**, Express matches it as `/api/v1/posts/:id` with `id="comments"`, and `paramIDValidationRule` returns **Invalid ID**.

This is a **client mapping issue**, not a backend routing issue.

## Backend contract (FCM `data` payload)

For story tagging pushes, backend sends a **data-only** payload that includes:

- `type`: `tagged`
- `route`: `story_detail`
- `screen`: `story_detail` (backend sets `screen = route` when `route` exists)
- `entityType`: `story`
- `storyID`: `<mongo_story_id>`
- plus existing keys: `title`, `body`, `notificationID`, `image`, `profileImage`

### Backend API to open the story

- `GET /api/v1/story/{storyID}`
  - If story is expired (>24h) or TTL-deleted: backend returns **404** with message **“Story no longer available”**.

## Android mapping (recommended)

### 1) Receive push in `FirebaseMessagingService`

Read `route` first, then `screen`. Route must drive navigation.

```kotlin
override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val data = remoteMessage.data
    val route = data["route"]?.takeIf { it.isNotBlank() } ?: data["screen"]

    if (route == "story_detail") {
        val storyId = data["storyID"]
        if (!storyId.isNullOrBlank()) {
            showNotification(
                title = data["title"] ?: "The Hotel Media",
                body = data["body"] ?: "",
                pendingIntent = deepLinkToStory(storyId)
            )
            return
        }
    }

    // fallback: existing behavior for other notification types
    showNotification(
        title = data["title"] ?: "The Hotel Media",
        body = data["body"] ?: "",
        pendingIntent = openNotificationsScreen()
    )
}
```

### 2) Build a PendingIntent that carries the deep link extras

```kotlin
private fun deepLinkToStory(storyId: String): PendingIntent {
    val intent = Intent(this, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        putExtra("route", "story_detail")
        putExtra("storyID", storyId)
    }
    return PendingIntent.getActivity(
        this,
        storyId.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
}
```

### 3) Handle tap (navigation) in `MainActivity` / DeepLink entry point

```kotlin
private fun handleDeepLink(intent: Intent) {
    val route = intent.getStringExtra("route")
    if (route == "story_detail") {
        val storyId = intent.getStringExtra("storyID") ?: return

        // Call backend and open story viewer
        viewModel.fetchStoryById(storyId)

        // Navigate once you have data (or navigate immediately with storyId and load inside)
        navController.navigate("story_viewer/$storyId")
    }
}
```

### 4) Fetch story and handle “Story no longer available”

When you call `GET /api/v1/story/{storyID}`:
- If HTTP 200: open viewer
- If HTTP 404 and message == “Story no longer available”: show a toast/dialog and go back

## In-app Notifications list click handling

The Notifications list API returns the saved notification with `metadata`. For story tags, metadata contains:
- `metadata.entityType == "story"`
- `metadata.storyID`

So your click handler should do:
- If `type == "tagged"` AND `metadata.entityType == "story"` → open story via `GET /api/v1/story/{storyID}`
- Else keep old behavior (post-tag)









